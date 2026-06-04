import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExecutionStore } from '../stores/executionStore';
import { Clock, RefreshCw, ChevronDown, ChevronRight, XCircle } from 'lucide-react';
import { formatDate, getStatusColor, formatDuration } from '../utils/helpers';

export default function Executions() {
  const { executions, fetchExecutions, fetchExecution, currentExecution, cancelExecution, isLoading } = useExecutionStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchExecutions();
    const interval = setInterval(() => {
      if (executions.some((e: any) => e.status === 'running')) fetchExecutions();
    }, 3000);
    return () => clearInterval(interval);
  }, [executions.length]);

  const refresh = async () => {
    setIsRefreshing(true);
    await fetchExecutions();
    setIsRefreshing(false);
  };

  const filtered = filter === 'all' ? executions : executions.filter((e: any) => e.status === filter);

  const statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Running', value: 'running' },
    { label: 'Success', value: 'success' },
    { label: 'Failed', value: 'failed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Executions</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 13 }}>
            {executions.length} total executions
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={isRefreshing}
          style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)', borderRadius: 8, padding: '7px 14px',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        background: 'var(--bg-elevated)', padding: 4, borderRadius: 10,
        border: '1px solid var(--border-subtle)', width: 'fit-content',
      }}>
        {statusFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: '6px 14px', borderRadius: 7, border: 'none',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              background: filter === f.value ? 'var(--bg-surface)' : 'transparent',
              color: filter === f.value ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: filter === f.value ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
            {f.value !== 'all' && (
              <span style={{
                marginLeft: 5, fontSize: 10,
                color: filter === f.value ? getStatusColor(f.value) : 'var(--text-muted)',
              }}>
                {executions.filter((e: any) => e.status === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Loading executions...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 32px', textAlign: 'center' }}>
            <Clock size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', display: 'block' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>No executions found</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
              {filter !== 'all' ? `No ${filter} executions` : 'Run a workflow to see executions here'}
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '24px 1fr 140px 100px 100px 90px',
              gap: 12, padding: '10px 20px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              {['', 'Workflow', 'Started', 'Duration', 'Mode', 'Status'].map(h => (
                <div key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {h}
                </div>
              ))}
            </div>

            {filtered.map((ex: any, i: number) => (
              <ExecutionRow
                key={ex.id}
                execution={ex}
                isLast={i === filtered.length - 1}
                expanded={expandedId === ex.id}
                onToggle={() => {
                  if (expandedId === ex.id) {
                    setExpandedId(null);
                  } else {
                    setExpandedId(ex.id);
                    fetchExecution(ex.id);
                  }
                }}
                onCancel={() => cancelExecution(ex.id)}
                currentExecution={expandedId === ex.id ? currentExecution : null}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function ExecutionRow({ execution: ex, isLast, expanded, onToggle, onCancel, currentExecution }: any) {
  const statusColor = getStatusColor(ex.status);

  return (
    <>
      <div
        onClick={onToggle}
        style={{
          display: 'grid',
          gridTemplateColumns: '24px 1fr 140px 100px 100px 90px',
          gap: 12, padding: '14px 20px',
          borderBottom: isLast && !expanded ? 'none' : '1px solid rgba(255,255,255,0.04)',
          cursor: 'pointer', transition: 'background 0.15s', alignItems: 'center',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        <div>
          {expanded
            ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
            : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
            {ex.workflow?.name || 'Unknown Workflow'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            #{ex.id.slice(0, 8)}
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {formatDate(ex.startedAt)}
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {formatDuration(ex.startedAt, ex.finishedAt)}
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
          {ex.mode}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0,
            animation: ex.status === 'running' ? 'pulse-glow 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: statusColor }}>
            {ex.status}
          </span>
          {ex.status === 'running' && (
            <button
              onClick={e => { e.stopPropagation(); onCancel(); }}
              title="Cancel execution"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#f87171', padding: 2, borderRadius: 4,
              }}
            >
              <XCircle size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && currentExecution && (
        <div style={{
          background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-subtle)',
          padding: '16px 20px', animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Node Results
          </div>
          {ex.data ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(Array.isArray(ex.data) ? ex.data : []).slice(0, 20).map((nr: any, i: number) => (
                <div key={i} style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  borderRadius: 8, padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: getStatusColor(nr.status || 'success'), flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1, fontFamily: 'monospace' }}>
                    {nr.nodeId || `Node ${i + 1}`}
                  </span>
                  <span style={{ fontSize: 10, color: getStatusColor(nr.status || 'success'), fontWeight: 500 }}>
                    {nr.status || 'success'}
                  </span>
                  {nr.error && (
                    <span style={{ fontSize: 10, color: '#f87171', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {nr.error}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No detailed node data available</p>
          )}
        </div>
      )}
    </>
  );
}
