import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const credentialSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  data: z.record(z.unknown()),
  projectId: z.string(),
});

export async function credentialRoutes(app: FastifyInstance) {
  app.get("/api/credentials", { onRequest: [app.authenticate] }, async (req) => {
    const { projectId } = req.query as Record<string, string>;
    const where = projectId ? { projectId } : {};
    const credentials = await prisma.credential.findMany({ where, orderBy: { updatedAt: "desc" } });
    return { success: true, data: credentials };
  });

  app.post("/api/credentials", { onRequest: [app.authenticate] }, async (req) => {
    const body = credentialSchema.parse(req.body);
    const credential = await prisma.credential.create({ data: { name: body.name, type: body.type, data: body.data as any, projectId: body.projectId } });
    return { success: true, data: credential };
  });

  app.put("/api/credentials/:id", { onRequest: [app.authenticate] }, async (req, reply) => {
    const existing = await prisma.credential.findUnique({ where: { id: (req.params as {id:string}).id } });
    if (!existing) return reply.code(404).send({ error: "Credential not found" });
    const body = credentialSchema.partial().parse(req.body);
    const credential = await prisma.credential.update({ where: { id: existing.id }, data: { ...(body.name && { name: body.name }), ...(body.type && { type: body.type }), ...(body.data && { data: body.data as any }) } });
    return { success: true, data: credential };
  });

  app.delete("/api/credentials/:id", { onRequest: [app.authenticate] }, async (req, reply) => {
    const existing = await prisma.credential.findUnique({ where: { id: (req.params as {id:string}).id } });
    if (!existing) return reply.code(404).send({ error: "Credential not found" });
    await prisma.credential.delete({ where: { id: existing.id } });
    return { success: true, message: "Credential deleted" };
  });
}
