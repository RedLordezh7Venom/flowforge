import { FastifyInstance } from "fastify";
import IORedis from "ioredis";

const REDIS_URL = process.env["REDIS_URL"] || "redis://127.0.0.1:6379";

// Track active WS connections per executionId
const executionSubscribers = new Map<string, Set<any>>();

// Single shared subscriber connection
let subscriber: IORedis | null = null;

function getSubscriber(): IORedis {
  if (!subscriber) {
    subscriber = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
    subscriber.on("message", (channel: string, message: string) => {
      const executionId = channel.replace("execution:", "");
      const sockets = executionSubscribers.get(executionId);
      if (!sockets || sockets.size === 0) return;
      for (const socket of sockets) {
        try {
          if (socket.readyState === 1 /* OPEN */) {
            socket.send(message);
          }
        } catch (e) {
          sockets.delete(socket);
        }
      }
    });
    subscriber.on("error", (err) => {
      console.error("[WS] Redis subscriber error:", err.message);
    });
  }
  return subscriber;
}

export async function setupWebSocket(app: FastifyInstance) {
  // Execution live updates
  app.get("/ws/executions/:executionId", { websocket: true }, async (connection, req) => {
    const { executionId } = req.params as { executionId: string };
    const socket = connection.socket;
    const sub = getSubscriber();
    const channel = `execution:${executionId}`;

    // Add to subscriber set
    if (!executionSubscribers.has(executionId)) {
      executionSubscribers.set(executionId, new Set());
    }
    const sockets = executionSubscribers.get(executionId)!;
    sockets.add(socket);

    // Subscribe Redis channel
    await sub.subscribe(channel);
    console.log(`[WS] Client connected for execution: ${executionId}`);

    socket.on("message", async (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "subscribe") {
          socket.send(JSON.stringify({ type: "subscribed", executionId }));
        }
      } catch (e) {
        socket.send(JSON.stringify({ type: "error", message: "Invalid message" }));
      }
    });

    socket.on("close", async () => {
      sockets.delete(socket);
      console.log(`[WS] Client disconnected for execution: ${executionId}`);
      if (sockets.size === 0) {
        executionSubscribers.delete(executionId);
        try { await sub.unsubscribe(channel); } catch (e) {}
      }
    });

    socket.on("error", () => {
      sockets.delete(socket);
    });
  });

  // Generic workflow channel for collaboration
  app.get("/ws/workflows/:workflowId", { websocket: true }, (connection, req) => {
    const { workflowId } = req.params as { workflowId: string };
    const socket = connection.socket;
    console.log(`[WS] Workflow channel connected: ${workflowId}`);

    socket.send(JSON.stringify({ type: "connected", workflowId }));

    socket.on("message", (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        socket.send(JSON.stringify({ type: "echo", data }));
      } catch {
        socket.send(JSON.stringify({ type: "error", message: "Invalid message" }));
      }
    });

    socket.on("close", () => {
      console.log(`[WS] Workflow channel disconnected: ${workflowId}`);
    });
  });
}
