import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, chatMessagesTable } from "@workspace/db";
import { SendMessageBody } from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();

const SYSTEM_INSTRUCTION = `You are a helpful AI tutor for students. Your role is to:
- Answer academic questions clearly and accurately across all subjects (math, science, history, English, etc.)
- Explain concepts step by step when needed
- Encourage learning and critical thinking
- Keep answers concise but thorough — suitable for students
- Use examples to illustrate complex ideas
- Never do homework for students outright; guide them to understand the solution instead`;

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

router.get("/chat/messages", async (req, res): Promise<void> => {
  const userId = getUserIdFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, userId))
    .orderBy(asc(chatMessagesTable.createdAt));

  res.json(
    messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }))
  );
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

  const history = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, userId))
    .orderBy(asc(chatMessagesTable.createdAt));

  const contents = history.map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      maxOutputTokens: 8192,
    },
  });

  const aiContent =
    response.text ??
    "Sorry, I could not generate a response. Please try again.";

  const [aiMessage] = await db
    .insert(chatMessagesTable)
    .values({
      userId,
      role: "assistant",
      content: aiContent,
    })
    .returning();

  res.json({
    id: aiMessage.id,
    role: aiMessage.role,
    content: aiMessage.content,
    createdAt: aiMessage.createdAt.toISOString(),
  });
});

export default router;
