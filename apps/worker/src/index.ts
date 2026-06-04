import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { WorkflowExecutor, NodeRegistry, EventBus, registerBuiltinNodes } from '@flowforge/core';
import { Workflow, ExecutionStatus } from '@flowforge/types';

const REDIS_URL = process.env['REDIS_URL'] || 'redis://127.0.0.1:6379';
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
const pubConnection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

// Use the API's Prisma client at runtime (both run in same monorepo/process environment)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('../../apps/api/node_modules/@prisma/client');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma: any = new PrismaClient();

const registry = new NodeRegistry();
registerBuiltinNodes();

const eventBus = new EventBus();

const executor = new WorkflowExecutor(registry, eventBus, {
  maxExecutionTime: 300000,
  maxNodeExecutionTime: 60000,
  maxRetries: 3,
  retryDelay: 1000,
});

// Publish events to Redis for the API WebSocket layer to pick up
async function publishEvent(executionId: string, type: string, data: Record<string, unknown>) {
  const msg = JSON.stringify({ type, executionId, ...data, timestamp: new Date().toISOString() });
  await pubConnection.publish(`execution:${executionId}`, msg);
}

// Update execution in database
async function updateExecutionInDB(executionId: string, status: string, data?: unknown, error?: string) {
  try {
    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status,
        data: data ? (data as any) : undefined,
        error: error || undefined,
        finishedAt: ['success', 'failed', 'cancelled'].includes(status) ? new Date() : undefined,
      },
    });
  } catch (e) {
    console.error('Failed to update execution in DB:', e);
  }
}

// Get workflow from database
async function getWorkflow(workflowId: string): Promise<Workflow | null> {
  try {
    const wf = await prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!wf) return null;

    const def = wf.definition as any;
    return {
      id: wf.id,
      name: wf.name,
      description: wf.description || undefined,
      projectId: wf.projectId,
      nodes: def?.nodes || [],
      connections: def?.connections || [],
      active: wf.active,
      version: wf.version,
      tags: wf.tags,
      settings: {
        executionOrder: 'v1' as const,
        saveManualExecutions: true,
        callerPolicy: 'any' as const,
        timezone: 'UTC',
        executionTimeout: 300000,
      },
      createdAt: wf.createdAt,
      updatedAt: wf.updatedAt,
    };
  } catch (e) {
    console.error('Failed to get workflow from DB:', e);
    return null;
  }
}

// Wire event bus to publish to Redis pub/sub
eventBus.on('workflow:started', async (d: any) => {
  console.log('Workflow started:', d.executionId);
  await publishEvent(d.executionId, 'workflow:started', d);
});

eventBus.on('workflow:completed', async (d: any) => {
  console.log('Workflow completed:', d.executionId);
  await publishEvent(d.executionId, 'workflow:completed', d);
});

eventBus.on('workflow:failed', async (d: any) => {
  console.error('Workflow failed:', d.executionId, d.error);
  await publishEvent(d.executionId, 'workflow:failed', d);
});

eventBus.on('node:started', async (d: any) => {
  await publishEvent(d.executionId, 'node:started', { nodeId: d.nodeId });
});

eventBus.on('node:completed', async (d: any) => {
  await publishEvent(d.executionId, 'node:completed', { nodeId: d.nodeId });
});

eventBus.on('node:failed', async (d: any) => {
  await publishEvent(d.executionId, 'node:failed', { nodeId: d.nodeId, error: d.error });
});

// Main worker
const worker = new Worker(
  'workflow-execution',
  async (job: Job) => {
    const { workflowId, executionId, triggerData } = job.data as {
      workflowId: string;
      executionId: string;
      triggerData?: unknown;
    };

    console.log(`[Worker] Processing job ${job.id}: workflow=${workflowId}, execution=${executionId}`);

    // Mark as running
    await updateExecutionInDB(executionId, 'running');
    await publishEvent(executionId, 'execution:running', { workflowId });

    try {
      const workflow = await getWorkflow(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      if (!workflow.nodes || workflow.nodes.length === 0) {
        await updateExecutionInDB(executionId, 'failed', null, 'Workflow has no nodes');
        await publishEvent(executionId, 'workflow:failed', { error: 'Workflow has no nodes', workflowId });
        return { status: 'failed', error: 'Workflow has no nodes' };
      }

      const inputData = Array.isArray(triggerData) ? triggerData : triggerData ? [triggerData] : [];
      const result = await executor.execute(workflow, inputData, executionId);

      const finalStatus = result.status === ExecutionStatus.SUCCESS ? 'success' : 'failed';
      await updateExecutionInDB(executionId, finalStatus, result.nodeResults, result.error);

      if (result.status === ExecutionStatus.FAILED) {
        throw new Error(result.error || 'Workflow execution failed');
      }

      console.log(`[Worker] Job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await updateExecutionInDB(executionId, 'failed', undefined, message);
      await publishEvent(executionId, 'workflow:failed', { error: message, workflowId });
      throw error;
    }
  },
  {
    connection: connection as any,
    concurrency: parseInt(process.env['WORKER_CONCURRENCY'] || '5'),
  }
);

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('[Worker] Worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker] Shutting down...');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

console.log('[Worker] FlowForge Worker started');
console.log('[Worker] Connected to Redis at', REDIS_URL);
console.log('[Worker] Concurrency:', process.env['WORKER_CONCURRENCY'] || '5');
