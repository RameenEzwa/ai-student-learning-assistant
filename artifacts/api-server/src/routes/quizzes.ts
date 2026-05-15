import { Router, type IRouter } from "express";
import { eq, and, avg, desc } from "drizzle-orm";
import { db, quizzesTable, quizResultsTable } from "@workspace/db";
import { SubmitQuizBody, SubmitQuizParams } from "@workspace/api-zod";

const router: IRouter = Router();

function getUserIdFromToken(authHeader: string | undefined): number | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [userId] = decoded.split(":");
    const id = parseInt(userId, 10);
    return isNaN(id) ? null : id;
  } catch {
    return null;
  }
}

router.get("/quizzes", async (_req, res): Promise<void> => {
  const quizzes = await db.select().from(quizzesTable).orderBy(quizzesTable.createdAt);

  res.json(quizzes.map(q => ({
    id: q.id,
    title: q.title,
    subject: q.subject,
    questionCount: (q.questions as any[]).length,
    difficulty: q.difficulty,
    questions: (q.questions as any[]).map(({ correctAnswer: _, ...rest }) => rest),
  })));
});

router.post("/quizzes/:id/submit", async (req, res): Promise<void> => {
  const userId = getUserIdFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SubmitQuizParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SubmitQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, params.data.id));
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }

  const questions = quiz.questions as Array<{ id: number; text: string; options: string[]; correctAnswer: number }>;
  const { answers } = parsed.data;

  let correct = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correctAnswer) correct++;
  });

  const totalQuestions = questions.length;
  const score = Math.round((correct / totalQuestions) * 100);
  const passed = score >= 60;

  const [result] = await db.insert(quizResultsTable).values({
    userId,
    quizId: params.data.id,
    score,
    totalQuestions,
    correct,
    passed,
  }).returning();

  res.json({
    quizId: result.quizId,
    score: result.score,
    totalQuestions: result.totalQuestions,
    correct: result.correct,
    passed: result.passed,
    completedAt: result.completedAt.toISOString(),
  });
});

export default router;
