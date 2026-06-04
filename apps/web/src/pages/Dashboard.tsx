import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflowStore } from '../stores/workflowStore';
import { useExecutionStore } from '../stores/executionStore';
import { useAuthStore } from '../stores/authStore';
import {
  Plus, Play, Clock, CheckCircle, XCircle, Zap,
  TrendingUp, Activity, ArrowRight, MoreHorizontal, Circle,
} from 'lucide-react';
import { formatDate, getStatusColor, formatDuration } from '../utils/helpers';

export default function Dashboard() {
  const navigate = useNavigate();
  const { workflows, fetchWorkflows, isLoading: wfLoading } = useWorkflowStore();
  const { executions, fetchExecutions, isLoading: exLoading } = useExecutionStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchWorkflows();
    fetchExecutions();
  }, []);

  const successCount = executions.filter(e => e.status === 'success').length;
  const failedCount = executions.filter(e => e.status === 'failed').length;
  const runningCount = executions.filter(e => e.status === 'running').length;
  const recentExecutions = executions.slice(0, 8);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {greeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
            Here's what's happening with your workflows today
          </p>
        </div>
        <button
          onClick={() => navigate('/workflow/new')}
          className="btn btn-primary"
          style={{ borderRadius: 9, padding: '9px 18px', fontSize: 13 }}
        >
          <Plus size={15} />
          New Workflow
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard
          label="Total Workflows"
          value={workflows.length}
          icon={<Zap size={18} />}
          color="#0ea5e9"
          trend={null}
        />
        <StatCard
          label="Successful Runs"
          value={successCount}
          icon={<CheckCircle size={18} />}
          color="#22c55e"
          trend={null}
        />
        <StatCard
          label="Failed Runs"
          value={failedCount}
          icon={<XCircle size={18} />}
          color="#ef4444"
          trend={null}
        />
        <StatCard
          label="Currently Running"
          value={runningCount}
          icon={<Activity size={18} />}
          color="#0ea5e9"
          pulse={runningCount > 0}
          trend={null}
        />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        {/* Workflows */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Your Workflows
            </h2>
            <button
              onClick={() => navigate('/workflow/new')}
              style={{
                background: 'none', border: 'none', color: 'var(--forge-500)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              Create new <ArrowRight size={12} />
            </button>
          </div>

          {wfLoading ? (
            <LoadingSkeleton count={4} />
          ) : workflows.length === 0 ? (
            <EmptyWorkflows onCreateClick={() => navigate('/workflow/new')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {workflows.slice(0, 8).map((w: any) => (
                <WorkflowRow key={w.id} workflow={w} onClick={() => navigate(`/workflow/${w.id}`)} />
              ))}
              {workflows.length > 8 && (
                <button style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: 12, cursor: 'pointer', padding: '8px', textAlign: 'center',
                }}>
                  + {workflows.length - 8} more workflows
                </button>
              )}
            </div>
          )}
        </div>

        {/* Recent executions */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Recent Executions
            </h2>
            <button
              onClick={() => navigate('/executions')}
              style={{
                background: 'none', border: 'none', color: 'var(--forge-500)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              View all <ArrowRight size={12} />
            </button>
          </div>

          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            {exLoading ? (
              <div style={{ padding: 20 }}><LoadingSkeleton count={5} /></div>
            ) : recentExecutions.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Clock size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No executions yet</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                  Run a workflow to see activity
                </p>
              </div>
            ) : (
              recentExecutions.map((ex: any, i: number) => (
                <div
                  key={ex.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: i < recentExecutions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: getStatusColor(ex.status), flexShrink: 0,
                    boxShadow: ex.status === 'running' ? `0 0 6px ${getStatusColor(ex.status)}` : 'none',
                    animation: ex.status === 'running' ? 'pulse-glow 2s infinite' : 'none',
                  }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ex.workflow?.name || 'Unknown Workflow'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {formatDate(ex.startedAt)}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 500,
                    color: getStatusColor(ex.status), flexShrink: 0,
                  }}>
                    {ex.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, pulse = false, trend }: any) {
  return (
    <div className="stat-card" style={{ cursor: 'default' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="stat-number" style={{ color: 'var(--text-primary)' }}>{value}</div>
          <div className="stat-label">{label}</div>
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${color}18`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: pulse ? 'pulse-glow 2s infinite' : 'none',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function WorkflowRow({ workflow, onClick }: any) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 10, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer', transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: 'rgba(14,165,233,0.12)', color: '#38bdf8',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Zap size={16} />
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {workflow.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          v{workflow.version} · {formatDate(workflow.updatedAt || workflow.createdAt)}
        </div>
      </div>
      {workflow.active && (
        <span style={{
          fontSize: 10, fontWeight: 600, color: '#4ade80',
          background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)',
          padding: '2px 8px', borderRadius: 999, flexShrink: 0,
        }}>
          Active
        </span>
      )}
      <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </div>
  );
}

function EmptyWorkflows({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px dashed var(--border-default)',
      borderRadius: 12, padding: '48px 32px', textAlign: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: 'rgba(14,165,233,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px', color: '#38bdf8',
      }}>
        <Zap size={24} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
        No workflows yet
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
        Create your first workflow to start automating tasks with AI
      </p>
      <button onClick={onCreateClick} className="btn btn-primary">
        <Plus size={14} />
        Create Workflow
      </button>
    </div>
  );
}

function LoadingSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          height: 60, background: 'var(--bg-elevated)',
          borderRadius: 8, marginBottom: 8,
          animation: 'pulse 1.5s ease-in-out infinite',
          opacity: 1 - i * 0.15,
        }} />
      ))}
    </>
  );
}
