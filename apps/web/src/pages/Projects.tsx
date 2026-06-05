import { useEffect, useState } from 'react';
import api from '../utils/api';
import { FolderOpen, Plus, Zap, ArrowRight } from 'lucide-react';
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

  const projectColors = ['#155EEF', '#7C3AED', '#F79009', '#12B76A', '#F04438', '#06AED4'];

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto', animation: 'fadeIn 0.25s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Knowledge</h1>
          <p style={{ color: 'var(--text-tertiary)', marginTop: 2, fontSize: 13 }}>
            Organize and manage your workflows in folders and workspace groupings
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
          style={{ fontWeight: 600 }}
        >
          <Plus size={15} strokeWidth={2.5} />
          New Folder
        </button>
      </div>

      {/* Create project modal-style form */}
      {showForm && (
        <div style={{
          background: 'white', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)', padding: '20px 24px', marginBottom: 24,
          boxShadow: 'var(--shadow-md)', animation: 'scaleIn 0.15s ease',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            Create New Folder / Space
          </h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="label">Folder Name *</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Production Automations"
                required className="input"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <input
                type="text" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Describe what this folder contains" className="input"
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                onClick={() => { setShowForm(false); setName(''); setDescription(''); }}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 600 }}>
                Create Folder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-xl)' }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="empty-state" style={{ padding: '64px 32px' }}>
            <div className="empty-state-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <FolderOpen size={24} />
            </div>
            <p className="empty-state-title">No folders found</p>
            <p className="empty-state-desc">
              Create your first project folder to classify and group all related AI automation flows
            </p>
            <button onClick={() => setShowForm(true)} className="btn btn-primary" style={{ marginTop: 20, fontWeight: 600 }}>
              <Plus size={14} /> Create Folder
            </button>
          </div>
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
      className="card card-hover"
      onClick={onOpenWorkflow}
      style={{
        padding: '20px', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', minHeight: 140, position: 'relative',
        overflow: 'hidden', background: 'white',
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: color,
      }} />

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${color}14`, color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FolderOpen size={18} strokeWidth={2.5} />
          </div>
        </div>

        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          {p.name}
        </h3>
        {p.description && (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4, margin: 0 }}>
            {p.description}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={13} style={{ color: 'var(--text-tertiary)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>
            {p._count?.workflows || 0} workflow{p._count?.workflows !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onOpenWorkflow(); }}
          style={{
            background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit',
          }}
        >
          Open <ArrowRight size={12} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
