import { FastifyInstance } from "fastify";
import "@fastify/jwt";
import { prisma } from "../lib/prisma";

export async function executionRoutes(app: FastifyInstance) {
  app.get("/api/executions", { onRequest: [app.authenticate] }, async (req) => {
    const { workflowId, status, page = "1", limit = "20" } = req.query as Record<string, string>;
    const where: any = {};
    if (workflowId) where.workflowId = workflowId;
    if (status) where.status = status;
    // Only return executions for workflows the user owns
    const workflows = await prisma.workflow.findMany({ where: { ownerId: req.user!.id }, select: { id: true } });
    where.workflowId = { in: workflows.map((w: {id:string}) => w.id) };

    const [executions, total] = await Promise.all([
      prisma.execution.findMany({ where, skip: (parseInt(page) - 1) * parseInt(limit), take: parseInt(limit), orderBy: { startedAt: "desc" }, include: { workflow: { select: { name: true } } } }),
      prisma.execution.count({ where }),
    ]);
    return { success: true, data: executions, meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } };
  });

  app.get("/api/executions/:id", { onRequest: [app.authenticate] }, async (req, reply) => {
    const execution = await prisma.execution.findUnique({ where: { id: (req.params as { id: string }).id }, include: { workflow: { select: { name: true, definition: true } } } });
    if (!execution) return reply.code(404).send({ error: "Execution not found" });
    return { success: true, data: execution };
  });

  app.delete("/api/executions/:id", { onRequest: [app.authenticate] }, async (req, reply) => {
    const existing = await prisma.execution.findUnique({ where: { id: (req.params as { id: string }).id } });
    if (!existing) return reply.code(404).send({ error: "Execution not found" });
    await prisma.execution.delete({ where: { id: existing.id } });
    return { success: true, message: "Execution deleted" };
  });

  app.post("/api/executions/:id/cancel", { onRequest: [app.authenticate] }, async (req, reply) => {
    const existing = await prisma.execution.findUnique({ where: { id: (req.params as { id: string }).id } });
    if (!existing) return reply.code(404).send({ error: "Execution not found" });
    const updated = await prisma.execution.update({ where: { id: existing.id }, data: { status: "cancelled", finishedAt: new Date() } });
    return { success: true, data: updated };
  });
}
