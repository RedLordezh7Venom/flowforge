import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  LayoutDashboard, FolderOpen, Clock, Settings, LogOut,
  Zap, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/projects', icon: FolderOpen, label: 'Projects' },
  { path: '/executions', icon: Clock, label: 'Executions' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside
        className="sidebar"
        style={{ width: collapsed ? 56 : 216, flexShrink: 0 }}
      >
        {/* Logo */}
        <div
          onClick={() => setCollapsed(!collapsed)}
          style={{
            padding: collapsed ? '14px 12px' : '14px 14px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', userSelect: 'none' as const, flexShrink: 0,
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, #0ea5e9 0%, #818cf8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 2px 8px rgba(14,165,233,0.35)',
          }}>
            <Zap size={14} color="white" />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                FlowForge
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Workflow Builder
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 6px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 9, padding: collapsed ? '8px 10px' : '8px 10px',
                  borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: isActive ? 'rgba(14,165,233,0.10)' : 'transparent',
                  color: isActive ? '#38bdf8' : 'var(--text-muted)',
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.12s', textAlign: 'left' as const,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderLeft: isActive ? '2px solid var(--forge-500)' : '2px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                  }
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
                {!collapsed && isActive && <ChevronRight size={11} style={{ opacity: 0.4, flexShrink: 0 }} />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '6px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: collapsed ? '8px 6px' : '8px 8px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0ea5e9, #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <>
                <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email}
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: '4px', borderRadius: 5,
                    display: 'flex', alignItems: 'center', transition: 'color 0.15s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
                >
                  <LogOut size={13} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}
