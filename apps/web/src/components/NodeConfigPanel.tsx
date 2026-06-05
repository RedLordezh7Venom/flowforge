import { useState } from 'react';
import { X, Settings, Info, TestTube, ChevronDown } from 'lucide-react';
import type { Node } from 'reactflow';

interface Props {
  node: Node;
  onClose: () => void;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
}

type Tab = 'params' | 'info' | 'test';

export default function NodeConfigPanel({ node, onClose, onUpdate }: Props) {
  const [parameters, setParameters] = useState<Record<string, unknown>>(node.data?.parameters || {});
  const [activeTab, setActiveTab] = useState<Tab>('params');
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const nodeDef = node.data?.nodeDef;

  const handleChange = (key: string, value: unknown) => {
    const updated = { ...parameters, [key]: value };
    setParameters(updated);
    onUpdate(node.id, { parameters: updated });
  };

  const handleTest = async () => {
    setTesting(true);
    setTestOutput(null);
    await new Promise(r => setTimeout(r, 800));
    setTestOutput(JSON.stringify({
      status: 'success',
      output: { message: 'Test run successful', nodeId: node.id, nodeType: node.data?.nodeType }
    }, null, 2));
    setTesting(false);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'params', label: 'Parameters', icon: <Settings size={13} /> },
    { id: 'info', label: 'Info', icon: <Info size={13} /> },
    { id: 'test', label: 'Test', icon: <TestTube size={13} /> },
  ];

  const color = node.data?.color || '#667085';

  return (
    <div style={{
      width: 320, background: 'white',
      borderLeft: '1px solid var(--border-light)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      animation: 'slideInRight 0.2s ease',
      fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border-light)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6, background: `${color}14`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Settings size={12} strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {node.data?.label}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
            {node.data?.nodeType?.split('.').pop()}
          </div>
        </div>
        <button
          onClick={onClose}
          className="btn btn-ghost btn-sm"
          style={{ padding: 4, borderRadius: 'var(--radius-sm)' }}
        >
          <X size={15} style={{ color: 'var(--text-tertiary)' }} />
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ padding: '0 8px' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`tab ${activeTab === t.id ? 'active' : ''}`}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              fontSize: 12, padding: '10px 4px',
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* Node Label Config */}
        {activeTab === 'params' && (
          <div style={{ marginBottom: 16 }}>
            <label className="label" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 10 }}>
              Node Label
            </label>
            <input
              type="text" value={String(node.data?.label || '')}
              onChange={e => onUpdate(node.id, { label: e.target.value })}
              className="input"
            />
          </div>
        )}

        {activeTab === 'params' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {nodeDef?.parameters?.length > 0 ? (
              nodeDef.parameters.map((param: any) => (
                <ParamField key={param.name} param={param} value={parameters[param.name]} onChange={handleChange} />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)', fontSize: 12 }}>
                No configurable parameters
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 10 }}>Node ID</label>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                {node.id}
              </div>
            </div>
            <div>
              <label className="label" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 10 }}>Type</label>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                {node.data?.nodeType}
              </div>
            </div>
            {nodeDef?.description && (
              <div>
                <label className="label" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 10 }}>Description</label>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{nodeDef.description}</p>
              </div>
            )}
            <div>
              <label className="label" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 10 }}>Inputs / Outputs</label>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                <div>↙ {nodeDef?.inputs?.length || 0} Input(s)</div>
                <div style={{ marginTop: 3 }}>↗ {nodeDef?.outputs?.length || 0} Output(s)</div>
              </div>
            </div>
            <div>
              <label className="label" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 10 }}>Canvas Position</label>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                X: {Math.round(node.position.x)}, Y: {Math.round(node.position.y)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'test' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Verify this node's parameters by executing a mockup test run.
            </p>
            <button
              onClick={handleTest}
              disabled={testing}
              className="btn btn-primary"
              style={{ width: '100%', fontWeight: 600 }}
            >
              {testing ? (
                <>
                  <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube size={13} />
                  Run Test Node
                </>
              )}
            </button>

            {testOutput && (
              <div style={{ animation: 'fadeIn 0.2s ease', marginTop: 8 }}>
                <label className="label" style={{ color: 'var(--success)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 10 }}>
                  Test Execution Output
                </label>
                <pre style={{
                  background: '#F9FAFB', borderRadius: 'var(--radius-md)', padding: '10px 12px',
                  fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace',
                  overflow: 'auto', maxHeight: 240, border: '1px solid var(--border-default)',
                }}>
                  {testOutput}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ParamField({ param, value, onChange }: { param: any; value: unknown; onChange: (k: string, v: unknown) => void }) {
  const currentValue = value ?? param.default ?? '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label className="label">
        {param.displayName}
        {param.required && <span style={{ color: 'var(--error)', marginLeft: 3 }}>*</span>}
      </label>

      {param.type === 'string' && (
        <input
          type="text" value={String(currentValue)} onChange={e => onChange(param.name, e.target.value)}
          placeholder={param.placeholder} className="input"
        />
      )}

      {param.type === 'number' && (
        <input
          type="number" value={Number(currentValue)} onChange={e => onChange(param.name, parseFloat(e.target.value))}
          className="input"
        />
      )}

      {param.type === 'boolean' && (
        <label className="toggle">
          <input
            type="checkbox" checked={Boolean(currentValue)}
            onChange={e => onChange(param.name, e.target.checked)}
          />
          <span className="toggle-track" />
          <span className="toggle-thumb" />
        </label>
      )}

      {param.type === 'select' && (
        <div style={{ position: 'relative' }}>
          <select
            value={String(currentValue)} onChange={e => onChange(param.name, e.target.value)}
            className="input" style={{ appearance: 'none', paddingRight: 28 }}
          >
            {param.options?.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.name}</option>)}
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
        </div>
      )}

      {(param.type === 'code' || param.type === 'json') && (
        <textarea
          value={param.type === 'json'
            ? JSON.stringify(currentValue ?? param.default ?? {}, null, 2)
            : String(currentValue)}
          onChange={e => {
            if (param.type === 'json') {
              try { onChange(param.name, JSON.parse(e.target.value)); } catch {}
            } else {
              onChange(param.name, e.target.value);
            }
          }}
          rows={param.type === 'code' ? 6 : 4}
          className="input"
          style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 1.5, resize: 'vertical' }}
        />
      )}

      {param.description && <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{param.description}</p>}
    </div>
  );
}
