import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  HardHat, Search, MapPin, CheckCircle2, AlertTriangle, ShieldCheck, 
  Briefcase, RefreshCw, X, AlertCircle, Edit, Check, UserX, UserCheck
} from 'lucide-react';
import { api } from '../../../shared/api';
import { AREAS } from '../../../shared/areas';
import AdminNavbar from '../components/AdminNavbar';

const DEPARTMENTS = [
  'Sanitation',
  'Roads & Infrastructure',
  'Water Works',
  'Electrical',
  'Civil Infrastructure',
];

export default function WorkerRoster() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const outletCtx = useOutletContext();
  const onToggleSidebar = outletCtx?.onToggleSidebar;

  // Edit / Reassignment Modal
  const [editingWorker, setEditingWorker] = useState(null);
  const [modalArea, setModalArea] = useState('');
  const [modalDept, setModalDept] = useState('');
  const [modalApproved, setModalApproved] = useState(true);
  const [modalActive, setModalActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchWorkers = async () => {
    setLoading(true);
    let url = '/api/admin/workers?';
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (selectedArea) params.append('area', selectedArea);
    if (selectedDept) params.append('department', selectedDept);
    url += params.toString();

    const res = await api('admin').get(url);
    if (res.ok) {
      setWorkers(res.data.workers || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkers();
  }, [selectedArea, selectedDept]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchWorkers();
  };

  const handleQuickApprove = async (worker) => {
    const res = await api('admin').patch(`/api/admin/workers/${worker.id}`, {
      approved: true,
      active: true,
    });
    if (res.ok) {
      setWorkers((prev) =>
        prev.map((w) => (w.id === worker.id ? { ...w, approved: true, active: true } : w))
      );
    }
  };

  const openEditModal = (worker) => {
    setEditingWorker(worker);
    setModalArea(worker.area || AREAS[0] || 'Visakhapatnam');
    setModalDept(worker.department || DEPARTMENTS[0]);
    setModalApproved(worker.approved !== false);
    setModalActive(worker.active !== false);
    setModalError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    setModalError('');

    const res = await api('admin').patch(`/api/admin/workers/${editingWorker.id}`, {
      area: modalArea,
      department: modalDept,
      approved: modalApproved,
      active: modalActive,
    });

    if (res.ok) {
      setWorkers((prev) =>
        prev.map((w) =>
          w.id === editingWorker.id
            ? {
                ...w,
                area: modalArea,
                department: modalDept,
                approved: modalApproved,
                active: modalActive,
              }
            : w
        )
      );
      setEditingWorker(null);
    } else {
      setModalError(res.error || 'Failed to update worker assignment.');
    }
    setSavingEdit(false);
  };

  // Workforce KPI calculations
  const totalWorkers = workers.length;
  const approvedWorkers = workers.filter((w) => w.approved !== false && w.active !== false).length;
  const pendingApprovals = workers.filter((w) => w.approved === false).length;
  const totalActiveTasks = workers.reduce((acc, w) => acc + (Number(w.active_tasks) || 0), 0);
  const totalCompletedTasks = workers.reduce((acc, w) => acc + (Number(w.completed_tasks) || 0), 0);

  return (
    <div className="admin-main">
      <AdminNavbar
        title="Field Workforce Roster"
        subtitle="Manage municipal technicians, department allocations, and operational workloads"
        onToggleSidebar={onToggleSidebar}
        actions={
          <button
            type="button"
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={fetchWorkers}
            title="Refresh workforce roster"
          >
            <RefreshCw size={14} className={loading ? 'admin-spin' : ''} />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="admin-body">
        {/* Workforce KPI Cards */}
        <div className="admin-kpi-grid">
          <div className="admin-kpi-card">
            <div className="admin-kpi-icon blue">
              <HardHat size={24} />
            </div>
            <div className="admin-kpi-info">
              <p>Field Workforce</p>
              <h2>{totalWorkers}</h2>
              <span>Across all civil departments</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-icon green">
              <ShieldCheck size={24} />
            </div>
            <div className="admin-kpi-info">
              <p>Active & Deployed</p>
              <h2>{approvedWorkers}</h2>
              <span>{totalWorkers ? Math.round((approvedWorkers / totalWorkers) * 100) : 0}% operational readiness</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-icon amber">
              <Briefcase size={24} />
            </div>
            <div className="admin-kpi-info">
              <p>Active Work Orders</p>
              <h2>{totalActiveTasks}</h2>
              <span>{totalCompletedTasks} tasks completed</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-icon purple">
              <AlertTriangle size={24} />
            </div>
            <div className="admin-kpi-info">
              <p>Pending Approvals</p>
              <h2>{pendingApprovals}</h2>
              <span>{pendingApprovals > 0 ? 'Action required' : 'All technicians verified'}</span>
            </div>
          </div>
        </div>

        {/* Workforce Filter & Roster Card */}
        <div className="admin-card">
          <div className="admin-card-head" style={{ flexWrap: 'wrap', gap: 14 }}>
            <div className="admin-card-title">
              <h3>Field Technician Directory</h3>
              <p>Reassign municipal departments, check task loads, or approve onboarded workers</p>
            </div>

            {/* Filter Controls */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="admin-form-input"
                    style={{ paddingLeft: 36, minWidth: 220 }}
                    placeholder="Search worker ID or name..."
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
                style={{ minWidth: 150 }}
              >
                <option value="">All Municipal Areas</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>

              <select
                className="admin-form-select"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                style={{ minWidth: 160 }}
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748B' }}>
              <RefreshCw size={24} className="admin-spin" style={{ margin: '0 auto 12px' }} />
              <p>Loading worker roster...</p>
            </div>
          ) : workers.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748B' }}>
              <HardHat size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontWeight: 600, fontSize: '1rem', color: '#0F172A' }}>No technicians found</p>
              <p style={{ fontSize: '0.85rem' }}>Try broadening your search or selecting another department.</p>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Worker ID</th>
                    <th>Technician</th>
                    <th>Department</th>
                    <th>Assigned Ward</th>
                    <th>Active / Done</th>
                    <th>Approval</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: '#0077CC',
                            background: '#F0F7FF',
                            padding: '3px 8px',
                            borderRadius: 6,
                            border: '1px solid #D6EDFF'
                          }}
                        >
                          {w.worker_id || w.id.replace('usr_', '')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background: '#F1F5F9',
                              color: '#002651',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.82rem',
                              border: '1px solid #E2E8F0'
                            }}
                          >
                            {w.name ? w.name.charAt(0).toUpperCase() : 'W'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#002651' }}>{w.name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                              {w.phone || w.email || `@${w.username}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: '#F8FAFC',
                            padding: '4px 10px',
                            borderRadius: 8,
                            border: '1px solid #E2E8F0',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: '#1E293B'
                          }}
                        >
                          {w.department || 'General Maintenance'}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.85rem' }}>
                          <MapPin size={14} style={{ color: '#0077CC' }} />
                          <strong>{w.area || 'All Areas'}</strong>
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            className="admin-tag progress"
                            title="Active work orders currently assigned"
                          >
                            {w.active_tasks || 0} active
                          </span>
                          <span
                            className="admin-tag resolved"
                            title="Completed and resolved municipal complaints"
                          >
                            {w.completed_tasks || 0} done
                          </span>
                        </div>
                      </td>
                      <td>
                        {w.approved !== false ? (
                          <span className="admin-tag active">
                            <CheckCircle2 size={12} />
                            <span>Approved</span>
                          </span>
                        ) : (
                          <span className="admin-tag pending">
                            <AlertTriangle size={12} />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>
                      <td>
                        {w.active !== false ? (
                          <span className="admin-tag active">
                            <CheckCircle2 size={12} />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="admin-tag inactive">
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          {w.approved === false && (
                            <button
                              type="button"
                              className="admin-btn admin-btn-primary admin-btn-sm"
                              onClick={() => handleQuickApprove(w)}
                              title="Approve field worker for assignment"
                            >
                              <Check size={13} />
                              <span>Approve</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            onClick={() => openEditModal(w)}
                            title="Reassign department or municipal area"
                          >
                            <Edit size={13} />
                            <span>Reassign</span>
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

      {/* Edit / Reassignment Modal */}
      {editingWorker && (
        <div className="admin-modal-backdrop" onClick={() => setEditingWorker(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <div>
                <h3>Reassign Technician</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', opacity: 0.8 }}>
                  {editingWorker.name} ({editingWorker.worker_id || editingWorker.username})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingWorker(null)}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="admin-modal-body">
                {modalError && (
                  <div className="admin-error-box">
                    <AlertCircle size={15} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="admin-form-group">
                  <label htmlFor="modal-dept">Assigned Department</label>
                  <select
                    id="modal-dept"
                    className="admin-form-select"
                    value={modalDept}
                    onChange={(e) => setModalDept(e.target.value)}
                    required
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label htmlFor="modal-area">Jurisdiction Area / Ward</label>
                  <select
                    id="modal-area"
                    className="admin-form-select"
                    value={modalArea}
                    onChange={(e) => setModalArea(e.target.value)}
                    required
                  >
                    {AREAS.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.88rem' }}>
                    <input
                      type="checkbox"
                      checked={modalApproved}
                      onChange={(e) => setModalApproved(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: '#0077CC' }}
                    />
                    <span style={{ fontWeight: 600, color: '#002651' }}>
                      Worker is Approved for Live Complaint Dispatch
                    </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.88rem' }}>
                    <input
                      type="checkbox"
                      checked={modalActive}
                      onChange={(e) => setModalActive(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: '#0077CC' }}
                    />
                    <span style={{ fontWeight: 600, color: '#002651' }}>
                      Account is Active (Can sign in to field worker portal)
                    </span>
                  </label>
                </div>
              </div>

              <div className="admin-modal-foot">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setEditingWorker(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Saving...' : 'Save Reassignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

