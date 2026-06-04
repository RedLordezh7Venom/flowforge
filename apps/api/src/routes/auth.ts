import { FastifyInstance } from "fastify";
import "@fastify/jwt";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../lib/hash";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // Register
  app.post("/auth/register", async (req, reply) => {
    const body = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return reply.code(409).send({ error: "Email already registered" });

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: { email: body.email, passwordHash, name: body.name },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    const token = app.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    return { success: true, data: { user, token } };
  });

  // Login
  app.post("/auth/login", async (req, reply) => {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) return reply.code(401).send({ error: "Invalid credentials" });

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) return reply.code(401).send({ error: "Invalid credentials" });

    const token = app.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    return { success: true, data: { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token } };
  });

  // Get current user
  app.get("/auth/me", { onRequest: [app.authenticate] }, async (req) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    return { success: true, data: user };
  });
}
