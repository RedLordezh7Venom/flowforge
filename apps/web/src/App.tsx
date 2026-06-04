
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WorkflowEditor from './pages/WorkflowEditor';
import Executions from './pages/Executions';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
      <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="workflow/:id" element={<WorkflowEditor />} />
        <Route path="executions" element={<Executions />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
export default App;
