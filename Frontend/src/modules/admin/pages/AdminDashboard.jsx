import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { 
  FileText, CheckCircle2, Clock, AlertTriangle, Users, HardHat, 
  ShieldCheck, ArrowUpRight, TrendingUp, Sparkles, MapPin, RefreshCw 
} from 'lucide-react';
import { api } from '../../../shared/api';
import AdminNavbar from '../components/AdminNavbar';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const outletCtx = useOutletContext();
  const onToggleSidebar = outletCtx?.onToggleSidebar;

  const fetchStats = async () => {
    setLoading(true);
    const res = await api('admin').get('/api/admin/stats');
    if (res.ok) setStats(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const complaints = stats?.complaints || {};
  const users = stats?.users || {};
  const areas = stats?.areas || [];
  const categories = stats?.categories || [];

  const resolutionRate = complaints.total_complaints 
    ? Math.round((complaints.resolved / complaints.total_complaints) * 100) 
    : 0;

  return (
    <div className="admin-main">
      <AdminNavbar 
        title="Executive Command Center" 
        subtitle="Cross-city public infrastructure and workforce operations overview"
        onToggleSidebar={onToggleSidebar}
        actions={
          <button 
            type="button" 
            className="admin-btn admin-btn-secondary admin-btn-sm" 
            onClick={fetchStats}
            title="Refresh statistics"
          >
            <RefreshCw size={14} className={loading ? 'admin-spin' : ''} />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="admin-body">
        {/* KPI Cards */}
        <div className="admin-kpi-grid">
          <div className="admin-kpi-card">
            <div className="admin-kpi-icon blue">
              <FileText size={26} />
            </div>
            <div className="admin-kpi-info">
              <p>Total Complaints</p>
              <h2>{complaints.total_complaints ?? '—'}</h2>
              <span>Across all municipal areas</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-icon green">
              <TrendingUp size={26} />
            </div>
            <div className="admin-kpi-info">
              <p>Resolution Rate</p>
              <h2>{resolutionRate}%</h2>
              <span>{complaints.resolved ?? 0} resolved complaints</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-icon purple">
              <HardHat size={26} />
            </div>
            <div className="admin-kpi-info">
              <p>Active Workforce</p>
              <h2>{users.total_workers ?? '—'}</h2>
              <span>{users.pending_workers ?? 0} awaiting approval</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-icon amber">
              <AlertTriangle size={26} />
            </div>
            <div className="admin-kpi-info">
              <p>Overdue / Escalated</p>
              <h2>{complaints.overdue ?? '0'}</h2>
              <span>{complaints.emergencies ?? 0} emergency flags</span>
            </div>
          </div>
        </div>

        {/* Quick Launch Cards */}
        <div className="admin-quick-grid">
          <Link to="/authorities" className="admin-card admin-quick-card">
            <div className="admin-quick-content">
              <div className="admin-quick-icon blue">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4>Authorize Officers</h4>
                <p>Issue invite codes or create authority accounts</p>
              </div>
            </div>
            <ArrowUpRight size={18} className="admin-quick-arrow" />
          </Link>

          <Link to="/workers" className="admin-card admin-quick-card">
            <div className="admin-quick-content">
              <div className="admin-quick-icon green">
                <HardHat size={22} />
              </div>
              <div>
                <h4>Review Workforce</h4>
                <p>Approve pending staff & reassign field tasks</p>
              </div>
            </div>
            <ArrowUpRight size={18} className="admin-quick-arrow" />
          </Link>

          <Link to="/citizens" className="admin-card admin-quick-card">
            <div className="admin-quick-content">
              <div className="admin-quick-icon amber">
                <Users size={22} />
              </div>
              <div>
                <h4>Citizen Registry</h4>
                <p>Review citizen activity & complaint history</p>
              </div>
            </div>
            <ArrowUpRight size={18} className="admin-quick-arrow" />
          </Link>
        </div>

        {/* Area Operations & Category Breakdown */}
        <div className="admin-dashboard-split">
          {/* Area Breakdown Table */}
          <div className="admin-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <h3>Jurisdiction Operations</h3>
                <p>Real-time grievance load and workforce capacity per area</p>
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>City / Area</th>
                    <th>Complaints</th>
                    <th>Resolved</th>
                    <th>Active</th>
                    <th>Workers</th>
                    <th>Officers</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>
                        {loading ? 'Loading jurisdiction data...' : 'No jurisdiction data available.'}
                      </td>
                    </tr>
                  ) : (
                    areas.map((a) => (
                      <tr key={a.area}>
                        <td>
                          <strong style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#002651' }}>
                            <MapPin size={14} color="#1292EE" />
                            {a.area}
                          </strong>
                        </td>
                        <td>{a.total}</td>
                        <td><span className="admin-tag resolved">{a.resolved}</span></td>
                        <td><span className="admin-tag progress">{a.active}</span></td>
                        <td>{a.workers_count}</td>
                        <td>{a.authorities_count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Issue Categories Breakdown */}
          <div className="admin-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <h3>Issue Categories</h3>
                <p>Distribution of citizen reports</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {categories.length === 0 ? (
                <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
                  {loading ? 'Loading categories...' : 'No issue reports logged.'}
                </p>
              ) : (
                categories.map((cat) => {
                  const total = complaints.total_complaints || 1;
                  const pct = Math.round((cat.count / total) * 100);
                  const barColor = 
                    cat.category === 'road' ? '#1292EE' : 
                    cat.category === 'garbage' ? '#10B981' : 
                    cat.category === 'water' ? '#0077CC' : 
                    cat.category === 'electricity' ? '#F59E0B' : '#8B5CF6';

                  return (
                    <div key={cat.category}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, marginBottom: 6 }}>
                        <span style={{ textTransform: 'capitalize', color: '#002651' }}>{cat.category}</span>
                        <span style={{ color: '#64748B' }}>{cat.count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, background: '#F1F5F9', borderRadius: 9999, overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${pct}%`, 
                            height: '100%', 
                            background: barColor,
                            borderRadius: 9999,
                            transition: 'width 0.3s ease'
                          }} 
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
