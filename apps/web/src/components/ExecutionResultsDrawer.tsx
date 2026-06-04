import { X, ChevronDown, ChevronRight } from 'lucide-react';

interface NodeResult {
  nodeId: string;
  status: string;
  inputData: unknown[];
  outputData: unknown[];
  error?: string;
  startTime: string;
  endTime?: string;
}

interface Props {
  results: {
    executionId: string;
    status: string;
    nodeResults: NodeResult[];
    startTime: string;
    endTime: string;
  };
  onClose: () => void;
}

export default function ExecutionResultsDrawer({ results, onClose }: Props) {
  return (
    <div style={{
      width: 360, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      animation: 'slideIn 0.2s ease',
    }}>
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Execution Results
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {results.nodeResults.length} nodes · {results.status}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: 4, borderRadius: 6,
        }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {results.nodeResults.map((r, i) => (
          <NodeResultCard key={r.nodeId + i} result={r} />
        ))}
      </div>
    </div>
  );
}

function NodeResultCard({ result }: { result: NodeResult }) {
  const statusColor = {
    success: '#22c55e', failed: '#ef4444', running: '#0ea5e9', skipped: '#6b7280'
  }[result.status] || '#6b7280';

  return (
    <div style={{
      marginBottom: 6, background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {result.nodeId}
        </span>
        <span style={{ fontSize: 10, color: statusColor, fontWeight: 500 }}>
          {result.status}
        </span>
      </div>
      {result.error && (
        <div style={{ padding: '0 12px 10px', fontSize: 11, color: '#f87171' }}>
          {result.error}
        </div>
      )}
      {result.outputData?.length > 0 && (
        <div style={{
          margin: '0 12px 10px', padding: '8px', background: '#0a0f1a',
          borderRadius: 6, fontFamily: 'monospace', fontSize: 10, color: '#a3e635',
          maxHeight: 100, overflowY: 'auto',
        }}>
          {JSON.stringify(result.outputData[0], null, 2).slice(0, 300)}
        </div>
      )}
    </div>
  );
}
