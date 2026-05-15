import { Router, type IRouter } from "express";
import { eq, count, desc } from "drizzle-orm";
import { db, usersTable, quizResultsTable, quizzesTable, chatMessagesTable } from "@workspace/db";
import { CreateUserBody, DeleteUserParams } from "@workspace/api-zod";
import { hashPassword } from "./auth";

const router: IRouter = Router();

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    name: usersTable.name,
    role: usersTable.role,
    createdAt: usersTable.createdAt,
  }).from(usersTable).orderBy(usersTable.createdAt);

  res.json(users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, name, role, password } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(400).json({ error: "Email already in use" });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    email,
    name,
    role,
    passwordHash: hashPassword(password),
  }).returning();

  res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  });
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteUserParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ success: true });
});

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const allUsers = await db.select().from(usersTable).orderBy(usersTable.createdAt);

  const totalUsers = allUsers.length;
  const totalStudents = allUsers.filter(u => u.role === "student").length;
  const totalAdmins = allUsers.filter(u => u.role === "admin").length;
  const totalClients = allUsers.filter(u => u.role === "client").length;
  const recentUsers = allUsers.slice(-5).reverse().map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }));

  res.json({ totalUsers, totalStudents, totalAdmins, totalClients, recentUsers });
});

router.get("/admin/activity", async (_req, res): Promise<void> => {
  const quizActivity = await db
    .select({
      id: quizResultsTable.id,
      userId: quizResultsTable.userId,
      score: quizResultsTable.score,
      passed: quizResultsTable.passed,
      completedAt: quizResultsTable.completedAt,
      quizTitle: quizzesTable.title,
      userName: usersTable.name,
    })
    .from(quizResultsTable)
    .leftJoin(quizzesTable, eq(quizResultsTable.quizId, quizzesTable.id))
    .leftJoin(usersTable, eq(quizResultsTable.userId, usersTable.id))
    .orderBy(desc(quizResultsTable.completedAt))
    .limit(20);

  const chatActivity = await db
    .select({
      id: chatMessagesTable.id,
      userId: chatMessagesTable.userId,
      content: chatMessagesTable.content,
      role: chatMessagesTable.role,
      createdAt: chatMessagesTable.createdAt,
      userName: usersTable.name,
    })
    .from(chatMessagesTable)
    .leftJoin(usersTable, eq(chatMessagesTable.userId, usersTable.id))
    .where(eq(chatMessagesTable.role, "user"))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(20);

  const quizItems = quizActivity.map(q => ({
    id: `quiz-${q.id}`,
    type: "quiz" as const,
    userId: q.userId,
    userName: q.userName ?? "Unknown",
    description: `Completed "${q.quizTitle ?? "a quiz"}" — scored ${q.score}%`,
    score: q.score,
    createdAt: q.completedAt.toISOString(),
  }));

  const chatItems = chatActivity.map(c => ({
    id: `chat-${c.id}`,
    type: "chat" as const,
    userId: c.userId,
    userName: c.userName ?? "Unknown",
    description: `Asked: "${c.content.slice(0, 60)}${c.content.length > 60 ? "…" : ""}"`,
    score: undefined as unknown as number,
    createdAt: c.createdAt.toISOString(),
  }));

  const all = [...quizItems, ...chatItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 30);

  res.json(all);
});

router.get("/admin/student-stats", async (_req, res): Promise<void> => {
  const students = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "student"));

  const results = await db
    .select({
      userId: quizResultsTable.userId,
      score: quizResultsTable.score,
      completedAt: quizResultsTable.completedAt,
    })
    .from(quizResultsTable);

  const chatActivity = await db
    .select({
      userId: chatMessagesTable.userId,
      createdAt: chatMessagesTable.createdAt,
    })
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.role, "user"));

  const stats = students.map(s => {
    const studentResults = results.filter(r => r.userId === s.id);
    const totalQuizzes = studentResults.length;
    const averageScore = totalQuizzes > 0
      ? Math.round(studentResults.reduce((sum, r) => sum + r.score, 0) / totalQuizzes)
      : 0;

    const lastQuiz = studentResults.sort((a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )[0];

    const lastChat = chatActivity
      .filter(c => c.userId === s.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    const lastActivityDate = lastQuiz && lastChat
      ? new Date(lastQuiz.completedAt) > new Date(lastChat.createdAt)
        ? lastQuiz.completedAt
        : lastChat.createdAt
      : lastQuiz?.completedAt ?? lastChat?.createdAt ?? s.createdAt;

    return {
      id: s.id,
      name: s.name,
      email: s.email,
      totalQuizzes,
      averageScore,
      lastActive: new Date(lastActivityDate).toISOString(),
    };
  });

  res.json(stats);
});

export default router;
