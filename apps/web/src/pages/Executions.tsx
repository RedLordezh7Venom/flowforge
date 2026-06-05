import { useEffect, useState } from 'react';
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
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto', animation: 'fadeIn 0.25s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>History</h1>
          <p style={{ color: 'var(--text-tertiary)', marginTop: 2, fontSize: 13 }}>
            Review past executions and debug workflow runs
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="btn btn-secondary btn-sm"
          style={{ fontWeight: 600 }}
        >
          <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="tab-bar" style={{ marginBottom: 20 }}>
        {statusFilters.map(f => {
          const isActive = filter === f.value;
          const count = f.value === 'all' ? executions.length : executions.filter((e: any) => e.status === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`tab ${isActive ? 'active' : ''}`}
              style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: isActive ? 600 : 500 }}
            >
              {f.label}
              <span style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 10,
                background: isActive ? 'var(--primary-light)' : 'var(--bg-hover)',
                color: isActive ? 'var(--primary)' : 'var(--text-tertiary)',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            Loading run history...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '64px 32px' }}>
            <div className="empty-state-icon"><Clock size={22} /></div>
            <p className="empty-state-title">No runs found</p>
            <p className="empty-state-desc">
              {filter !== 'all' ? `No executions marked as "${filter}"` : 'Run a workflow to populate execution logs'}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Workflow Name</th>
                <th>Run ID</th>
                <th>Started At</th>
                <th>Duration</th>
                <th>Trigger Mode</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ex: any) => (
                <ExecutionRow
                  key={ex.id}
                  execution={ex}
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
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ExecutionRow({ execution: ex, expanded, onToggle, onCancel, currentExecution }: any) {
  const statusColor = getStatusColor(ex.status);
  const statusStyles: Record<string, { bg: string; color: string }> = {
    success:   { bg: 'var(--success-bg)', color: '#027A48' },
    failed:    { bg: 'var(--error-bg)',   color: 'var(--error)' },
    running:   { bg: 'var(--primary-light)', color: 'var(--primary)' },
    pending:   { bg: '#F2F4F7', color: 'var(--text-tertiary)' },
    cancelled: { bg: '#F2F4F7', color: 'var(--text-tertiary)' },
  };
  const badgeStyle = statusStyles[ex.status] || statusStyles.pending;

  return (
    <>
      <tr onClick={onToggle} style={{ cursor: 'pointer' }}>
        <td>
          {expanded ? <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />}
        </td>
        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {ex.workflow?.name || 'Unknown Workflow'}
        </td>
        <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-tertiary)' }}>
          {ex.id.slice(0, 8)}
        </td>
        <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          {formatDate(ex.startedAt)}
        </td>
        <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          {formatDuration(ex.startedAt, ex.finishedAt)}
        </td>
        <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)', fontSize: 12 }}>
          {ex.mode}
        </td>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`badge`} style={{ background: badgeStyle.bg, color: badgeStyle.color, fontWeight: 600 }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: statusColor, display: 'inline-block',
                animation: ex.status === 'running' ? 'pulse-dot 1.5s infinite' : 'none',
              }} />
              {ex.status}
            </span>
            {ex.status === 'running' && (
              <button
                onClick={e => { e.stopPropagation(); onCancel(); }}
                title="Cancel execution"
                className="btn btn-ghost btn-sm"
                style={{ padding: 2, borderRadius: 'var(--radius-sm)' }}
              >
                <XCircle size={13} style={{ color: 'var(--error)' }} />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr>
          <td colSpan={7} style={{ background: '#FCFCFD', padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Node Execution Breakdown
            </div>
            {currentExecution?.data || ex.data ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(Array.isArray(currentExecution?.data || ex.data) ? (currentExecution?.data || ex.data) : []).slice(0, 20).map((nr: any, idx: number) => {
                  const itemStyle = statusStyles[nr.status || 'success'] || statusStyles.pending;
                  return (
                    <div
                      key={idx}
                      style={{
                        background: 'white', border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)', padding: '10px 14px',
                        display: 'flex', alignItems: 'center', gap: 10,
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: getStatusColor(nr.status || 'success'), display: 'inline-block',
                      }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1, fontFamily: 'monospace' }}>
                        {nr.nodeId || `Node ${idx + 1}`}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '1px 6px',
                        borderRadius: 999, background: itemStyle.bg, color: itemStyle.color,
                      }}>
                        {nr.status || 'success'}
                      </span>
                      {nr.error && (
                        <span style={{ fontSize: 11, color: 'var(--error)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {nr.error}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>No node execution steps recorded</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
