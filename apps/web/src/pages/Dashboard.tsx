import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflowStore } from '../stores/workflowStore';
import { useExecutionStore } from '../stores/executionStore';
import { useAuthStore } from '../stores/authStore';
import {
  Plus, CheckCircle2, XCircle, Activity, Zap,
  ArrowUpRight, MoreHorizontal, Search, Clock, Play,
} from 'lucide-react';
import { formatDate, getStatusColor, formatDuration } from '../utils/helpers';

export default function Dashboard() {
  const navigate = useNavigate();
  const { workflows, fetchWorkflows, isLoading: wfLoading } = useWorkflowStore();
  const { executions, fetchExecutions, isLoading: exLoading } = useExecutionStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchWorkflows();
    fetchExecutions();
  }, []);

  const successCount = executions.filter((e: any) => e.status === 'success').length;
  const failedCount  = executions.filter((e: any) => e.status === 'failed').length;
  const runningCount = executions.filter((e: any) => e.status === 'running').length;

  const filteredWorkflows = workflows.filter((w: any) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto', animation: 'fadeIn 0.25s ease' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
            Studio
          </h1>
          <p style={{ color: 'var(--text-tertiary)', marginTop: 2, fontSize: 13 }}>
            Build and manage your AI workflows
          </p>
        </div>
        <button
          onClick={() => navigate('/workflow/new')}
          className="btn btn-primary"
          style={{ fontSize: 13, fontWeight: 600 }}
        >
          <Plus size={15} strokeWidth={2.5} />
          Create Workflow
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard
          label="Total Workflows"
          value={workflows.length}
          icon={<Zap size={18} />}
          iconBg="#EFF4FF"
          iconColor="var(--primary)"
        />
        <StatCard
          label="Successful Runs"
          value={successCount}
          icon={<CheckCircle2 size={18} />}
          iconBg="#ECFDF3"
          iconColor="#027A48"
        />
        <StatCard
          label="Failed Runs"
          value={failedCount}
          icon={<XCircle size={18} />}
          iconBg="var(--error-bg)"
          iconColor="var(--error)"
        />
        <StatCard
          label="Running Now"
          value={runningCount}
          icon={<Activity size={18} />}
          iconBg="#EFF4FF"
          iconColor="var(--primary)"
          pulse={runningCount > 0}
        />
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

        {/* ── Workflows list ── */}
        <div>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
              All Workflows
            </h2>
            {/* Search bar */}
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={13} style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-disabled)', pointerEvents: 'none',
              }} />
              <input
                type="text"
                placeholder="Search workflows…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input input-sm"
                style={{ paddingLeft: 30, width: '100%' }}
              />
            </div>
          </div>

          {/* Workflow cards */}
          {wfLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-xl)' }} />
              ))}
            </div>
          ) : filteredWorkflows.length === 0 && !searchQuery ? (
            <EmptyWorkflows onCreateClick={() => navigate('/workflow/new')} />
          ) : filteredWorkflows.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No workflows match "{searchQuery}"</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredWorkflows.slice(0, 12).map((w: any) => (
                <WorkflowCard key={w.id} workflow={w} onClick={() => navigate(`/workflow/${w.id}`)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Activity feed ── */}
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
            Recent Activity
          </h2>

          <div className="card" style={{ overflow: 'hidden' }}>
            {exLoading ? (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 44 }} />)}
              </div>
            ) : executions.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 24px' }}>
                <div className="empty-state-icon"><Clock size={22} /></div>
                <p className="empty-state-title">No executions yet</p>
                <p className="empty-state-desc">Run a workflow to see activity here</p>
              </div>
            ) : (
              executions.slice(0, 10).map((ex: any, i: number, arr: any[]) => (
                <ActivityItem key={ex.id} execution={ex} isLast={i === arr.slice(0, 10).length - 1} />
              ))
            )}
            {executions.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-light)' }}>
                <button
                  onClick={() => navigate('/executions')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--primary)', fontSize: 12, fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit',
                  }}
                >
                  View all executions <ArrowUpRight size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function StatCard({ label, value, icon, iconBg, iconColor, pulse = false }: any) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div className="stat-number">{value}</div>
          <div className="stat-label">{label}</div>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: iconBg, color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          animation: pulse ? 'pulse-dot 2s infinite' : 'none',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function WorkflowCard({ workflow: w, onClick }: any) {
  const nodeCount = w.nodes?.length ?? (w.definition?.nodes?.length ?? 0);
  return (
    <div
      className="card card-hover"
      onClick={onClick}
      style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}
    >
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: 'var(--primary-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--primary)', flexShrink: 0,
      }}>
        <Zap size={18} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {w.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
          {nodeCount} node{nodeCount !== 1 ? 's' : ''} · Updated {formatDate(w.updatedAt || w.createdAt)}
        </div>
      </div>

      {/* Status pill */}
      {w.active && (
        <span className="badge badge-success" style={{ flexShrink: 0 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
          Active
        </span>
      )}

      {/* Arrow */}
      <ArrowUpRight size={14} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
    </div>
  );
}

function ActivityItem({ execution: ex, isLast }: any) {
  const statusStyles: Record<string, { bg: string; color: string }> = {
    success:   { bg: 'var(--success-bg)', color: '#027A48' },
    failed:    { bg: 'var(--error-bg)',   color: 'var(--error)' },
    running:   { bg: 'var(--primary-light)', color: 'var(--primary)' },
    pending:   { bg: '#F2F4F7', color: 'var(--text-tertiary)' },
    cancelled: { bg: '#F2F4F7', color: 'var(--text-tertiary)' },
  };
  const style = statusStyles[ex.status] || statusStyles.pending;

  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: isLast ? 'none' : '1px solid var(--border-light)',
      display: 'flex', alignItems: 'center', gap: 10,
      transition: 'background 0.12s', cursor: 'pointer',
    }}
    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
    >
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: getStatusColor(ex.status), flexShrink: 0,
      }} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ex.workflow?.name || 'Workflow'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
          {formatDate(ex.startedAt)}
        </div>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 600, padding: '2px 7px',
        borderRadius: 999, background: style.bg, color: style.color,
        flexShrink: 0, textTransform: 'capitalize',
      }}>
        {ex.status}
      </span>
    </div>
  );
}

function EmptyWorkflows({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="empty-state">
        <div className="empty-state-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
          <Zap size={24} />
        </div>
        <p className="empty-state-title">No workflows yet</p>
        <p className="empty-state-desc">
          Create your first workflow to start automating tasks with AI
        </p>
        <button onClick={onCreateClick} className="btn btn-primary" style={{ marginTop: 20 }}>
          <Plus size={14} />
          Create Workflow
        </button>
      </div>
    </div>
  );
}
