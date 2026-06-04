import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background, Controls, MiniMap, useNodesState, useEdgesState,
  addEdge, Connection, Edge, Node, ReactFlowProvider, useReactFlow,
  BackgroundVariant, Panel, MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowStore } from '../stores/workflowStore';
import { useNodeStore } from '../stores/nodeStore';
import { generateId, getCategoryColor } from '../utils/helpers';
import NodePanel from '../components/NodePanel';
import NodeConfigPanel from '../components/NodeConfigPanel';
import WorkflowToolbar from '../components/WorkflowToolbar';
import { CustomNode, type NodeStatus } from '../components/CustomNode';
import ExecutionResultsDrawer from '../components/ExecutionResultsDrawer';
import toast from 'react-hot-toast';
import type { WorkflowNode, Connection as WFConnection } from '../types';

const nodeTypes = { customNode: CustomNode };

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  markerEnd: { type: MarkerType.ArrowClosed, color: '#475569', width: 16, height: 16 },
  style: { stroke: '#334155', strokeWidth: 2 },
};

function WorkflowEditorInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const {
    currentWorkflow, fetchWorkflow, createWorkflow, updateWorkflow,
    executeWorkflow, setCurrentWorkflow
  } = useWorkflowStore();
  const { nodeTypes: availableNodes, fetchNodes } = useNodeStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showNodePanel, setShowNodePanel] = useState(true);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeStatus>>({});
  const [executionResults, setExecutionResults] = useState<any>(null);
  const [showResultsDrawer, setShowResultsDrawer] = useState(false);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [editingName, setEditingName] = useState(false);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Load workflow and nodes
  useEffect(() => {
    fetchNodes();
    if (!isNew && id) {
      fetchWorkflow(id).then(() => {});
    }
  }, [id]);

  // Sync workflow data
  useEffect(() => {
    if (currentWorkflow && !isNew) {
      setWorkflowName(currentWorkflow.name || 'Untitled Workflow');
      const flowNodes: Node[] = (currentWorkflow.nodes || []).map((n: WorkflowNode) => ({
        id: n.id, type: 'customNode', position: n.position,
        data: {
          label: n.name, nodeType: n.type, parameters: n.parameters,
          color: getCategoryColor(n.type.split('.')[1] || 'custom'),
          inputs: availableNodes.find(a => a.name === n.type)?.inputs || [],
          outputs: availableNodes.find(a => a.name === n.type)?.outputs || [],
          nodeDef: availableNodes.find(a => a.name === n.type),
          status: 'idle' as NodeStatus,
        },
      }));
      const flowEdges: Edge[] = (currentWorkflow.connections || []).map((c: WFConnection, i: number) => ({
        id: `e${i}`, source: c.sourceNodeId, target: c.targetNodeId,
        sourceHandle: String(c.sourceOutputIndex), targetHandle: String(c.targetInputIndex),
        ...defaultEdgeOptions,
      }));
      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [currentWorkflow, isNew, availableNodes]);

  // Handle creating new workflow
  const handleCreate = useCallback(async () => {
    try {
      const wf = await createWorkflow({
        name: 'New Workflow', nodes: [], connections: [],
        active: false, tags: [], definition: { nodes: [], connections: [] }
      });
      navigate(`/workflow/${wf.id}`, { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create workflow');
    }
  }, [createWorkflow, navigate]);

  useEffect(() => {
    if (isNew) handleCreate();
  }, [isNew]);

  // WebSocket for live execution
  const connectExecutionWs = useCallback((executionId: string) => {
    const wsUrl = `ws://localhost:3001/ws/executions/${executionId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe' }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'node:started') {
          setNodeStatuses(prev => ({ ...prev, [msg.nodeId]: 'running' }));
          setNodes(nds => nds.map(n => n.id === msg.nodeId
            ? { ...n, data: { ...n.data, status: 'running' } } : n));
        } else if (msg.type === 'node:completed') {
          setNodeStatuses(prev => ({ ...prev, [msg.nodeId]: 'success' }));
          setNodes(nds => nds.map(n => n.id === msg.nodeId
            ? { ...n, data: { ...n.data, status: 'success' } } : n));
        } else if (msg.type === 'node:failed') {
          setNodeStatuses(prev => ({ ...prev, [msg.nodeId]: 'error' }));
          setNodes(nds => nds.map(n => n.id === msg.nodeId
            ? { ...n, data: { ...n.data, status: 'error' } } : n));
        } else if (msg.type === 'workflow:completed') {
          setIsExecuting(false);
          toast.success('Workflow completed successfully!');
          setTimeout(() => resetNodeStatuses(), 3000);
          ws.close();
        } else if (msg.type === 'workflow:failed') {
          setIsExecuting(false);
          toast.error(`Workflow failed: ${msg.error || 'Unknown error'}`);
          setTimeout(() => resetNodeStatuses(), 5000);
          ws.close();
        }
      } catch (e) {}
    };

    ws.onerror = () => { setIsExecuting(false); };
  }, []);

  const resetNodeStatuses = useCallback(() => {
    setNodeStatuses({});
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: 'idle' } })));
  }, []);

  // Save workflow
  const handleSave = useCallback(async () => {
    if (!id || isNew) return;
    setIsSaving(true);
    try {
      const workflowNodes: WorkflowNode[] = nodes.map((n) => ({
        id: n.id, name: n.data?.label || 'Node', type: n.data?.nodeType || 'unknown',
        position: n.position, parameters: n.data?.parameters || {},
      }));
      const connections: WFConnection[] = edges.map((e) => ({
        sourceNodeId: e.source, sourceOutputIndex: parseInt(e.sourceHandle || '0'),
        targetNodeId: e.target, targetInputIndex: parseInt(e.targetHandle || '0'),
      }));
      await updateWorkflow(id, {
        name: workflowName,
        nodes: workflowNodes, connections,
        definition: { nodes: workflowNodes, connections },
      });
      toast.success('Workflow saved');
    } catch (err: any) {
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  }, [id, isNew, nodes, edges, updateWorkflow, workflowName]);

  // Execute workflow
  const handleExecute = useCallback(async () => {
    if (!id) return;
    setIsExecuting(true);
    resetNodeStatuses();
    try {
      await handleSave();
      const executionId = await executeWorkflow(id);
      toast('Execution started', { icon: '▶️' });
      connectExecutionWs(executionId);
    } catch (err: any) {
      setIsExecuting(false);
      toast.error('Execution failed: ' + (err.message || 'Unknown error'));
    }
  }, [id, handleSave, executeWorkflow, connectExecutionWs, resetNodeStatuses]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecute();
      }
      if (e.key === 'Escape') {
        setSelectedNode(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave, handleExecute]);

  // Connect nodes
  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({
      ...connection,
      ...defaultEdgeOptions,
      animated: true,
    }, eds));
  }, [setEdges]);

  // Add node from panel
  const onAddNode = useCallback((nodeTypeName: string) => {
    const nodeDef = availableNodes.find(n => n.name === nodeTypeName);
    if (!nodeDef) return;
    const position = {
      x: 200 + Math.random() * 200,
      y: 100 + Math.random() * 200,
    };
    const newNode: Node = {
      id: generateId(), type: 'customNode', position,
      data: {
        label: nodeDef.displayName, nodeType: nodeTypeName,
        parameters: Object.fromEntries(
          (nodeDef.parameters || [])
            .filter((p: any) => p.default !== undefined)
            .map((p: any) => [p.name, p.default])
        ),
        color: nodeDef.color || getCategoryColor(nodeDef.category),
        inputs: nodeDef.inputs, outputs: nodeDef.outputs, nodeDef,
        status: 'idle' as NodeStatus,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    toast.success(`Added ${nodeDef.displayName}`);
  }, [availableNodes, setNodes]);

  // Node click
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Drop node on canvas
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const nodeType = event.dataTransfer.getData('application/reactflow-nodetype');
    if (!nodeType) return;
    const nodeDef = availableNodes.find(n => n.name === nodeType);
    if (!nodeDef) return;
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    const position = screenToFlowPosition({
      x: event.clientX - (bounds?.left || 0),
      y: event.clientY - (bounds?.top || 0),
    });
    const newNode: Node = {
      id: generateId(), type: 'customNode', position,
      data: {
        label: nodeDef.displayName, nodeType,
        parameters: Object.fromEntries(
          (nodeDef.parameters || [])
            .filter((p: any) => p.default !== undefined)
            .map((p: any) => [p.name, p.default])
        ),
        color: nodeDef.color || getCategoryColor(nodeDef.category),
        inputs: nodeDef.inputs, outputs: nodeDef.outputs, nodeDef,
        status: 'idle' as NodeStatus,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [availableNodes, screenToFlowPosition, setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Update selected node
  const onUpdateNode = useCallback((nodeId: string, data: Record<string, unknown>) => {
    setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n));
    setSelectedNode((prev) => prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...data } } : prev);
  }, [setNodes]);

  // Canvas click — deselect
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  if (isNew) return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, #0ea5e9, #818cf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Creating workflow...</p>
      </div>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <WorkflowToolbar
        workflowName={workflowName}
        isSaving={isSaving}
        isExecuting={isExecuting}
        onSave={handleSave}
        onExecute={handleExecute}
        onToggleNodePanel={() => setShowNodePanel(!showNodePanel)}
        onNameChange={setWorkflowName}
        editingName={editingName}
        onEditingNameChange={setEditingName}
        onShowResults={() => setShowResultsDrawer(true)}
        hasResults={!!executionResults}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {showNodePanel && <NodePanel nodes={availableNodes} onAddNode={onAddNode} />}

        <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode="Delete"
            snapToGrid={true}
            snapGrid={[16, 16]}
            style={{ background: 'var(--bg-base)' }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1}
              color="#1e293b"
            />
            <Controls />
            <MiniMap
              nodeColor={(n) => n.data?.color || '#475569'}
              maskColor="rgba(3,7,18,0.7)"
              style={{ background: 'var(--bg-surface)' }}
            />
            <Panel position="top-right" style={{ margin: '8px' }}>
              <div style={{
                fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 8px',
                display: 'flex', gap: 12,
              }}>
                <span title="Save"><kbd>⌘S</kbd> Save</span>
                <span title="Run"><kbd>⌘↵</kbd> Run</span>
                <span title="Delete"><kbd>Del</kbd> Remove</span>
              </div>
            </Panel>
          </ReactFlow>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none', zIndex: 1,
            }}>
              <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>⚡</div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>
                  Drag nodes from the panel or click to add
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                  Start with a Trigger node
                </p>
              </div>
            </div>
          )}
        </div>

        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdate={onUpdateNode}
          />
        )}

        {showResultsDrawer && executionResults && (
          <ExecutionResultsDrawer
            results={executionResults}
            onClose={() => setShowResultsDrawer(false)}
          />
        )}
      </div>
    </div>
  );
}

export default function WorkflowEditor() {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner />
    </ReactFlowProvider>
  );
}
