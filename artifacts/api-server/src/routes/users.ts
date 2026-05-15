import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
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

export default router;
