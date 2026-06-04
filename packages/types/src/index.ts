export type UUID = string;

export enum NodeCategory {
  TRIGGER = "trigger",
  ACTION = "action",
  AI = "ai",
  LOGIC = "logic",
  TRANSFORM = "transform",
  WEBHOOK = "webhook",
  SCHEDULE = "schedule",
  COMMUNICATION = "communication",
  DATABASE = "database",
  CUSTOM = "custom",
}

export enum ExecutionStatus {
  PENDING = "pending",
  RUNNING = "running",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELLED = "cancelled",
  TIMEOUT = "timeout",
  WAITING = "waiting",
}

export interface Position {
  x: number;
  y: number;
}

export interface NodeParameter {
  name: string;
  displayName: string;
  type: "string" | "number" | "boolean" | "select" | "multiSelect" | "json" | "code" | "credential" | "collection" | "fixedCollection";
  default?: unknown;
  required?: boolean;
  description?: string;
  options?: Array<{ name: string; value: string }>;
  placeholder?: string;
  typeOptions?: Record<string, unknown>;
}

export interface NodeInput {
  displayName: string;
  type: string;
  required?: boolean;
}

export interface NodeOutput {
  displayName: string;
  type: string;
}

export interface NodeTypeDefinition {
  name: string;
  displayName: string;
  description: string;
  category: NodeCategory;
  icon?: string;
  color?: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  parameters: NodeParameter[];
  execute: (context: NodeExecutionContext) => Promise<NodeExecutionResult>;
}

export interface NodeExecutionContext {
  parameters: Record<string, unknown>;
  inputData: Record<string, unknown>[];
  workflowId: string;
  executionId: string;
  nodeIndex: number;
  getCredential?: (name: string) => Promise<Record<string, unknown> | null>;
  getVariable?: (name: string) => unknown;
  env?: Record<string, string>;
}

export interface NodeExecutionResult {
  data: Record<string, unknown>[];
  error?: string;
}

export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  position: Position;
  parameters: Record<string, unknown>;
  credentials?: Record<string, string>;
  disabled?: boolean;
  notes?: string;
}

export interface NodeConnection {
  sourceNodeId: string;
  sourceOutputIndex: number;
  targetNodeId: string;
  targetInputIndex: number;
}

export interface WorkflowSettings {
  executionOrder: "v1" | "v2";
  saveManualExecutions: boolean;
  callerPolicy: "any" | "none" | "workflowsFromSameOwner";
  errorWorkflow?: string;
  timezone: string;
  executionTimeout: number;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  nodes: WorkflowNode[];
  connections: NodeConnection[];
  settings: WorkflowSettings;
  active: boolean;
  version: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Execution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startedAt: Date;
  finishedAt?: Date;
  data?: Record<string, unknown>;
  error?: string;
  mode: "manual" | "trigger" | "webhook" | "retry" | "internal";
  triggeredBy?: string;
}

export interface ExecutionNodeResult {
  nodeId: string;
  nodeName: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  inputData?: Record<string, unknown>[];
  outputData?: Record<string, unknown>[];
  error?: string;
}

export interface Credential {
  id: string;
  name: string;
  projectId: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatarUrl?: string;
  role: "admin" | "editor" | "viewer";
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookConfig {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  workflowId: string;
  nodeId: string;
  authentication: "none" | "header" | "basic";
  responseMode: "onReceived" | "lastNode" | "responseNode";
}

export interface ScheduleConfig {
  cron: string;
  workflowId: string;
  timezone: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
