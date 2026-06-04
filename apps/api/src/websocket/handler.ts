import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

export async function setupWebSocket(app: FastifyInstance) {
  app.get("/ws/executions/:executionId", { websocket: true }, (socket, req) => {
    const { executionId } = req.params as { executionId: string };
    console.log(`WebSocket connected for execution: ${executionId}`);

    socket.on("message", async (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === "subscribe") {
          socket.send(JSON.stringify({ type: "subscribed", executionId }));
          // Send current execution status
          const execution = await prisma.execution.findUnique({ where: { id: executionId } });
          if (execution) socket.send(JSON.stringify({ type: "execution:status", data: execution }));
        }
      } catch (e) { socket.send(JSON.stringify({ type: "error", message: "Invalid message" })); }
    });

    socket.on("close", () => {
      console.log(`WebSocket disconnected for execution: ${executionId}`);
    });
  });

  app.get("/ws/workflows/:workflowId", { websocket: true }, (socket, req) => {
    const { workflowId } = req.params as { workflowId: string };
    console.log(`WebSocket connected for workflow: ${workflowId}`);
    socket.send(JSON.stringify({ type: "connected", workflowId }));
    socket.on("message", (message: string) => {
      try { const data = JSON.parse(message); socket.send(JSON.stringify({ type: "echo", data })); }
      catch { socket.send(JSON.stringify({ type: "error", message: "Invalid message" })); }
    });
  });
}
