import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, quizzesTable, quizResultsTable } from "@workspace/db";
import { SubmitQuizBody, SubmitQuizParams, GenerateQuizBody } from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";

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

router.post("/quizzes/generate", async (req, res): Promise<void> => {
  const userId = getUserIdFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = GenerateQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { topic, difficulty = "medium" } = parsed.data;

  const prompt = `Generate a ${difficulty} difficulty quiz with exactly 5 multiple-choice questions about: "${topic}".

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "questions": [
    {
      "id": 1,
      "text": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0
    }
  ]
}

Rules:
- Each question must have exactly 4 options
- correctAnswer is the 0-based index of the correct option
- Questions should be appropriate for students
- Make sure questions are varied and test different aspects of the topic`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 2048 },
  });

  const raw = response.text ?? "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    res.status(500).json({ error: "Failed to generate quiz. Please try again." });
    return;
  }

  let parsed2: { questions: Array<{ id: number; text: string; options: string[]; correctAnswer: number }> };
  try {
    parsed2 = JSON.parse(jsonMatch[0]);
  } catch {
    res.status(500).json({ error: "Failed to parse generated quiz. Please try again." });
    return;
  }

  if (!Array.isArray(parsed2.questions) || parsed2.questions.length === 0) {
    res.status(500).json({ error: "AI returned an unexpected format. Please try again." });
    return;
  }

  const validQuestions = parsed2.questions.filter(
    (q) =>
      q &&
      typeof q.text === "string" &&
      q.text.trim().length > 0 &&
      Array.isArray(q.options) &&
      q.options.length >= 2 &&
      typeof q.correctAnswer === "number"
  );

  if (validQuestions.length === 0) {
    res.status(500).json({ error: "AI returned questions in an unrecognized format. Please try again." });
    return;
  }

  const normalizedQuestions = validQuestions.map((q, i) => ({
    id: typeof q.id === "number" ? q.id : i + 1,
    text: q.text.trim(),
    options: q.options.map((o: any) => String(o)),
    correctAnswer: Math.max(0, Math.min(q.correctAnswer, q.options.length - 1)),
  }));

  res.json({
    topic,
    difficulty,
    questions: normalizedQuestions,
  });
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
