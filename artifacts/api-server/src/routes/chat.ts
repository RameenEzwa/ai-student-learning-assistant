import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, chatMessagesTable, usersTable } from "@workspace/db";
import { SendMessageBody } from "@workspace/api-zod";

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

const AI_RESPONSES: Record<string, string> = {
  default: "That's a great question! Let me help you understand this topic better. The key is to break it down into smaller, manageable concepts and practice regularly.",
  math: "In mathematics, the best approach is to understand the underlying principles first. Try working through practice problems step by step.",
  science: "Science is all about observation and experimentation. Let's explore the concept systematically.",
  history: "Historical events are best understood in their context. Consider the social, political, and economic factors at play.",
  english: "For language and literature, focus on understanding the author's intent and the historical context of the work.",
};

function generateAIResponse(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes("math") || lower.includes("calculus") || lower.includes("algebra") || lower.includes("equation")) {
    return AI_RESPONSES.math;
  }
  if (lower.includes("science") || lower.includes("physics") || lower.includes("chemistry") || lower.includes("biology")) {
    return AI_RESPONSES.science;
  }
  if (lower.includes("history") || lower.includes("war") || lower.includes("civilization")) {
    return AI_RESPONSES.history;
  }
  if (lower.includes("english") || lower.includes("grammar") || lower.includes("essay") || lower.includes("literature")) {
    return AI_RESPONSES.english;
  }
  return `Thank you for your question about "${content.slice(0, 50)}${content.length > 50 ? "..." : ""}". Based on your query, I recommend reviewing the core concepts and working through practice problems. Would you like me to explain any specific aspect in more detail?`;
}

router.get("/chat/messages", async (req, res): Promise<void> => {
  const userId = getUserIdFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const messages = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, userId))
    .orderBy(asc(chatMessagesTable.createdAt));

  res.json(messages.map(m => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  })));
});

router.post("/chat/messages", async (req, res): Promise<void> => {
  const userId = getUserIdFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.insert(chatMessagesTable).values({
    userId,
    role: "user",
    content: parsed.data.content,
  });

  const aiContent = generateAIResponse(parsed.data.content);
  const [aiMessage] = await db.insert(chatMessagesTable).values({
    userId,
    role: "assistant",
    content: aiContent,
  }).returning();

  res.json({
    id: aiMessage.id,
    role: aiMessage.role,
    content: aiMessage.content,
    createdAt: aiMessage.createdAt.toISOString(),
  });
});

export default router;
