
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
