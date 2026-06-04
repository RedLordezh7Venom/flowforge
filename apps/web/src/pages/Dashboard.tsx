
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflowStore } from '../stores/workflowStore';
import { useExecutionStore } from '../stores/executionStore';
import { Plus, Play, Clock, CheckCircle, XCircle, Zap } from 'lucide-react';
import { formatDate, getStatusColor } from '../utils/helpers';

export default function Dashboard() {
  const navigate = useNavigate();
  const { workflows, fetchWorkflows, isLoading: wfLoading } = useWorkflowStore();
  const { executions, fetchExecutions, isLoading: exLoading } = useExecutionStore();
  const [activeTab, setActiveTab] = useState<'workflows' | 'executions'>('workflows');

  useEffect(() => { fetchWorkflows(); fetchExecutions(); }, []);

  const recentExecutions = executions.slice(0, 10);
  const successCount = executions.filter(e => e.status === 'success').length;
  const failedCount = executions.filter(e => e.status === 'failed').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage your AI workflows</p>
        </div>
        <button onClick={() => navigate('/workflow/new')} className="flex items-center gap-2 px-4 py-2.5 bg-forge-500 hover:bg-forge-600 text-white font-medium rounded-lg transition-colors">
          <Plus className="w-5 h-5" /> New Workflow
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center"><Zap className="w-5 h-5 text-blue-400" /></div>
            <div><p className="text-2xl font-bold text-white">{workflows.length}</p><p className="text-sm text-gray-400">Workflows</p></div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-400" /></div>
            <div><p className="text-2xl font-bold text-white">{successCount}</p><p className="text-sm text-gray-400">Successful Runs</p></div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center"><XCircle className="w-5 h-5 text-red-400" /></div>
            <div><p className="text-2xl font-bold text-white">{failedCount}</p><p className="text-sm text-gray-400">Failed Runs</p></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b border-gray-800">
        <button onClick={() => setActiveTab('workflows')} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'workflows' ? 'text-forge-400 border-forge-400' : 'text-gray-400 border-transparent hover:text-gray-300'}`}>
          Workflows ({workflows.length})
        </button>
        <button onClick={() => setActiveTab('executions')} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'executions' ? 'text-forge-400 border-forge-400' : 'text-gray-400 border-transparent hover:text-gray-300'}`}>
          Recent Executions ({executions.length})
        </button>
      </div>

      {/* Workflow List */}
      {activeTab === 'workflows' && (
        <div className="space-y-3">
          {wfLoading ? <p className="text-gray-400">Loading...</p> : workflows.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
              <Zap className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No workflows yet</h3>
              <p className="text-gray-400 mb-4">Create your first workflow to get started</p>
              <button onClick={() => navigate('/workflow/new')} className="px-4 py-2 bg-forge-500 hover:bg-forge-600 text-white rounded-lg transition-colors">Create Workflow</button>
            </div>
          ) : workflows.map((w) => (
            <div key={w.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors cursor-pointer" onClick={() => navigate(`/workflow/${w.id}`)}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{w.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{w.description || 'No description'} {w.active && <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Active</span>}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">v{w.version}</span>
                  <button onClick={(e) => { e.stopPropagation(); }} className="p-2 hover:bg-gray-800 rounded-lg transition-colors"><Play className="w-4 h-4 text-forge-400" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Executions List */}
      {activeTab === 'executions' && (
        <div className="space-y-3">
          {exLoading ? <p className="text-gray-400">Loading...</p> : recentExecutions.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No executions yet</h3>
              <p className="text-gray-400">Run a workflow to see executions here</p>
            </div>
          ) : recentExecutions.map((ex) => (
            <div key={ex.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{ex.workflow?.name || 'Unknown'}</h3>
                  <p className="text-sm text-gray-400 mt-1">{ex.mode} - {formatDate(ex.startedAt)}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: getStatusColor(ex.status) + '20', color: getStatusColor(ex.status) }}>{ex.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
