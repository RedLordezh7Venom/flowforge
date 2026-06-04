
import { Save, Play, PanelLeftClose, PanelLeft, MoreVertical, Copy, Trash2 } from 'lucide-react';

interface Props {
  workflowName: string;
  isSaving: boolean;
  isExecuting: boolean;
  onSave: () => void;
  onExecute: () => void;
  onToggleNodePanel: () => void;
}

export default function WorkflowToolbar({ workflowName, isSaving, isExecuting, onSave, onExecute, onToggleNodePanel }: Props) {
  return (
    <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button onClick={onToggleNodePanel} className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white">
          <PanelLeft className="w-5 h-5" />
        </button>
        <h2 className="text-white font-medium">{workflowName}</h2>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onSave} disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
          <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onExecute} disabled={isExecuting}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
          <Play className="w-4 h-4" /> {isExecuting ? 'Running...' : 'Run'}
        </button>
      </div>
    </div>
  );
}
