import "@fastify/jwt";
import { FastifyRequest, FastifyReply } from "fastify";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (...roles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
