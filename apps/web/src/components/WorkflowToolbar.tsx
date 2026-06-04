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
      height: 52, background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 12px', gap: 8, flexShrink: 0,
    }}>
      {/* Left: panel toggle + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, overflow: 'hidden' }}>
        <button
          onClick={onToggleNodePanel}
          title="Toggle node panel"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: '6px',
            borderRadius: 6, display: 'flex', alignItems: 'center',
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
            (e.currentTarget as HTMLElement).style.background = 'none';
          }}
        >
          <PanelLeft size={18} />
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

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
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--forge-500)',
              borderRadius: 6, color: 'var(--text-primary)',
              fontSize: 13, fontWeight: 600, padding: '4px 8px',
              outline: 'none', boxShadow: '0 0 0 3px rgba(14,165,233,0.12)',
              width: 200,
            }}
          />
        ) : (
          <button
            onClick={() => onEditingNameChange(true)}
            title="Click to rename"
            style={{
              background: 'none', border: 'none', cursor: 'text',
              color: 'var(--text-primary)', fontSize: 13, fontWeight: 600,
              padding: '4px 8px', borderRadius: 6,
              transition: 'background 0.15s',
              maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
          >
            {workflowName}
          </button>
        )}
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {hasResults && (
          <button
            onClick={onShowResults}
            style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
              color: '#4ade80', borderRadius: 7, padding: '5px 12px',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.15s',
            }}
          >
            <CheckCircle2 size={13} />
            Results
          </button>
        )}

        <button
          onClick={onSave}
          disabled={isSaving}
          title="Save (⌘S)"
          style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            color: isSaving ? 'var(--text-muted)' : 'var(--text-primary)',
            borderRadius: 7, padding: '6px 14px',
            fontSize: 12, fontWeight: 500, cursor: isSaving ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            if (!isSaving) (e.currentTarget as HTMLElement).style.background = 'var(--bg-overlay)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
          }}
        >
          <Save size={13} />
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={onExecute}
          disabled={isExecuting}
          title="Run workflow (⌘↵)"
          style={{
            background: isExecuting
              ? 'rgba(34,197,94,0.2)'
              : 'linear-gradient(135deg, #16a34a, #15803d)',
            border: 'none',
            color: 'white', borderRadius: 7, padding: '6px 14px',
            fontSize: 12, fontWeight: 600, cursor: isExecuting ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s',
            boxShadow: isExecuting ? 'none' : '0 2px 8px rgba(22,163,74,0.35)',
          }}
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
              <Play size={13} fill="white" />
              Run
            </>
          )}
        </button>
      </div>
    </div>
  );
}
