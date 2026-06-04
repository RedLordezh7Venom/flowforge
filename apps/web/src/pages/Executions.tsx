
import { useEffect } from 'react';
import { useExecutionStore } from '../stores/executionStore';
import { formatDate, getStatusColor, formatDuration } from '../utils/helpers';
import { Clock, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';

const statusIcons: Record<string, any> = {
  success: CheckCircle, failed: XCircle, running: Loader, pending: Clock, cancelled: AlertCircle, timeout: AlertCircle,
};

export default function Executions() {
  const { executions, fetchExecutions, cancelExecution, isLoading } = useExecutionStore();
  useEffect(() => { fetchExecutions(); }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Executions</h1>
      <p className="text-gray-400 mb-6">View workflow execution history</p>
      {isLoading ? <p className="text-gray-400">Loading...</p> : executions.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No executions yet</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {executions.map((ex) => {
            const Icon = statusIcons[ex.status] || Clock;
            return (
              <div key={ex.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" style={{ color: getStatusColor(ex.status) }} />
                    <div>
                      <h3 className="text-white font-medium">{ex.workflow?.name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-400">{ex.mode} - {formatDate(ex.startedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {ex.startedAt && ex.finishedAt && (
                      <span className="text-xs text-gray-500">{formatDuration(ex.startedAt, ex.finishedAt)}</span>
                    )}
                    <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: getStatusColor(ex.status) + '20', color: getStatusColor(ex.status) }}>{ex.status}</span>
                    {ex.status === 'running' && (
                      <button onClick={() => cancelExecution(ex.id)} className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-lg hover:bg-red-500/30">Cancel</button>
                    )}
                  </div>
                </div>
                {ex.error && <p className="text-sm text-red-400 mt-2 bg-red-500/10 p-2 rounded">{ex.error}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
