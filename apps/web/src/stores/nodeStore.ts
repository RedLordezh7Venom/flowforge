
import { create } from 'zustand';
import api from '../utils/api';

interface NodeType {
  name: string; displayName: string; description: string; category: string;
  icon?: string; color?: string; inputs: any[]; outputs: any[]; parameters: any[];
}
interface NodeState {
  nodeTypes: NodeType[];
  categories: string[];
  isLoading: boolean;
  fetchNodes: () => Promise<void>;
  getNodesByCategory: (cat: string) => NodeType[];
  getNodeByName: (name: string) => NodeType | undefined;
}

export const useNodeStore = create<NodeState>((set, get) => ({
  nodeTypes: [],
  categories: [],
  isLoading: false,
  fetchNodes: async () => {
    set({ isLoading: true });
    const [nodesRes, catsRes] = await Promise.all([api.get('/nodes'), api.get('/nodes/categories')]);
    set({ nodeTypes: nodesRes.data.data, categories: catsRes.data.data, isLoading: false });
  },
  getNodesByCategory: (cat) => get().nodeTypes.filter(n => n.category === cat),
  getNodeByName: (name) => get().nodeTypes.find(n => n.name === name),
}));
