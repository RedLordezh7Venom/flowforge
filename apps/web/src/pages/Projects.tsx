import { useEffect, useState } from 'react';
import api from '../utils/api';
import { FolderOpen, Plus, Zap, ArrowRight, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data || []);
    } catch (err: any) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.post('/projects', { name: name.trim(), description: description.trim() || undefined });
      setName(''); setDescription(''); setShowForm(false);
      toast.success('Project created');
      fetchProjects();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create project');
    }
  };

  const projectColors = ['#0ea5e9', '#818cf8', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'];

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Projects</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 13 }}>
            Organize your workflows into projects
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
          style={{ borderRadius: 9, padding: '9px 18px', fontSize: 13 }}
        >
          <Plus size={15} />
          New Project
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
          borderRadius: 12, padding: '20px 24px', marginBottom: 24,
          animation: 'scaleIn 0.15s ease',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            Create New Project
          </h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Project Name *
              </label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Marketing Automation"
                required className="input"
                style={{ borderRadius: 8 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Description
              </label>
              <input
                type="text" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Optional description" className="input"
                style={{ borderRadius: 8 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type="button"
                onClick={() => { setShowForm(false); setName(''); setDescription(''); }}
                className="btn btn-secondary" style={{ fontSize: 13 }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ fontSize: 13 }}>
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: 140, background: 'var(--bg-elevated)', borderRadius: 12,
              animation: 'pulse 1.5s ease-in-out infinite', opacity: 1 - i * 0.2,
            }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div style={{
          background: 'var(--bg-surface)', border: '1px dashed var(--border-default)',
          borderRadius: 16, padding: '60px 32px', textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'rgba(14,165,233,0.1)', color: '#38bdf8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <FolderOpen size={28} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            No projects yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            Create a project to organize your workflows
          </p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus size={14} /> Create Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {projects.map((p: any, i: number) => (
            <ProjectCard
              key={p.id}
              project={p}
              color={projectColors[i % projectColors.length]}
              onOpenWorkflow={() => navigate(`/?projectId=${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project: p, color, onOpenWorkflow }: any) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 14, padding: '20px', cursor: 'pointer',
        transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = color + '60';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Accent gradient top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${color}, ${color}88)`,
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}18`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FolderOpen size={20} />
        </div>
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
        {p.name}
      </h3>
      {p.description && (
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
          {p.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={13} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {p._count?.workflows || 0} workflow{p._count?.workflows !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={onOpenWorkflow}
          style={{
            background: 'none', border: 'none', color, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          Open <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
