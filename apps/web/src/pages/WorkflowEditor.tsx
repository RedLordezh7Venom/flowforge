
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge, Connection, Edge, Node, ReactFlowProvider, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowStore } from '../stores/workflowStore';
import { useNodeStore } from '../stores/nodeStore';
import { useAuthStore } from '../stores/authStore';
import { generateId, getCategoryColor } from '../utils/helpers';
import NodePanel from '../components/NodePanel';
import NodeConfigPanel from '../components/NodeConfigPanel';
import WorkflowToolbar from '../components/WorkflowToolbar';
import toast from 'react-hot-toast';
import type { WorkflowNode, Connection as WFConnection } from '../types';

const nodeTypes: Record<string, any> = {};

function WorkflowEditorInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { currentWorkflow, fetchWorkflow, createWorkflow, updateWorkflow, executeWorkflow, setCurrentWorkflow } = useWorkflowStore();
  const { nodeTypes: availableNodes, fetchNodes } = useNodeStore();
  const token = useAuthStore((s) => s.token);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showNodePanel, setShowNodePanel] = useState(true);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();

  // Load workflow
  useEffect(() => {
    fetchNodes();
    if (!isNew && id) {
      fetchWorkflow(id).then(() => {});
    }
  }, [id]);

  // Sync workflow data to ReactFlow
  useEffect(() => {
    if (currentWorkflow && !isNew) {
      const flowNodes: Node[] = (currentWorkflow.nodes || []).map((n: WorkflowNode) => ({
        id: n.id, type: 'customNode', position: n.position,
        data: { label: n.name, nodeType: n.type, parameters: n.parameters, color: getCategoryColor(n.type.split('.')[1] || 'custom') },
      }));
      const flowEdges: Edge[] = (currentWorkflow.connections || []).map((c: WFConnection, i: number) => ({
        id: `e${i}`, source: c.sourceNodeId, target: c.targetNodeId,
        sourceHandle: String(c.sourceOutputIndex), targetHandle: String(c.targetInputIndex),
      }));
      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [currentWorkflow, isNew]);

  // Create new workflow
  const handleCreate = async () => {
    try {
      const wf = await createWorkflow({ name: 'New Workflow', nodes: [], connections: [], active: false, tags: [], projectId: '' });
      navigate(`/workflow/${wf.id}`, { replace: true });
    } catch (err: any) { toast.error(err.message); }
  };

  if (isNew) { handleCreate(); return null; }

  // Save workflow
  const handleSave = async () => {
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
      await updateWorkflow(id!, { nodes: workflowNodes, connections, definition: { nodes: workflowNodes, connections } });
      toast.success('Workflow saved');
    } catch (err: any) { toast.error('Failed to save: ' + err.message); }
    finally { setIsSaving(false); }
  };

  // Execute workflow
  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      await handleSave();
      const executionId = await executeWorkflow(id!);
      toast.success('Workflow execution started: ' + executionId);
    } catch (err: any) { toast.error('Execution failed: ' + err.message); }
    finally { setIsExecuting(false); }
  };

  // Connect nodes
  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, type: 'smoothstep', animated: true }, eds));
  }, [setEdges]);

  // Add node from panel
  const onAddNode = useCallback((nodeTypeName: string) => {
    const nodeDef = availableNodes.find(n => n.name === nodeTypeName);
    if (!nodeDef) return;
    const newNode: Node = {
      id: generateId(), type: 'customNode',
      position: { x: 250, y: 100 + nodes.length * 80 },
      data: {
        label: nodeDef.displayName, nodeType: nodeTypeName,
        parameters: {}, color: nodeDef.color || getCategoryColor(nodeDef.category),
        inputs: nodeDef.inputs, outputs: nodeDef.outputs, nodeDef,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [availableNodes, nodes, setNodes]);

  // Node click
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
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
    const position = project({
      x: event.clientX - (bounds?.left || 0),
      y: event.clientY - (bounds?.top || 0),
    });
    const newNode: Node = {
      id: generateId(), type: 'customNode', position,
      data: {
        label: nodeDef.displayName, nodeType,
        parameters: {}, color: nodeDef.color || getCategoryColor(nodeDef.category),
        inputs: nodeDef.inputs, outputs: nodeDef.outputs, nodeDef,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [availableNodes, project, setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Update selected node parameters
  const onUpdateNode = useCallback((nodeId: string, data: Record<string, unknown>) => {
    setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n));
    setSelectedNode((prev) => prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, ...data } } : prev);
  }, [setNodes]);

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <WorkflowToolbar
        workflowName={currentWorkflow?.name || 'Loading...'}
        isSaving={isSaving}
        isExecuting={isExecuting}
        onSave={handleSave}
        onExecute={handleExecute}
        onToggleNodePanel={() => setShowNodePanel(!showNodePanel)}
      />
      <div className="flex flex-1 overflow-hidden">
        {showNodePanel && <NodePanel nodes={availableNodes} onAddNode={onAddNode} />}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes} edges={edges} onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange} onConnect={onConnect}
            onNodeClick={onNodeClick} onDrop={onDrop} onDragOver={onDragOver}
            nodeTypes={nodeTypes} fitView
            className="bg-gray-950"
            defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
          >
            <Background color="#334155" gap={20} />
            <Controls className="bg-gray-800 border border-gray-700" />
            <MiniMap className="bg-gray-900 border border-gray-700" nodeColor="#475569" />
          </ReactFlow>
        </div>
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdate={onUpdateNode}
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
