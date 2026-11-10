import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Users, Search, MapPin, CheckCircle2, XCircle, ShieldAlert, 
  FileText, RefreshCw, X, AlertCircle, Clock, Eye, UserX, UserCheck
} from 'lucide-react';
import { api } from '../../../shared/api';
import { AREAS } from '../../../shared/areas';
import AdminNavbar from '../components/AdminNavbar';

export default function CitizenDirectory() {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const outletCtx = useOutletContext();
  const onToggleSidebar = outletCtx?.onToggleSidebar;

  // Complaint History Modal
  const [selectedCitizen, setSelectedCitizen] = useState(null);
  const [citizenComplaints, setCitizenComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Status toggle action loading
  const [updatingId, setUpdatingId] = useState(null);

  const fetchCitizens = async () => {
    setLoading(true);
    let url = '/api/admin/citizens?';
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (selectedArea) params.append('area', selectedArea);
    url += params.toString();

    const res = await api('admin').get(url);
    if (res.ok) {
      setCitizens(res.data.citizens || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCitizens();
  }, [selectedArea]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCitizens();
  };

  const handleToggleStatus = async (citizen) => {
    const nextState = !citizen.active;
    const confirmMsg = nextState 
      ? `Re-activate citizen account for ${citizen.name}?` 
      : `Suspend citizen account for ${citizen.name}? They will not be able to log in or file complaints.`;
    
    if (!window.confirm(confirmMsg)) return;

    setUpdatingId(citizen.id);
    const res = await api('admin').patch(`/api/admin/citizens/${citizen.id}/status`, {
      active: nextState,
    });
    if (res.ok) {
      setCitizens((prev) =>
        prev.map((c) => (c.id === citizen.id ? { ...c, active: nextState } : c))
      );
    }
    setUpdatingId(null);
  };

  const openComplaintsModal = async (citizen) => {
    setSelectedCitizen(citizen);
    setModalOpen(true);
    setLoadingComplaints(true);
    const res = await api('admin').get(`/api/admin/citizens/${citizen.id}/complaints`);
    if (res.ok) {
      setCitizenComplaints(res.data.complaints || []);
    }
    setLoadingComplaints(false);
  };

  // Metrics
  const totalCitizens = citizens.length;
  const verifiedCount = citizens.filter((c) => c.email_verified).length;
  const activeCount = citizens.filter((c) => c.active).length;
  const totalComplaintsFiled = citizens.reduce((acc, c) => acc + (Number(c.complaints_count) || 0), 0);

  return (
    <div className="admin-main">
      <AdminNavbar
        title="Citizen Master Directory"
        subtitle="Manage resident profiles, account standings, and view municipal issue submissions"
        onToggleSidebar={onToggleSidebar}
        actions={
          <button
            type="button"
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={fetchCitizens}
            title="Refresh citizens directory"
          >
            <RefreshCw size={14} className={loading ? 'admin-spin' : ''} />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="admin-body">
        {/* KPI Summary Cards */}
        <div className="admin-kpi-grid">
          <div className="admin-kpi-card">
            <div className="admin-kpi-icon blue">
              <Users size={24} />
            </div>
            <div className="admin-kpi-info">
              <p>Registered Citizens</p>
              <h2>{totalCitizens}</h2>
              <span>Across all municipal areas</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-icon green">
              <CheckCircle2 size={24} />
            </div>
            <div className="admin-kpi-info">
              <p>Email Verified</p>
              <h2>{verifiedCount}</h2>
              <span>{totalCitizens ? Math.round((verifiedCount / totalCitizens) * 100) : 0}% authenticated rate</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-icon amber">
              <FileText size={24} />
            </div>
            <div className="admin-kpi-info">
              <p>Total Complaints</p>
              <h2>{totalComplaintsFiled}</h2>
              <span>Citizen submitted reports</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-icon purple">
              <UserCheck size={24} />
            </div>
            <div className="admin-kpi-info">
              <p>Active Standing</p>
              <h2>{activeCount}</h2>
              <span>{totalCitizens - activeCount} suspended accounts</span>
            </div>
          </div>
        </div>

        {/* Directory Controls & Table */}
        <div className="admin-card">
          <div className="admin-card-head" style={{ flexWrap: 'wrap', gap: 14 }}>
            <div className="admin-card-title">
              <h3>Resident Directory</h3>
              <p>Filter by ward jurisdiction or search by citizen name, email, or contact number</p>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="admin-form-input"
                    style={{ paddingLeft: 36, minWidth: 240 }}
                    placeholder="Search citizen..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
                </div>
                <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">
                  Search
                </button>
              </form>

              <select
                className="admin-form-select"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                style={{ minWidth: 160 }}
              >
                <option value="">All Municipal Areas</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748B' }}>
              <RefreshCw size={24} className="admin-spin" style={{ margin: '0 auto 12px' }} />
              <p>Loading citizens directory...</p>
            </div>
          ) : citizens.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748B' }}>
              <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontWeight: 600, fontSize: '1rem', color: '#0F172A' }}>No citizens found</p>
              <p style={{ fontSize: '0.85rem' }}>Try clearing filters or checking another municipal ward.</p>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Resident</th>
                    <th>Jurisdiction</th>
                    <th>Verification</th>
                    <th>Complaints Filed</th>
                    <th>Account Standing</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {citizens.map((citizen) => (
                    <tr key={citizen.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: '#F0F7FF',
                              color: '#0077CC',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              border: '1px solid #D6EDFF'
                            }}
                          >
                            {citizen.name ? citizen.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#002651' }}>{citizen.name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{citizen.email}</div>
                            {citizen.phone && (
                              <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>{citizen.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.85rem' }}>
                          <MapPin size={14} style={{ color: '#0077CC' }} />
                          <strong>{citizen.area || 'All Areas'}</strong>
                        </span>
                      </td>
                      <td>
                        {citizen.email_verified ? (
                          <span className="admin-tag active">
                            <CheckCircle2 size={12} />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="admin-tag pending">
                            <Clock size={12} />
                            <span>Unverified</span>
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => openComplaintsModal(citizen)}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                          title="View complaint history"
                        >
                          <FileText size={13} />
                          <span>{citizen.complaints_count || 0} Reports</span>
                        </button>
                      </td>
                      <td>
                        {citizen.active ? (
                          <span className="admin-tag active">
                            <CheckCircle2 size={12} />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="admin-tag inactive">
                            <ShieldAlert size={12} />
                            <span>Suspended</span>
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#64748B' }}>
                        {citizen.created_at ? new Date(citizen.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            onClick={() => openComplaintsModal(citizen)}
                            title="Inspect citizen details & complaints"
                          >
                            <Eye size={13} />
                            <span>History</span>
                          </button>
                          <button
                            type="button"
                            className={`admin-btn admin-btn-sm ${citizen.active ? 'admin-btn-danger' : 'admin-btn-primary'}`}
                            onClick={() => handleToggleStatus(citizen)}
                            disabled={updatingId === citizen.id}
                            title={citizen.active ? 'Suspend account' : 'Reactivate account'}
                          >
                            {citizen.active ? <UserX size={13} /> : <UserCheck size={13} />}
                            <span>{citizen.active ? 'Suspend' : 'Activate'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Citizen Complaint History Modal */}
      {modalOpen && selectedCitizen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="admin-modal"
            style={{ maxWidth: 720, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-head">
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} />
                  <span>Complaints History: {selectedCitizen.name}</span>
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', opacity: 0.8 }}>
                  {selectedCitizen.email} • {selectedCitizen.area || 'All Areas'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
              {loadingComplaints ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                  <RefreshCw size={24} className="admin-spin" style={{ margin: '0 auto 12px' }} />
                  <p>Loading complaint records...</p>
                </div>
              ) : citizenComplaints.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                  <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <p style={{ fontWeight: 600, color: '#0F172A' }}>No complaints filed</p>
                  <p style={{ fontSize: '0.85rem' }}>This resident has not submitted any civic reports yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {citizenComplaints.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        border: '1px solid #E2E8F0',
                        background: '#F8FAFC'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#002651' }}>
                            {c.category}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>#{c.id.slice(0, 8)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span className={`admin-tag ${c.status}`}>
                            {c.status.toUpperCase()}
                          </span>
                          {c.priority && (
                            <span
                              className="admin-tag"
                              style={{
                                background: c.priority === 'urgent' || c.priority === 'high' ? '#FEF2F2' : '#EFF6FF',
                                color: c.priority === 'urgent' || c.priority === 'high' ? '#DC2626' : '#2563EB'
                              }}
                            >
                              {c.priority}
                            </span>
                          )}
                        </div>
                      </div>

                      <p style={{ margin: '0 0 10px', fontSize: '0.86rem', color: '#334155', lineHeight: 1.45 }}>
                        {c.description}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748B' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={13} />
                          {c.location || c.area || 'Location specified on map'}
                        </span>
                        <span>Filed: {new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-modal-foot">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

