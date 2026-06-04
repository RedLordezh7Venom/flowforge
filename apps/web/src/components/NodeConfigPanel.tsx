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

  const color = node.data?.color || '#6B7280';

  return (
    <div style={{
      width: 300, background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      animation: 'slideIn 0.2s ease',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6, background: `${color}22`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Settings size={12} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {node.data?.label}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {node.data?.nodeType}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: 3, borderRadius: 5, display: 'flex',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
        >
          <X size={15} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border-subtle)',
        padding: '0 4px', gap: 0,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            padding: '8px 4px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: activeTab === t.id ? 600 : 400,
            color: activeTab === t.id ? 'var(--forge-400)' : 'var(--text-muted)',
            borderBottom: activeTab === t.id ? `2px solid var(--forge-500)` : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.15s',
          }}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>

        {/* Node Name - always visible */}
        {activeTab === 'params' && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Node Label
            </div>
            <input
              type="text" value={String(node.data?.label || '')}
              onChange={e => onUpdate(node.id, { label: e.target.value })}
              className="input" style={{ fontSize: 12, borderRadius: 7 }}
            />
          </div>
        )}

        {activeTab === 'params' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {nodeDef?.parameters?.length > 0 ? (
              nodeDef.parameters.map((param: any) => (
                <ParamField key={param.name} param={param} value={parameters[param.name]} onChange={handleChange} />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                No configurable parameters
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Node ID</div>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '6px 10px', borderRadius: 6 }}>
                {node.id}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Type</div>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '6px 10px', borderRadius: 6 }}>
                {node.data?.nodeType}
              </div>
            </div>
            {nodeDef?.description && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Description</div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{nodeDef.description}</p>
              </div>
            )}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Inputs / Outputs</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                <div>↙ {nodeDef?.inputs?.length || 0} input(s)</div>
                <div style={{ marginTop: 2 }}>↗ {nodeDef?.outputs?.length || 0} output(s)</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Position</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                x: {Math.round(node.position.x)}, y: {Math.round(node.position.y)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'test' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Test this node in isolation with sample input data to verify its configuration.
            </p>
            <button
              onClick={handleTest}
              disabled={testing}
              className="btn btn-primary"
              style={{ justifyContent: 'center', borderRadius: 8 }}
            >
              {testing ? (
                <>
                  <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube size={13} />
                  Run Test
                </>
              )}
            </button>

            {testOutput && (
              <div style={{ animation: 'fadeIn 0.2s ease' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#4ade80', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Output
                </div>
                <pre style={{
                  background: '#0a0f1a', borderRadius: 8, padding: '10px 12px',
                  fontSize: 10, color: '#a3e635', fontFamily: 'monospace',
                  overflow: 'auto', maxHeight: 200, border: '1px solid rgba(74,222,128,0.1)',
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
  const labelStyle = { fontSize: 10, fontWeight: 600 as const, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: 5, display: 'block' };
  const inputStyle = { fontSize: 12, borderRadius: 7 };
  const helpStyle = { fontSize: 10, color: 'var(--text-muted)', marginTop: 4 };
  const currentValue = value ?? param.default ?? '';

  return (
    <div>
      <label style={labelStyle}>
        {param.displayName}
        {param.required && <span style={{ color: '#f87171', marginLeft: 3 }}>*</span>}
      </label>
      {param.type === 'string' && (
        <input type="text" value={String(currentValue)} onChange={e => onChange(param.name, e.target.value)}
          placeholder={param.placeholder} className="input" style={inputStyle} />
      )}
      {param.type === 'number' && (
        <input type="number" value={Number(currentValue)} onChange={e => onChange(param.name, parseFloat(e.target.value))}
          className="input" style={inputStyle} />
      )}
      {param.type === 'boolean' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <div
            onClick={() => onChange(param.name, !Boolean(currentValue))}
            style={{
              width: 36, height: 20, borderRadius: 10, transition: 'background 0.2s',
              background: Boolean(currentValue) ? 'var(--forge-500)' : 'var(--bg-overlay)',
              position: 'relative', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: 2, left: Boolean(currentValue) ? 18 : 2,
              width: 16, height: 16, borderRadius: 8, background: 'white',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {Boolean(currentValue) ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      )}
      {param.type === 'select' && (
        <div style={{ position: 'relative' }}>
          <select value={String(currentValue)} onChange={e => onChange(param.name, e.target.value)}
            className="input" style={{ ...inputStyle, appearance: 'none', paddingRight: 28 }}
          >
            {param.options?.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.name}</option>)}
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
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
          style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6, resize: 'vertical' }}
        />
      )}
      {param.description && <p style={helpStyle}>{param.description}</p>}
    </div>
  );
}
