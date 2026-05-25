import React, { useState } from 'react';
import { api } from '../../api';
import { useToast } from '../../components/Toast';
import { ShieldIcon } from '../../components/Icons';

export default function AdminLogin({ onLogin }) {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.admin.login({ password });
      onLogin(data.admin);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: '0 auto 18px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-primary)'
          }}>
            <ShieldIcon size={30} style={{ stroke: '#fff' }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Admin Panel</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>Spetro Earn — Secure Access</p>
        </div>

        <div className="card">
          <form onSubmit={submit}>
            <div className="input-group">
              <label>Admin Password</label>
              <input
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : 'Access Admin Panel'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          <a href="/" style={{ color: 'var(--text-muted)' }}>← Back to App</a>
        </p>
      </div>
    </div>
  );
}
