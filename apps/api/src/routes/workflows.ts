import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { addWorkflowJob } from "../lib/queue";

const workflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  definition: z.record(z.unknown()),
  active: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export async function workflowRoutes(app: FastifyInstance) {
  // List workflows
  app.get("/api/workflows", { onRequest: [app.authenticate] }, async (req) => {
    const { projectId, page = "1", limit = "20" } = req.query as Record<string, string>;
    const where = projectId ? { projectId, ownerId: req.user!.id } : { ownerId: req.user!.id };
    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({ where, skip: (parseInt(page) - 1) * parseInt(limit), take: parseInt(limit), orderBy: { updatedAt: "desc" } }),
      prisma.workflow.count({ where }),
    ]);
    return { success: true, data: workflows, meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } };
  });

  // Get single workflow
  app.get("/api/workflows/:id", { onRequest: [app.authenticate] }, async (req, reply) => {
    const workflow = await prisma.workflow.findFirst({ where: { id: (req.params as { id: string }).id, ownerId: req.user!.id }, include: { executions: { orderBy: { startedAt: "desc" }, take: 10 } } });
    if (!workflow) return reply.code(404).send({ error: "Workflow not found" });
    return { success: true, data: workflow };
  });

  // Create workflow
  app.post("/api/workflows", { onRequest: [app.authenticate] }, async (req) => {
    const body = workflowSchema.parse(req.body);
    const workflow = await prisma.workflow.create({
      data: { name: body.name, description: body.description, definition: body.definition as any, active: body.active, tags: body.tags, projectId: (req.body as any).projectId, ownerId: req.user!.id },
    });
    return { success: true, data: workflow };
  });

  // Update workflow
  app.put("/api/workflows/:id", { onRequest: [app.authenticate] }, async (req, reply) => {
    const existing = await prisma.workflow.findFirst({ where: { id: (req.params as { id: string }).id, ownerId: req.user!.id } });
    if (!existing) return reply.code(404).send({ error: "Workflow not found" });
    const body = workflowSchema.partial().parse(req.body);
    const workflow = await prisma.workflow.update({
      where: { id: existing.id },
      data: { ...(body.name && { name: body.name }), ...(body.description !== undefined && { description: body.description }), ...(body.definition && { definition: body.definition as any }), ...(body.active !== undefined && { active: body.active }), ...(body.tags && { tags: body.tags }), version: { increment: 1 } },
    });
    return { success: true, data: workflow };
  });

  // Delete workflow
  app.delete("/api/workflows/:id", { onRequest: [app.authenticate] }, async (req, reply) => {
    const existing = await prisma.workflow.findFirst({ where: { id: (req.params as { id: string }).id, ownerId: req.user!.id } });
    if (!existing) return reply.code(404).send({ error: "Workflow not found" });
    await prisma.workflow.delete({ where: { id: existing.id } });
    return { success: true, message: "Workflow deleted" };
  });

  // Execute workflow
  app.post("/api/workflows/:id/execute", { onRequest: [app.authenticate] }, async (req, reply) => {
    const workflow = await prisma.workflow.findFirst({ where: { id: (req.params as { id: string }).id, ownerId: req.user!.id } });
    if (!workflow) return reply.code(404).send({ error: "Workflow not found" });

    const execution = await prisma.execution.create({
      data: { workflowId: workflow.id, status: "pending", mode: "manual", triggeredBy: req.user!.id },
    });

    await addWorkflowJob(workflow.id, execution.id, (req.body as any)?.triggerData);
    return { success: true, data: { executionId: execution.id, status: "pending" } };
  });
}
