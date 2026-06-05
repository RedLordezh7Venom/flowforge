import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Webhook, Clock, MousePointer, Globe, Code2, GitBranch,
  SlidersHorizontal, Bot, MessageSquare, Hash, Filter,
  Shuffle, Timer, Mail, Zap, Database, FileJson,
} from 'lucide-react';

const categoryColors: Record<string, string> = {
  trigger: '#FF9800',
  webhook: '#FF6D5A',
  schedule: '#00C853',
  action: '#155EEF',
  ai: '#7C3AED',
  logic: '#EF4444',
  transform: '#06AED4',
  communication: '#EC4899',
  database: '#F79009',
  custom: '#667085',
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
  const color = data.color || categoryColors[category] || '#667085';
  const Icon = getNodeIcon(data.nodeType);
  const status = data.status || 'idle';
  const inputs = data.inputs || [];
  const outputs = data.outputs || [];

  const statusColors: Record<NodeStatus, string> = {
    idle: 'transparent',
    running: '#155EEF',
    success: '#12B76A',
    error: '#F04438',
    skipped: '#98A2B3',
  };

  const statusGlow: Partial<Record<NodeStatus, string>> = {
    running: '0 0 8px rgba(21,94,239,0.3)',
    success: '0 0 8px rgba(18,183,106,0.2)',
    error: '0 0 8px rgba(240,68,56,0.2)',
  };

  return (
    <div
      className="flow-node"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        minWidth: 200,
        borderColor: selected
          ? 'var(--primary-border)'
          : hovered
          ? 'var(--border-strong)'
          : 'var(--border-light)',
        boxShadow: selected
          ? `0 0 0 2px rgba(21,94,239,0.15), var(--shadow-lg)${statusGlow[status] ? ', ' + statusGlow[status] : ''}`
          : statusGlow[status] || (hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)'),
        transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
        background: 'white',
      }}
    >
      {/* Status Bar */}
      <div
        className={`flow-node-status ${status}`}
        style={{
          background: status === 'running'
            ? 'linear-gradient(90deg, #155EEF, #7C3AED, #155EEF)'
            : statusColors[status],
          backgroundSize: status === 'running' ? '200% 100%' : undefined,
          animation: status === 'running' ? 'shimmer 1.5s linear infinite' : undefined,
        }}
      />

      {/* Inputs */}
      {inputs.map((input, i) => (
        <Handle
          key={`input-${i}`}
          type="target"
          position={Position.Left}
          id={String(i)}
          style={{
            background: color,
            top: inputs.length === 1 ? '50%' : `${36 + i * 24}px`,
          }}
          title={input.displayName}
        />
      ))}

      {/* Header */}
      <div className="flow-node-header" style={{ padding: '12px 14px 10px' }}>
        <div
          className="flow-node-icon"
          style={{ background: `${color}14`, color: color }}
        >
          <Icon size={14} strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className="flow-node-title" style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data.label}
          </div>
          <div className="flow-node-type" style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
            {category}
          </div>
        </div>
        {status !== 'idle' && (
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: statusColors[status],
            flexShrink: 0,
            animation: status === 'running' ? 'pulse-dot 1.5s infinite' : 'none',
          }} />
        )}
      </div>

      {/* Body: Preview Node Config parameters */}
      {data.parameters && Object.keys(data.parameters).length > 0 && (
        <div className="flow-node-body" style={{ padding: '8px 14px 12px', borderTop: '1px solid var(--border-light)', background: '#FCFCFD' }}>
          {Object.entries(data.parameters).slice(0, 2).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', gap: 4, marginBottom: 3, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', flexShrink: 0, textTransform: 'capitalize', fontWeight: 500 }}>
                {key.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}:
              </span>
              <span style={{
                fontSize: 10, color: 'var(--text-secondary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                fontFamily: 'monospace',
              }}>
                {typeof val === 'object' ? JSON.stringify(val) : String(val).slice(0, 30) || '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Outputs */}
      {outputs.map((output, i) => (
        <Handle
          key={`output-${i}`}
          type="source"
          position={Position.Right}
          id={String(i)}
          style={{
            background: color,
            top: outputs.length === 1 ? '50%' : `${36 + i * 24}px`,
          }}
          title={output.displayName}
        />
      ))}
    </div>
  );
}

export const CustomNode = memo(CustomNodeComponent);
