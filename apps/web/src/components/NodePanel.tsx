
import { useState } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { getCategoryColor } from '../utils/helpers';

interface NodeType {
  name: string; displayName: string; description: string; category: string; color?: string;
}

interface Props { nodes: NodeType[]; onAddNode: (name: string) => void; }

const categoryLabels: Record<string, string> = {
  trigger: 'Triggers', action: 'Actions', ai: 'AI & LLMs', logic: 'Logic',
  transform: 'Transform', webhook: 'Webhooks', schedule: 'Schedules',
  communication: 'Communication', database: 'Database', custom: 'Custom',
};

export default function NodePanel({ nodes, onAddNode }: Props) {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['trigger', 'action', 'ai', 'logic']));

  const categories = [...new Set(nodes.map(n => n.category))].sort();
  const filtered = nodes.filter(n => n.displayName.toLowerCase().includes(search.toLowerCase()) || n.description.toLowerCase().includes(search.toLowerCase()));

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  return (
    <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">
      <div className="p-3 border-b border-gray-800">
        <h3 className="text-sm font-medium text-white mb-2">Nodes</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search nodes..."
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-forge-500" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {categories.map(cat => {
          const catNodes = filtered.filter(n => n.category === cat);
          if (catNodes.length === 0) return null;
          const isExpanded = expandedCategories.has(cat);
          return (
            <div key={cat} className="mb-1">
              <button onClick={() => toggleCategory(cat)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-gray-400 hover:text-white rounded transition-colors">
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(cat) }} />
                {categoryLabels[cat] || cat} ({catNodes.length})
              </button>
              {isExpanded && (
                <div className="ml-2 space-y-0.5">
                  {catNodes.map(node => (
                    <button key={node.name} onClick={() => onAddNode(node.name)} draggable
                      onDragStart={(e) => e.dataTransfer.setData('application/reactflow-nodetype', node.name)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors group">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: node.color || getCategoryColor(cat) }} />
                        <span className="text-sm text-white group-hover:text-forge-400 transition-colors">{node.displayName}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{node.description}</p>
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
