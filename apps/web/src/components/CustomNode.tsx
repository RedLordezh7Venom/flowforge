import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Webhook, Clock, MousePointer, Globe, Code2, GitBranch,
  SlidersHorizontal, Bot, MessageSquare, Hash, Filter,
  Shuffle, Timer, Mail, Zap, Database, FileJson,
} from 'lucide-react';

const categoryIcons: Record<string, React.ElementType> = {
  trigger: MousePointer,
  webhook: Webhook,
  schedule: Clock,
  action: Globe,
  ai: Bot,
  logic: GitBranch,
  transform: SlidersHorizontal,
  communication: MessageSquare,
  database: Database,
  custom: Zap,
};

const categoryColors: Record<string, string> = {
  trigger: '#FF9800',
  webhook: '#FF6D5A',
  schedule: '#00C853',
  action: '#4CAF50',
  ai: '#10A37F',
  logic: '#FF5722',
  transform: '#2196F3',
  communication: '#E91E63',
  database: '#795548',
  custom: '#9C27B0',
};

function getNodeIcon(nodeType: string): React.ElementType {
  if (nodeType?.includes('webhook')) return Webhook;
  if (nodeType?.includes('schedule')) return Clock;
  if (nodeType?.includes('manual')) return MousePointer;
  if (nodeType?.includes('http')) return Globe;
  if (nodeType?.includes('code')) return Code2;
  if (nodeType?.includes('if') || nodeType?.includes('switch')) return GitBranch;
  if (nodeType?.includes('set')) return SlidersHorizontal;
  if (nodeType?.includes('openai') || nodeType?.includes('anthropic')) return Bot;
  if (nodeType?.includes('slack') || nodeType?.includes('discord')) return MessageSquare;
  if (nodeType?.includes('email')) return Mail;
  if (nodeType?.includes('filter')) return Filter;
  if (nodeType?.includes('merge')) return Shuffle;
  if (nodeType?.includes('delay')) return Timer;
  if (nodeType?.includes('json')) return FileJson;
  if (nodeType?.includes('number') || nodeType?.includes('count')) return Hash;
  return Zap;
}

export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'skipped';

interface CustomNodeData {
  label: string;
  nodeType: string;
  parameters: Record<string, unknown>;
  color?: string;
  inputs?: { displayName: string; type: string }[];
  outputs?: { displayName: string; type: string }[];
  status?: NodeStatus;
  executionResult?: unknown;
  nodeDef?: { category?: string };
}

function CustomNodeComponent({ data, selected }: NodeProps<CustomNodeData>) {
  const [hovered, setHovered] = useState(false);
  const category = data.nodeDef?.category || data.nodeType?.split('.')[1] || 'custom';
  const color = data.color || categoryColors[category] || '#6B7280';
  const Icon = getNodeIcon(data.nodeType);
  const status = data.status || 'idle';
  const inputs = data.inputs || [];
  const outputs = data.outputs || [];

  const statusColors: Record<NodeStatus, string> = {
    idle: 'transparent',
    running: '#0ea5e9',
    success: '#22c55e',
    error: '#ef4444',
    skipped: '#6b7280',
  };

  const statusGlow: Partial<Record<NodeStatus, string>> = {
    running: '0 0 12px rgba(14,165,233,0.4)',
    success: '0 0 12px rgba(34,197,94,0.3)',
    error: '0 0 12px rgba(239,68,68,0.3)',
  };

  return (
    <div
      className="flow-node"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        minWidth: 180,
        borderColor: selected
          ? '#0ea5e9'
          : hovered
          ? 'rgba(255,255,255,0.18)'
          : 'rgba(255,255,255,0.06)',
        boxShadow: selected
          ? `0 0 0 2px rgba(14,165,233,0.25), 0 4px 24px rgba(0,0,0,0.4)${statusGlow[status] ? ', ' + statusGlow[status] : ''}`
          : statusGlow[status] || (hovered ? '0 4px 24px rgba(0,0,0,0.4)' : 'none'),
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Status bar */}
      <div
        className={`flow-node-status ${status}`}
        style={{
          background: status === 'running'
            ? 'linear-gradient(90deg, #0ea5e9, #818cf8, #0ea5e9)'
            : statusColors[status],
          backgroundSize: status === 'running' ? '200% 100%' : undefined,
          animation: status === 'running' ? 'shimmer 1.5s linear infinite' : undefined,
        }}
      />

      {/* Input handles */}
      {inputs.map((input, i) => (
        <Handle
          key={`input-${i}`}
          type="target"
          position={Position.Left}
          id={String(i)}
          style={{
            background: color,
            top: inputs.length === 1 ? '50%' : `${20 + i * 24}px`,
          }}
          title={input.displayName}
        />
      ))}

      {/* Header */}
      <div className="flow-node-header">
        <div
          className="flow-node-icon"
          style={{ background: `${color}22`, color }}
        >
          <Icon size={14} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className="flow-node-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data.label}
          </div>
          <div className="flow-node-type">
            {category}
          </div>
        </div>
        {status !== 'idle' && (
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: statusColors[status],
            flexShrink: 0,
            boxShadow: statusGlow[status],
          }} />
        )}
      </div>

      {/* Body: show key parameter preview */}
      {data.parameters && Object.keys(data.parameters).length > 0 && (
        <div className="flow-node-body">
          {Object.entries(data.parameters).slice(0, 2).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, textTransform: 'capitalize' }}>
                {key.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}:
              </span>
              <span style={{
                fontSize: 10, color: 'var(--text-secondary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
              }}>
                {String(val).slice(0, 30) || '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Output handles */}
      {outputs.map((output, i) => (
        <Handle
          key={`output-${i}`}
          type="source"
          position={Position.Right}
          id={String(i)}
          style={{
            background: color,
            top: outputs.length === 1 ? '50%' : `${20 + i * 24}px`,
          }}
          title={output.displayName}
        />
      ))}
    </div>
  );
}

export const CustomNode = memo(CustomNodeComponent);
