
import { create } from 'zustand';
import api from '../utils/api';

interface Execution {
  id: string; workflowId: string; status: string; mode: string;
  startedAt: string; finishedAt?: string; data?: any; error?: string;
  workflow?: { name: string };
}
interface ExecutionState {
  executions: Execution[];
  currentExecution: Execution | null;
  isLoading: boolean;
  fetchExecutions: (params?: Record<string, string>) => Promise<void>;
  fetchExecution: (id: string) => Promise<void>;
  cancelExecution: (id: string) => Promise<void>;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  executions: [],
  currentExecution: null,
  isLoading: false,
  fetchExecutions: async (params) => {
    set({ isLoading: true });
    const res = await api.get('/executions', { params });
    set({ executions: res.data.data, isLoading: false });
  },
  fetchExecution: async (id) => {
    const res = await api.get(`/executions/${id}`);
    set({ currentExecution: res.data.data });
  },
  cancelExecution: async (id) => {
    await api.post(`/executions/${id}/cancel`);
  },
}));
