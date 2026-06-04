
import { create } from 'zustand';
import api from '../utils/api';
import { Workflow } from '../types';

interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  isLoading: boolean;
  fetchWorkflows: (projectId?: string) => Promise<void>;
  fetchWorkflow: (id: string) => Promise<void>;
  createWorkflow: (data: Partial<Workflow>) => Promise<Workflow>;
  updateWorkflow: (id: string, data: Partial<Workflow>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  executeWorkflow: (id: string) => Promise<string>;
  setCurrentWorkflow: (w: Workflow | null) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  isLoading: false,
  fetchWorkflows: async (projectId) => {
    set({ isLoading: true });
    const params = projectId ? { projectId } : {};
    const res = await api.get('/workflows', { params });
    set({ workflows: res.data.data, isLoading: false });
  },
  fetchWorkflow: async (id) => {
    set({ isLoading: true });
    const res = await api.get(`/workflows/${id}`);
    const workflow = { ...res.data.data, nodes: res.data.data.definition?.nodes || [], connections: res.data.data.definition?.connections || [] };
    set({ currentWorkflow: workflow, isLoading: false });
  },
  createWorkflow: async (data) => {
    const res = await api.post('/workflows', { ...data, definition: { nodes: data.nodes || [], connections: data.connections || [] } });
    await get().fetchWorkflows();
    return res.data.data;
  },
  updateWorkflow: async (id, data) => {
    const payload: any = { ...data };
    if (data.nodes || data.connections) {
      payload.definition = { nodes: data.nodes || [], connections: data.connections || [] };
      delete payload.nodes;
      delete payload.connections;
    }
    await api.put(`/workflows/${id}`, payload);
    await get().fetchWorkflows();
  },
  deleteWorkflow: async (id) => {
    await api.delete(`/workflows/${id}`);
    await get().fetchWorkflows();
  },
  executeWorkflow: async (id) => {
    const res = await api.post(`/workflows/${id}/execute`);
    return res.data.data.executionId;
  },
  setCurrentWorkflow: (w) => set({ currentWorkflow: w }),
}));
