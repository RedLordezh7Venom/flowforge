import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glows */}
      <div style={{
        position: 'absolute', top: '20%', left: '30%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '30%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(129,140,248,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: 380,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 20, padding: '36px 32px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        animation: 'scaleIn 0.2s ease',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #0ea5e9, #818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 16px rgba(14,165,233,0.35)',
          }}>
            <Zap size={22} color="white" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 13 }}>
            Sign in to your FlowForge account
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{
                position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none',
              }} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" required autoComplete="email"
                className="input" style={{ paddingLeft: 34, borderRadius: 9 }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{
                position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none',
              }} />
              <input
                type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password"
                className="input" style={{ paddingLeft: 34, paddingRight: 36, borderRadius: 9 }}
              />
              <button
                type="button" onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: 2,
                }}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#f87171',
              animation: 'fadeIn 0.15s ease',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px', borderRadius: 9, fontSize: 14, marginTop: 4 }}
          >
            {isLoading ? (
              <>
                <span style={{
                  display: 'inline-block', width: 14, height: 14,
                  border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white',
                  borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                }} />
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
          </span>
          <Link to="/register" style={{ fontSize: 13, color: 'var(--forge-400)', fontWeight: 500, textDecoration: 'none' }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
