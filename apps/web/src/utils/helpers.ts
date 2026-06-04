
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    trigger: '#FF9800', action: '#4CAF50', ai: '#10A37F', logic: '#FF5722',
    transform: '#2196F3', webhook: '#FF6D5A', schedule: '#00C853',
    communication: '#E91E63', database: '#795548', custom: '#9C27B0',
  };
  return colors[category] || '#6B7280';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    success: '#22C55E', running: '#3B82F6', pending: '#F59E0B',
    failed: '#EF4444', cancelled: '#6B7280', timeout: '#F97316',
  };
  return colors[status] || '#6B7280';
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString();
}

export function formatDuration(start: string | Date, end?: string | Date): string {
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const ms = e - s;
  if (ms < 1000) return ms + 'ms';
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
  return (ms / 60000).toFixed(1) + 'm';
}
