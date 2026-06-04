
export interface WorkflowNode { id: string; name: string; type: string; position: { x: number; y: number }; parameters: Record<string, unknown>; }
export interface Connection { sourceNodeId: string; sourceOutputIndex: number; targetNodeId: string; targetInputIndex: number; }
export interface Workflow { id: string; name: string; description?: string; nodes: WorkflowNode[]; connections: Connection[]; active: boolean; version: number; tags: string[]; projectId?: string; definition?: { nodes: WorkflowNode[]; connections: Connection[] }; }
