import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

const logoIcon = '/images/logo-icon-96.png';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const [identifier, setIdentifier] = useState('admin@citysync.gov');
  const [password, setPassword] = useState('admin@1234');
  const [masterKey, setMasterKey] = useState('CITYSYNC-SECURE-ADMIN-2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login({ identifier, password, masterKey });
      if (res.ok) {
        navigate('/');
      } else {
        setError(res.error || 'Admin authentication failed.');
      }
    } catch (err) {
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <img src={logoIcon} alt="CitySync Logo" />
          <h1>City<span>Sync</span></h1>
          <div className="admin-login-badge">
            <Shield size={12} />
            <span>Executive Admin Portal</span>
          </div>
        </div>

        {error && (
          <div className="admin-error-box" role="alert" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-login-field">
            <label htmlFor="admin-id">Admin ID / Email</label>
            <input
              id="admin-id"
              type="text"
              className="admin-login-input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. admin@citysync.gov or ADM-001"
              required
            />
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-pass">Password</label>
            <input
              id="admin-pass"
              type="password"
              className="admin-login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
            />
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-master-key">Master Security Key (Passkey)</label>
            <input
              id="admin-master-key"
              type="password"
              className="admin-login-input"
              value={masterKey}
              onChange={(e) => setMasterKey(e.target.value)}
              placeholder="CITYSYNC-SECURE-ADMIN-..."
              required
            />
          </div>

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'Authenticating Gateway…' : 'Access Command Center'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
          <strong style={{ color: '#57B0FB', display: 'block', marginBottom: 4 }}>Default Admin Credentials:</strong>
          ID: <code>admin@citysync.gov</code> · Pass: <code>admin@1234</code><br />
          Passkey: <code>CITYSYNC-SECURE-ADMIN-2026</code>
        </div>
      </div>
    </div>
  );
}
