
import { useState } from 'react';
import { X, Settings } from 'lucide-react';
import type { Node } from 'reactflow';

interface Props { node: Node; onClose: () => void; onUpdate: (id: string, data: Record<string, unknown>) => void; }

export default function NodeConfigPanel({ node, onClose, onUpdate }: Props) {
  const [parameters, setParameters] = useState<Record<string, unknown>>(node.data?.parameters || {});
  const nodeDef = node.data?.nodeDef;

  const handleChange = (key: string, value: unknown) => {
    const updated = { ...parameters, [key]: value };
    setParameters(updated);
    onUpdate(node.id, { parameters: updated });
  };

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: node.data?.color || '#6B7280' }} />
          <h3 className="text-white font-medium">{node.data?.label}</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded transition-colors">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Node Name</label>
          <input type="text" value={String(node.data?.label || '')} onChange={(e) => onUpdate(node.id, { label: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-forge-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
          <p className="text-sm text-gray-300 bg-gray-800 px-3 py-2 rounded-lg">{node.data?.nodeType}</p>
        </div>
        {nodeDef?.parameters?.map((param: any) => (
          <div key={param.name}>
            <label className="block text-xs font-medium text-gray-400 mb-1">{param.displayName}</label>
            {param.type === 'string' && (
              <input type="text" value={String(parameters[param.name] || param.default || '')}
                onChange={(e) => handleChange(param.name, e.target.value)} placeholder={param.placeholder}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-forge-500" />
            )}
            {param.type === 'number' && (
              <input type="number" value={Number(parameters[param.name] ?? param.default ?? 0)}
                onChange={(e) => handleChange(param.name, parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-forge-500" />
            )}
            {param.type === 'boolean' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={Boolean(parameters[param.name] ?? param.default)}
                  onChange={(e) => handleChange(param.name, e.target.checked)}
                  className="w-4 h-4 rounded bg-gray-800 border-gray-600 text-forge-500 focus:ring-forge-500" />
                <span className="text-sm text-gray-300">Enabled</span>
              </label>
            )}
            {param.type === 'select' && (
              <select value={String(parameters[param.name] || param.default || '')}
                onChange={(e) => handleChange(param.name, e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-forge-500">
                {param.options?.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.name}</option>)}
              </select>
            )}
            {param.type === 'code' && (
              <textarea value={String(parameters[param.name] || param.default || '')}
                onChange={(e) => handleChange(param.name, e.target.value)} rows={6}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-forge-500" />
            )}
            {param.type === 'json' && (
              <textarea value={JSON.stringify(parameters[param.name] ?? param.default ?? {}, null, 2)}
                onChange={(e) => { try { handleChange(param.name, JSON.parse(e.target.value)); } catch {} }} rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-forge-500" />
            )}
            {param.description && <p className="text-xs text-gray-500 mt-1">{param.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
