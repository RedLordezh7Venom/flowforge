import {
  Workflow, WorkflowNode, NodeConnection, ExecutionStatus, NodeExecutionResult,
} from "@flowforge/types";
import { EventBus } from "../events/EventBus";
import { NodeRegistry } from "../registry/NodeRegistry";
import { ExpressionEngine } from "../expressions/ExpressionEngine";
import { WorkflowValidator } from "../validator/WorkflowValidator";

export interface ExecutorOptions {
  maxExecutionTime?: number;
  maxNodeExecutionTime?: number;
  maxRetries?: number;
  retryDelay?: number;
  saveExecutionData?: boolean;
}

export interface NodeExecutionState {
  nodeId: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  inputData: unknown[];
  outputData: unknown[];
  error?: string;
  retries: number;
}

export interface WorkflowExecutionResult {
  executionId: string;
  workflowId: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime: Date;
  nodeResults: NodeExecutionState[];
  error?: string;
}

export class WorkflowExecutor {
  private eventBus: EventBus;
  private registry: NodeRegistry;
  private expressionEngine: ExpressionEngine;
  private validator: WorkflowValidator;
  private options: Required<ExecutorOptions>;

  constructor(registry: NodeRegistry, eventBus?: EventBus, options?: ExecutorOptions) {
    this.registry = registry;
    this.eventBus = eventBus || new EventBus();
    this.expressionEngine = new ExpressionEngine();
    this.validator = new WorkflowValidator();
    this.options = {
      maxExecutionTime: options?.maxExecutionTime ?? 300000,
      maxNodeExecutionTime: options?.maxNodeExecutionTime ?? 60000,
      maxRetries: options?.maxRetries ?? 3,
      retryDelay: options?.retryDelay ?? 1000,
      saveExecutionData: options?.saveExecutionData ?? true,
    };
  }

  async execute(workflow: Workflow, triggerData: unknown[] = [], executionId?: string): Promise<WorkflowExecutionResult> {
    const execId = executionId || crypto.randomUUID();
    const startTime = new Date();
    const nodeResults: NodeExecutionState[] = [];

    this.eventBus.emit("workflow:started", { executionId: execId, workflowId: workflow.id, timestamp: startTime });

    const validation = this.validator.validate(workflow);
    if (!validation.valid) {
      const error = validation.errors.map(e => e.message).join("; ");
      this.eventBus.emit("workflow:failed", { executionId: execId, error });
      return { executionId: execId, workflowId: workflow.id, status: ExecutionStatus.FAILED, startTime, endTime: new Date(), nodeResults, error };
    }

    const nodeMap = new Map(workflow.nodes.map(n => [n.id, n]));
    const adjacency = this.buildAdjacency(workflow.connections);
    const inDegree = this.buildInDegree(workflow.nodes, workflow.connections);
    const triggerNodes = workflow.nodes.filter(n => (inDegree.get(n.id) || 0) === 0);
    const dataStore: Map<string, unknown[]> = new Map();

    for (const t of triggerNodes) dataStore.set(t.id, triggerData.length > 0 ? triggerData : [{}]);

    const queue = [...triggerNodes.map(n => n.id)];
    const executed = new Set<string>();
    let hasError = false;
    let workflowError = "";

    const timeout = setTimeout(() => { hasError = true; workflowError = "Workflow timed out"; }, this.options.maxExecutionTime);

    try {
      while (queue.length > 0 && !hasError) {
        const nodeId = queue.shift()!;
        if (executed.has(nodeId)) continue;
        const node = nodeMap.get(nodeId);
        if (!node || node.disabled) { executed.add(nodeId); continue; }

        const inputData = this.gatherInputData(nodeId, workflow.connections, dataStore);
        const state = await this.executeNode(node, inputData, workflow, execId);
        nodeResults.push(state);

        if (state.status === ExecutionStatus.FAILED) {
          hasError = true;
          workflowError = state.error || "Node failed";
          this.eventBus.emit("node:failed", { executionId: execId, nodeId, error: state.error });
        } else {
          dataStore.set(nodeId, state.outputData);
          this.eventBus.emit("node:completed", { executionId: execId, nodeId, outputData: state.outputData });
        }
        executed.add(nodeId);

        for (const nextId of adjacency.get(nodeId) || []) {
          const nd = (inDegree.get(nextId) || 0) - 1;
          inDegree.set(nextId, nd);
          if (nd === 0) queue.push(nextId);
        }
      }
    } finally { clearTimeout(timeout); }

    const endTime = new Date();
    const status = hasError ? ExecutionStatus.FAILED : ExecutionStatus.SUCCESS;
    this.eventBus.emit(hasError ? "workflow:failed" : "workflow:completed", { executionId: execId, workflowId: workflow.id, status, endTime });

    return { executionId: execId, workflowId: workflow.id, status, startTime, endTime, nodeResults, error: hasError ? workflowError : undefined };
  }

  private async executeNode(node: WorkflowNode, inputData: unknown[], workflow: Workflow, executionId: string): Promise<NodeExecutionState> {
    const startTime = new Date();
    const state: NodeExecutionState = { nodeId: node.id, status: ExecutionStatus.RUNNING, startTime, inputData, outputData: [], retries: 0 };
    this.eventBus.emit("node:started", { executionId, nodeId: node.id, startTime });

    let lastError = "";
    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        const params = this.expressionEngine.evaluateObject(node.parameters, {
          $input: inputData, $json: inputData[0] || {}, $workflow: { id: workflow.id, name: workflow.name }
        });
        const result = await this.runWithTimeout(
          this.registry.executeNode(node.type, {
            parameters: params,
            inputData: inputData.map(d => d && typeof d === "object" ? d as Record<string, unknown> : { value: d }),
            workflowId: workflow.id, executionId, nodeIndex: 0,
            env: process.env as Record<string, string>,
          }),
          this.options.maxNodeExecutionTime
        );
        if (result.error) {
          lastError = result.error;
          state.retries = attempt + 1;
          if (attempt < this.options.maxRetries) { await this.delay(this.options.retryDelay * Math.pow(2, attempt)); continue; }
          state.status = ExecutionStatus.FAILED; state.error = result.error;
        } else {
          state.status = ExecutionStatus.SUCCESS; state.outputData = result.data;
          state.endTime = new Date(); return state;
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        state.retries = attempt + 1;
        if (attempt < this.options.maxRetries) { await this.delay(this.options.retryDelay * Math.pow(2, attempt)); continue; }
        state.status = ExecutionStatus.FAILED; state.error = lastError;
      }
    }
    state.endTime = new Date();
    return state;
  }

  private buildAdjacency(connections: NodeConnection[]): Map<string, string[]> {
    const adj = new Map<string, string[]>();
    for (const c of connections) { if (!adj.has(c.sourceNodeId)) adj.set(c.sourceNodeId, []); adj.get(c.sourceNodeId)!.push(c.targetNodeId); }
    return adj;
  }

  private buildInDegree(nodes: WorkflowNode[], connections: NodeConnection[]): Map<string, number> {
    const d = new Map<string, number>();
    for (const n of nodes) d.set(n.id, 0);
    for (const c of connections) d.set(c.targetNodeId, (d.get(c.targetNodeId) || 0) + 1);
    return d;
  }

  private gatherInputData(nodeId: string, connections: NodeConnection[], dataStore: Map<string, unknown[]>): unknown[] {
    const incoming = connections.filter(c => c.targetNodeId === nodeId);
    if (incoming.length === 0) return [{}];
    const all: unknown[] = [];
    for (const c of incoming) { const sd = dataStore.get(c.sourceNodeId) || []; all.push(...sd); }
    return all.length > 0 ? all : [{}];
  }

  private runWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
      promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
    });
  }

  private delay(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
}
