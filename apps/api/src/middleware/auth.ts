
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
