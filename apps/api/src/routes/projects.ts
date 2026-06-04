import { FastifyInstance } from "fastify";
import "@fastify/jwt";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const projectSchema = z.object({ name: z.string().min(1), description: z.string().optional() });

export async function projectRoutes(app: FastifyInstance) {
  app.get("/api/projects", { onRequest: [app.authenticate] }, async (req) => {
    const projects = await prisma.project.findMany({ where: { ownerId: req.user!.id }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { workflows: true } } } });
    return { success: true, data: projects };
  });

  app.get("/api/projects/:id", { onRequest: [app.authenticate] }, async (req, reply) => {
    const project = await prisma.project.findFirst({ where: { id: (req.params as {id:string}).id, ownerId: req.user!.id }, include: { workflows: { orderBy: { updatedAt: "desc" } }, credentials: true } });
    if (!project) return reply.code(404).send({ error: "Project not found" });
    return { success: true, data: project };
  });

  app.post("/api/projects", { onRequest: [app.authenticate] }, async (req) => {
    const body = projectSchema.parse(req.body);
    const project = await prisma.project.create({ data: { name: body.name, description: body.description, ownerId: req.user!.id } });
    return { success: true, data: project };
  });

  app.put("/api/projects/:id", { onRequest: [app.authenticate] }, async (req, reply) => {
    const existing = await prisma.project.findFirst({ where: { id: (req.params as {id:string}).id, ownerId: req.user!.id } });
    if (!existing) return reply.code(404).send({ error: "Project not found" });
    const body = projectSchema.partial().parse(req.body);
    const project = await prisma.project.update({ where: { id: existing.id }, data: { ...(body.name && { name: body.name }), ...(body.description !== undefined && { description: body.description }) } });
    return { success: true, data: project };
  });

  app.delete("/api/projects/:id", { onRequest: [app.authenticate] }, async (req, reply) => {
    const existing = await prisma.project.findFirst({ where: { id: (req.params as {id:string}).id, ownerId: req.user!.id } });
    if (!existing) return reply.code(404).send({ error: "Project not found" });
    await prisma.project.delete({ where: { id: existing.id } });
    return { success: true, message: "Project deleted" };
  });
}
