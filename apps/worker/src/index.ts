
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { WorkflowExecutor, NodeRegistry, EventBus, registerBuiltinNodes } from '@flowforge/core';
import { Workflow, ExecutionStatus } from '@flowforge/types';

const connection = new IORedis(process.env['REDIS_URL'] || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });

// Setup registry with built-in nodes
const registry = new NodeRegistry();

registerBuiltinNodes();
const eventBus = new EventBus();
const executor = new WorkflowExecutor(registry, eventBus, {
  maxExecutionTime: 300000,
  maxNodeExecutionTime: 60000,
  maxRetries: 3,
  retryDelay: 1000,
});

// Prisma-like interface (direct DB access for worker)
async function getWorkflow(workflowId: string): Promise<Workflow | null> {
  // In production, use Prisma. For now, read from Redis/API
  const data = await connection.get(`workflow:${workflowId}`);
  return data ? JSON.parse(data) : null;
}

async function updateExecution(executionId: string, status: string, data?: unknown, error?: string) {
  await connection.set(`execution:${executionId}`, JSON.stringify({ status, data, error, updatedAt: new Date().toISOString() }));
}

// Event listeners
eventBus.on('workflow:started', (d) => console.log('Workflow started:', d));
eventBus.on('workflow:completed', (d) => console.log('Workflow completed:', d));
eventBus.on('workflow:failed', (d) => console.error('Workflow failed:', d));
eventBus.on('node:started', (d) => console.log('Node started:', d));
eventBus.on('node:completed', (d) => console.log('Node completed:', d));
eventBus.on('node:failed', (d) => console.error('Node failed:', d));

const worker = new Worker('workflow-execution', async (job: Job) => {
  const { workflowId, executionId, triggerData } = job.data as { workflowId: string; executionId: string; triggerData?: unknown };
  console.log(`Processing job ${job.id}: workflow=${workflowId}, execution=${executionId}`);

  await updateExecution(executionId, 'running');

  try {
    const workflow = await getWorkflow(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    const result = await executor.execute(workflow, Array.isArray(triggerData) ? triggerData : [], executionId);

    await updateExecution(executionId, result.status, result.nodeResults, result.error);

    if (result.status === 'failed') {
      throw new Error(result.error || 'Workflow execution failed');
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateExecution(executionId, 'failed', undefined, message);
    throw error;
  }
}, { connection: connection as any, concurrency: 5 });

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err));

console.log('FlowForge Worker started, waiting for jobs...');
console.log('Connected to Redis at', process.env['REDIS_URL'] || 'redis://127.0.0.1:6379');
