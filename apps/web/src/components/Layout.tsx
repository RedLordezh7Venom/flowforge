import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  LayoutDashboard, FolderOpen, Clock, Settings, LogOut,
  Zap, ChevronRight, HelpCircle, Bell,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Studio' },
  { path: '/projects', icon: FolderOpen, label: 'Knowledge' },
  { path: '/executions', icon: Clock, label: 'History' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-body)',
      fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    }}>
      {/* ── Top Header (Dify-style) ── */}
      <header style={{
        height: 'var(--header-height)',
        background: 'white',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 20,
        paddingRight: 20,
        gap: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Logo */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', userSelect: 'none', flexShrink: 0,
            marginRight: 32,
          }}
          onClick={() => navigate('/')}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #155EEF 0%, #7C3AED 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(21,94,239,0.3)',
          }}>
            <Zap size={15} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            FlowForge
          </span>
        </div>

        {/* Nav tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 'var(--radius-md)',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--primary)' : 'var(--text-tertiary)',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)';
                  }
                }}
              >
                <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="btn btn-ghost btn-sm" title="Help" style={{ padding: 7, borderRadius: 'var(--radius-md)' }}>
            <HelpCircle size={16} style={{ color: 'var(--text-tertiary)' }} />
          </button>
          <button className="btn btn-ghost btn-sm" title="Notifications" style={{ padding: 7, borderRadius: 'var(--radius-md)' }}>
            <Bell size={16} style={{ color: 'var(--text-tertiary)' }} />
          </button>

          <div style={{ width: 1, height: 20, background: 'var(--border-light)', margin: '0 6px' }} />

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--radius-md)', transition: 'background 0.12s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #155EEF, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'white',
            }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
              {user?.name}
            </span>
          </div>

          <button
            onClick={logout}
            className="btn btn-ghost btn-sm"
            title="Sign out"
            style={{ padding: 7, borderRadius: 'var(--radius-md)' }}
          >
            <LogOut size={15} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
