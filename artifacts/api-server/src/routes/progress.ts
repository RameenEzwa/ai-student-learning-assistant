import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, quizResultsTable, quizzesTable } from "@workspace/db";

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

router.get("/progress", async (req, res): Promise<void> => {
  const userId = getUserIdFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const results = await db
    .select({
      id: quizResultsTable.id,
      quizId: quizResultsTable.quizId,
      score: quizResultsTable.score,
      passed: quizResultsTable.passed,
      completedAt: quizResultsTable.completedAt,
      subject: quizzesTable.subject,
    })
    .from(quizResultsTable)
    .leftJoin(quizzesTable, eq(quizResultsTable.quizId, quizzesTable.id))
    .where(eq(quizResultsTable.userId, userId))
    .orderBy(desc(quizResultsTable.completedAt));

  const totalQuizzes = results.length;
  const averageScore = totalQuizzes > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalQuizzes)
    : 0;

  const subjectCounts: Record<string, number> = {};
  results.forEach(r => {
    if (r.subject) subjectCounts[r.subject] = (subjectCounts[r.subject] || 0) + 1;
  });
  const topSubject = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None";

  const completionRate = totalQuizzes > 0
    ? Math.round((results.filter(r => r.passed).length / totalQuizzes) * 100)
    : 0;

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const dayStr = day.toDateString();
    if (results.some(r => new Date(r.completedAt).toDateString() === dayStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  res.json({ totalQuizzes, averageScore, topSubject, streak, completionRate });
});

router.get("/progress/reports", async (req, res): Promise<void> => {
  const userId = getUserIdFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const results = await db
    .select({
      id: quizResultsTable.id,
      score: quizResultsTable.score,
      passed: quizResultsTable.passed,
      completedAt: quizResultsTable.completedAt,
      quizTitle: quizzesTable.title,
      subject: quizzesTable.subject,
    })
    .from(quizResultsTable)
    .leftJoin(quizzesTable, eq(quizResultsTable.quizId, quizzesTable.id))
    .where(eq(quizResultsTable.userId, userId))
    .orderBy(desc(quizResultsTable.completedAt));

  res.json(results.map(r => ({
    id: r.id,
    quizTitle: r.quizTitle ?? "Unknown",
    subject: r.subject ?? "Unknown",
    score: r.score,
    passed: r.passed,
    completedAt: r.completedAt.toISOString(),
  })));
});

router.get("/progress/performance", async (req, res): Promise<void> => {
  const userId = getUserIdFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const results = await db
    .select({
      score: quizResultsTable.score,
      completedAt: quizResultsTable.completedAt,
      subject: quizzesTable.subject,
    })
    .from(quizResultsTable)
    .leftJoin(quizzesTable, eq(quizResultsTable.quizId, quizzesTable.id))
    .where(eq(quizResultsTable.userId, userId))
    .orderBy(desc(quizResultsTable.completedAt))
    .limit(30);

  res.json(results.reverse().map(r => ({
    date: r.completedAt.toISOString().split("T")[0],
    score: r.score,
    subject: r.subject ?? "Unknown",
  })));
});

export default router;
