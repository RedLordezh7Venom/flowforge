import { Workflow, WorkflowNode, NodeConnection } from "@flowforge/types";

export interface ValidationError {
  type: "error" | "warning";
  nodeId?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export class WorkflowValidator {
  validate(workflow: Workflow): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push({ type: "error", message: "Workflow must have at least one node" });
      return { valid: false, errors, warnings };
    }

    const nodeIds = new Set<string>();
    for (const node of workflow.nodes) {
      if (nodeIds.has(node.id))
        errors.push({ type: "error", nodeId: node.id, message: `Duplicate node ID: ${node.id}` });
      nodeIds.add(node.id);
      if (!node.type)
        errors.push({ type: "error", nodeId: node.id, message: `Node "${node.name}" has no type` });
    }

    for (const conn of workflow.connections) {
      if (!nodeIds.has(conn.sourceNodeId))
        errors.push({ type: "error", message: `Unknown source node: ${conn.sourceNodeId}` });
      if (!nodeIds.has(conn.targetNodeId))
        errors.push({ type: "error", message: `Unknown target node: ${conn.targetNodeId}` });
      if (conn.sourceNodeId === conn.targetNodeId)
        errors.push({ type: "error", nodeId: conn.sourceNodeId, message: "Node cannot connect to itself" });
    }

    if (this.hasCycle(workflow.nodes, workflow.connections))
      errors.push({ type: "error", message: "Workflow contains a cycle" });

    const connected = new Set<string>();
    for (const c of workflow.connections) { connected.add(c.sourceNodeId); connected.add(c.targetNodeId); }
    for (const n of workflow.nodes) {
      if (!connected.has(n.id) && workflow.nodes.length > 1)
        warnings.push({ type: "warning", nodeId: n.id, message: `Node "${n.name}" is disconnected` });
    }

    const hasTrigger = workflow.nodes.some(n => n.type.includes("trigger"));
    if (!hasTrigger && workflow.nodes.length > 0)
      warnings.push({ type: "warning", message: "Workflow has no trigger nodes" });

    return { valid: errors.length === 0, errors, warnings };
  }

  private hasCycle(nodes: WorkflowNode[], connections: NodeConnection[]): boolean {
    const adj = new Map<string, string[]>();
    for (const n of nodes) adj.set(n.id, []);
    for (const c of connections) adj.get(c.sourceNodeId)?.push(c.targetNodeId);
    const visited = new Set<string>();
    const stack = new Set<string>();
    const dfs = (id: string): boolean => {
      visited.add(id); stack.add(id);
      for (const nb of adj.get(id) || []) {
        if (!visited.has(nb)) { if (dfs(nb)) return true; }
        else if (stack.has(nb)) return true;
      }
      stack.delete(id); return false;
    };
    for (const n of nodes) if (!visited.has(n.id) && dfs(n.id)) return true;
    return false;
  }

  topologicalSort(nodes: WorkflowNode[], connections: NodeConnection[]): WorkflowNode[] {
    const adj = new Map<string, string[]>();
    const inDeg = new Map<string, number>();
    for (const n of nodes) { adj.set(n.id, []); inDeg.set(n.id, 0); }
    for (const c of connections) { adj.get(c.sourceNodeId)?.push(c.targetNodeId); inDeg.set(c.targetNodeId, (inDeg.get(c.targetNodeId) || 0) + 1); }
    const q: string[] = [];
    for (const [id, d] of inDeg.entries()) if (d === 0) q.push(id);
    const sorted: WorkflowNode[] = [];
    const map = new Map(nodes.map(n => [n.id, n]));
    while (q.length > 0) {
      const cur = q.shift()!;
      const node = map.get(cur); if (node) sorted.push(node);
      for (const nb of adj.get(cur) || []) {
        const nd = (inDeg.get(nb) || 0) - 1; inDeg.set(nb, nd);
        if (nd === 0) q.push(nb);
      }
    }
    return sorted;
  }
}
