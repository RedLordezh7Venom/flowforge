import { Save, Play, PanelLeft, History, Settings2, CheckCircle2 } from 'lucide-react';

interface Props {
  workflowName: string;
  isSaving: boolean;
  isExecuting: boolean;
  onSave: () => void;
  onExecute: () => void;
  onToggleNodePanel: () => void;
  onNameChange: (name: string) => void;
  editingName: boolean;
  onEditingNameChange: (v: boolean) => void;
  onShowResults: () => void;
  hasResults: boolean;
}

export default function WorkflowToolbar({
  workflowName, isSaving, isExecuting, onSave, onExecute,
  onToggleNodePanel, onNameChange, editingName, onEditingNameChange,
  onShowResults, hasResults,
}: Props) {
  return (
    <div style={{
      height: 52, background: 'white',
      borderBottom: '1px solid var(--border-light)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', gap: 8, flexShrink: 0,
      fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    }}>
      {/* Left: panel toggle + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, overflow: 'hidden' }}>
        <button
          onClick={onToggleNodePanel}
          title="Toggle node panel"
          className="btn btn-ghost btn-sm"
          style={{ padding: 6, borderRadius: 'var(--radius-md)' }}
        >
          <PanelLeft size={16} style={{ color: 'var(--text-tertiary)' }} />
        </button>

        <div style={{ width: 1, height: 18, background: 'var(--border-light)' }} />

        {/* Workflow name — inline edit */}
        {editingName ? (
          <input
            autoFocus
            value={workflowName}
            onChange={e => onNameChange(e.target.value)}
            onBlur={() => onEditingNameChange(false)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                onEditingNameChange(false);
              }
            }}
            className="input input-sm"
            style={{ width: 220, fontSize: 13, fontWeight: 600 }}
          />
        ) : (
          <div
            onClick={() => onEditingNameChange(true)}
            title="Click to rename"
            style={{
              cursor: 'pointer',
              color: 'var(--text-primary)', fontSize: 13, fontWeight: 600,
              padding: '4px 8px', borderRadius: 'var(--radius-md)',
              transition: 'background 0.12s',
              maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            {workflowName}
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {hasResults && (
          <button
            onClick={onShowResults}
            className="btn btn-sm"
            style={{
              background: 'var(--success-bg)', border: '1px solid var(--success-border)',
              color: '#027A48', fontWeight: 600,
            }}
          >
            <CheckCircle2 size={13} />
            Show Results
          </button>
        )}

        <button
          onClick={onSave}
          disabled={isSaving}
          title="Save (⌘S)"
          className="btn btn-secondary btn-sm"
          style={{ fontWeight: 600 }}
        >
          <Save size={13} />
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={onExecute}
          disabled={isExecuting}
          title="Run workflow (⌘↵)"
          className="btn btn-primary btn-sm"
          style={{ fontWeight: 600, background: 'var(--primary)', color: 'white' }}
        >
          {isExecuting ? (
            <>
              <span style={{
                display: 'inline-block', width: 12, height: 12,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              Running...
            </>
          ) : (
            <>
              <Play size={13} fill="white" stroke="none" />
              Run
            </>
          )}
        </button>
      </div>
    </div>
  );
}
