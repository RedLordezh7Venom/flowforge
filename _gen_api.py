
import os
base = "/root/flowforge"
def w(path, content):
    full = os.path.join(base, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w') as f:
        f.write(content)
    print(f"  {path}")

print("=== PRISMA SCHEMA ===")

w("apps/api/prisma/schema.prisma", r"""
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  avatarUrl    String?
  role         String   @default("editor")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  projects     Project[]
  ownedWorkflows Workflow[] @relation("WorkflowOwner")
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  workflows   Workflow[]
  credentials Credential[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Workflow {
  id          String   @id @default(cuid())
  name        String
  description String?
  definition  Json     // Full workflow definition (nodes, connections, settings)
  active      Boolean  @default(false)
  version     Int      @default(1)
  tags        String[] @default([])
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  ownerId     String
  owner       User     @relation("WorkflowOwner", fields: [ownerId], references: [id])
  executions  Execution[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId])
  @@index([ownerId])
}

model Execution {
  id         String   @id @default(cuid())
  workflowId String
  workflow   Workflow @relation(fields: [workflowId], references: [id])
  status     String   // pending, running, success, failed, cancelled, timeout
  mode       String   @default("manual")
  data       Json?    // Execution data / results
  error      String?
  startedAt  DateTime @default(now())
  finishedAt DateTime?
  triggeredBy String?

  @@index([workflowId])
  @@index([status])
}

model Credential {
  id        String   @id @default(cuid())
  name      String
  type      String
  data      Json     // Encrypted credential data
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([projectId])
}

model NodeDefinition {
  id          String   @id @default(cuid())
  name        String   @unique
  type        String
  category    String
  displayName String
  description String?
  icon        String?
  color       String?
  inputs      Json     @default("[]")
  outputs     Json     @default("[]")
  parameters  Json     @default("[]")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
""")

print("=== API SOURCE FILES ===")

w("apps/api/src/lib/prisma.ts", r"""
import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ["query", "error", "warn"] });
if (process.env["NODE_ENV"] !== "production") globalForPrisma.prisma = prisma;
""")

w("apps/api/src/lib/redis.ts", r"""
import Redis from "ioredis";
const redisUrl = process.env["REDIS_URL"] || "redis://localhost:6379";
export const redis = new Redis(redisUrl, { maxRetriesPerRequest: 3, retryStrategy: (times) => Math.min(times * 100, 3000) });
redis.on("error", (err) => console.error("Redis error:", err));
redis.on("connect", () => console.log("Redis connected"));
""")

w("apps/api/src/lib/queue.ts", r"""
import { Queue, Worker } from "ioredis";
import IORedis from "ioredis";
const connection = new IORedis(process.env["REDIS_URL"] || "redis://localhost:6379", { maxRetriesPerRequest: null });
export const workflowQueue = new Queue("workflow-execution", { connection });
export async function addWorkflowJob(workflowId: string, executionId: string, triggerData?: unknown) {
  return workflowQueue.add("execute", { workflowId, executionId, triggerData }, {
    attempts: 3, backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100, removeOnFail: 50,
  });
}
""")

w("apps/api/src/lib/hash.ts", r"""
import bcrypt from "bcryptjs";
const SALT_ROUNDS = 12;
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
""")

w("apps/api/src/middleware/auth.ts", r"""
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";

export async function registerAuth(app: FastifyInstance) {
  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = request.headers.authorization?.replace("Bearer ", "");
      if (!token) { reply.code(401).send({ error: "Missing token" }); return; }
      const decoded = await request.jwtVerify<{ sub: string; email: string; role: string }>();
      const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user) { reply.code(401).send({ error: "User not found" }); return; }
      request.user = user;
    } catch {
      reply.code(401).send({ error: "Invalid token" });
    }
  });

  app.decorate("authorize", (...roles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) { reply.code(401).send({ error: "Not authenticated" }); return; }
      if (!roles.includes(request.user.role)) { reply.code(403).send({ error: "Forbidden" }); return; }
    };
  });
}

declare module "fastify" {
  interface FastifyRequest { user?: { id: string; email: string; name: string; role: string; }; }
  interface FastifyInstance { authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>; authorize: (...roles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>; }
}
""")

print("API lib + middleware files written")
