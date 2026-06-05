import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Zap, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      await register(email, password, name);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-body)', padding: 20, position: 'relative', overflow: 'hidden',
      fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    }}>
      {/* Background visual detail */}
      <div style={{
        position: 'absolute', top: '15%', right: '15%',
        width: 350, height: 350, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(21,94,239,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="card" style={{
        width: '100%', maxWidth: 400,
        padding: '36px 32px',
        boxShadow: 'var(--shadow-xl)',
        animation: 'scaleIn 0.2s ease',
        position: 'relative', zIndex: 1,
        background: 'white',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'linear-gradient(135deg, #155EEF 0%, #7C3AED 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 12px rgba(21,94,239,0.25)',
          }}>
            <Zap size={20} color="white" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Create Account</h1>
          <p style={{ color: 'var(--text-tertiary)', marginTop: 4, fontSize: 13 }}>
            Get started with FlowForge for free
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="John Smith" required autoComplete="name"
                className="input" style={{ paddingLeft: 34 }}
              />
            </div>
          </div>

          <div>
            <label className="label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" required autoComplete="email"
                className="input" style={{ paddingLeft: 34 }}
              />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
              <input
                type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters" required autoComplete="new-password"
                className="input" style={{ paddingLeft: 34, paddingRight: 36 }}
              />
              <button
                type="button" onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-tertiary)', padding: 2, display: 'flex',
                }}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'var(--error-bg)', border: '1px solid var(--error-border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 12, color: 'var(--error)',
              animation: 'fadeIn 0.15s ease',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontWeight: 600, fontSize: 13, marginTop: 4 }}
          >
            {isLoading ? (
              <>
                <span style={{
                  display: 'inline-block', width: 14, height: 14,
                  border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white',
                  borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                }} />
                Creating account...
              </>
            ) : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Already have an account? </span>
          <Link to="/login" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
