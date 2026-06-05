import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Zap } from 'lucide-react';
import { getCategoryColor } from '../utils/helpers';

interface NodeType {
  name: string;
  displayName: string;
  description: string;
  category: string;
  color?: string;
}

interface Props {
  nodes: NodeType[];
  onAddNode: (name: string) => void;
}

const categoryLabels: Record<string, string> = {
  trigger: 'Triggers',
  action: 'Actions',
  ai: 'AI & LLMs',
  logic: 'Logic',
  transform: 'Transform',
  webhook: 'Webhooks',
  schedule: 'Schedules',
  communication: 'Communication',
  database: 'Database',
  custom: 'Custom',
};

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

export default function NodePanel({ nodes, onAddNode }: Props) {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['trigger', 'action', 'ai', 'logic']));

  const categories = [...new Set(nodes.map(n => n.category))].sort();
  const filtered = nodes.filter(n =>
    n.displayName.toLowerCase().includes(search.toLowerCase()) ||
    n.description.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  return (
    <div style={{
      width: 260, background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-light)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      flexShrink: 0, fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    }}>
      {/* Search Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)', background: 'white' }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
          Nodes Gallery
        </h3>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-disabled)', pointerEvents: 'none',
          }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes..."
            className="input input-sm"
            style={{ paddingLeft: 30, width: '100%' }}
          />
        </div>
      </div>

      {/* Nodes list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {categories.map(cat => {
          const catNodes = filtered.filter(n => n.category === cat);
          if (catNodes.length === 0) return null;
          const isExpanded = expandedCategories.has(cat);
          const catColor = categoryColors[cat] || getCategoryColor(cat);

          return (
            <div key={cat} style={{ marginBottom: 8 }}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 8px', border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
                  textAlign: 'left', borderRadius: 'var(--radius-sm)', transition: 'background 0.12s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: catColor, display: 'inline-block',
                }} />
                <span style={{ flex: 1 }}>{categoryLabels[cat] || cat}</span>
                <span style={{ fontSize: 10, color: 'var(--text-disabled)', fontWeight: 500 }}>
                  {catNodes.length}
                </span>
              </button>

              {/* Category items */}
              {isExpanded && (
                <div style={{ marginTop: 2, display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 10 }}>
                  {catNodes.map(node => (
                    <button
                      key={node.name}
                      onClick={() => onAddNode(node.name)}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('application/reactflow-nodetype', node.name)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 10px',
                        border: '1px solid transparent', background: 'transparent',
                        borderRadius: 'var(--radius-md)', cursor: 'grab',
                        transition: 'all 0.12s', fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'white';
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-light)';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: 4,
                          background: `${catColor}14`, color: catColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Zap size={10} strokeWidth={2.5} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                          {node.displayName}
                        </span>
                      </div>
                      <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {node.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
