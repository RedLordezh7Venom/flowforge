
import { useEffect, useState } from 'react';
import api from '../utils/api';
import { FolderOpen, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchProjects = async () => {
    const res = await api.get('/projects');
    setProjects(res.data.data);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/projects', { name });
      setName(''); setShowForm(false);
      toast.success('Project created');
      fetchProjects();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 mt-1">Organize your workflows into projects</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-forge-500 hover:bg-forge-600 text-white font-medium rounded-lg transition-colors">
          <Plus className="w-5 h-5" /> New Project
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex gap-3">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" required
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-forge-500" />
          <button type="submit" className="px-4 py-2 bg-forge-500 text-white rounded-lg">Create</button>
          <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg">Cancel</button>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-forge-500/20 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-forge-400" />
              </div>
              <div><h3 className="text-white font-medium">{p.name}</h3><p className="text-sm text-gray-400">{p._count?.workflows || 0} workflows</p></div>
            </div>
            {p.description && <p className="text-sm text-gray-500">{p.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
