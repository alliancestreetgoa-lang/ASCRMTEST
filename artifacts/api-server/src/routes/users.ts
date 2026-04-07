import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { db, usersTable } from "@workspace/db";
import {
  CreateUserBody,
  UpdateUserParams,
  UpdateUserBody,
  UpdateUserResponse,
  DeleteUserParams,
  ListUsersResponse,
} from "@workspace/api-zod";

function hashPassword(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

const router: IRouter = Router();

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(ListUsersResponse.parse(users));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.insert(usersTable).values(parsed.data).returning();
  res.status(201).json(user);
});

router.put("/users/:id", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(UpdateUserResponse.parse(user));
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.delete(usersTable).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { identifier, password } = req.body as { identifier?: string; password?: string };
  if (!identifier || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const hashed = hashPassword(password.trim());
  const trimmed = identifier.trim();

  // Try username match first, then email
  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, trimmed));

  if (!user) {
    [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, trimmed));
  }

  // Also try case-insensitive email fallback
  if (!user) {
    const all = await db.select().from(usersTable);
    user = all.find(u =>
      u.email.toLowerCase() === trimmed.toLowerCase() ||
      (u.username && u.username.toLowerCase() === trimmed.toLowerCase())
    )!;
  }

  if (!user || user.password !== hashed) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    status: user.status,
    permissions: user.permissions ?? null,
    region: user.region ?? "All",
  });
});

router.patch("/users/:id/permissions", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const { permissions } = req.body as { permissions?: string[] | null };
  if (permissions !== null && permissions !== undefined && !Array.isArray(permissions)) {
    res.status(400).json({ error: "permissions must be an array or null" });
    return;
  }

  const newValue = permissions === null || permissions === undefined
    ? null
    : JSON.stringify(permissions);

  const [user] = await db
    .update(usersTable)
    .set({ permissions: newValue })
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ success: true, permissions: user.permissions });
});

router.patch("/users/:id/password", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const { newPassword } = req.body as { newPassword?: string };
  if (!newPassword || newPassword.trim().length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ password: hashPassword(newPassword.trim()) })
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ success: true });
});

export default router;
