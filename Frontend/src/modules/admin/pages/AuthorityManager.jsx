import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ShieldCheck, Plus, Key, Copy, Check, Trash2, MapPin, RefreshCw, X, AlertCircle } from 'lucide-react';
import { api } from '../../../shared/api';
import { AREAS } from '../../../shared/areas';
import AdminNavbar from '../components/AdminNavbar';

export default function AuthorityManager() {
  const [authorities, setAuthorities] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const outletCtx = useOutletContext();
  const onToggleSidebar = outletCtx?.onToggleSidebar;

  // Modals
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Invite Form
  const [inviteArea, setInviteArea] = useState(AREAS[0] || 'Visakhapatnam');
  const [inviteDays, setInviteDays] = useState(7);
  const [inviteNote, setInviteNote] = useState('');
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Direct Create Form
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authArea, setAuthArea] = useState(AREAS[0] || 'Visakhapatnam');
  const [authPhone, setAuthPhone] = useState('');
  const [authEmpId, setAuthEmpId] = useState('');
  const [createdOfficer, setCreatedOfficer] = useState(null);

  const [actionError, setActionError] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [authRes, invRes] = await Promise.all([
      api('admin').get('/api/admin/authorities'),
      api('admin').get('/api/admin/invites'),
    ]);
    if (authRes.ok) setAuthorities(authRes.data.authorities || []);
    if (invRes.ok) setInvites(invRes.data.invites || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    setActionError('');
    const res = await api('admin').post('/api/admin/invites', {
      area: inviteArea,
      days: inviteDays,
      note: inviteNote,
    });
    if (res.ok) {
      setGeneratedInvite(res.data.invite);
      loadData();
    } else {
      setActionError(res.error || 'Failed to generate invite code.');
    }
  };

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    setActionError('');
    const res = await api('admin').post('/api/admin/authorities', {
      name: authName,
      email: authEmail,
      area: authArea,
      phone: authPhone,
      employeeId: authEmpId,
    });
    if (res.ok) {
      setCreatedOfficer(res.data.authority);
      loadData();
    } else {
      setActionError(res.error || 'Failed to create officer.');
    }
  };

  const handleToggleStatus = async (auth) => {
    const res = await api('admin').patch(`/api/admin/authorities/${auth.id}`, {
      active: !auth.active,
    });
    if (res.ok) {
      setAuthorities((prev) =>
        prev.map((a) => (a.id === auth.id ? { ...a, active: !a.active } : a))
      );
    }
  };

  const handleRevokeInvite = async (inviteId) => {
    if (!window.confirm('Are you sure you want to revoke this invite code?')) return;
    const res = await api('admin').del(`/api/admin/invites/${inviteId}`);
    if (res.ok) {
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="admin-main">
      <AdminNavbar
        title="Municipal Authorities & Invites"
        subtitle="Manage designated ward officers and issue registration invite codes"
        onToggleSidebar={onToggleSidebar}
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={() => {
                setGeneratedInvite(null);
                setInviteModalOpen(true);
              }}
            >
              <Key size={15} />
              <span>Generate Invite Code</span>
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary admin-btn-sm"
              onClick={() => {
                setCreatedOfficer(null);
                setCreateModalOpen(true);
              }}
            >
              <Plus size={15} />
              <span>Add Officer Directly</span>
            </button>
          </div>
        }
      />

      <div className="admin-body">
        {/* Active Officers Table */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div className="admin-card-title">
              <h3>Authorized Officers Directory</h3>
              <p>{authorities.length} active municipal officers managing city jurisdictions</p>
            </div>
            <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={loadData}>
              <RefreshCw size={13} className={loading ? 'admin-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Officer Name</th>
                  <th>Jurisdiction Area</th>
                  <th>Official Email</th>
                  <th>Phone</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {authorities.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>
                      No authority accounts found.
                    </td>
                  </tr>
                ) : (
                  authorities.map((a) => (
                    <tr key={a.id}>
                      <td><code style={{ background: '#F1F5F9', padding: '3px 8px', borderRadius: 6, fontWeight: 700, color: '#034077' }}>{a.employee_id}</code></td>
                      <td><strong>{a.name}</strong></td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#002651', fontWeight: 600 }}>
                          <MapPin size={14} color="#1292EE" />
                          {a.area}
                        </span>
                      </td>
                      <td>{a.email}</td>
                      <td>{a.phone || '—'}</td>
                      <td>
                        <span className={`admin-tag ${a.active ? 'active' : 'inactive'}`}>
                          {a.active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`admin-btn admin-btn-sm ${a.active ? 'admin-btn-danger' : 'admin-btn-secondary'}`}
                          onClick={() => handleToggleStatus(a)}
                        >
                          {a.active ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invite Codes Management */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div className="admin-card-title">
              <h3>Issued Registration Invite Codes</h3>
              <p>Area-locked authorization codes used by officers to sign up</p>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Jurisdiction Area</th>
                  <th>Expiration</th>
                  <th>Status</th>
                  <th>Consumed By</th>
                  <th>Note</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invites.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>
                      No invite codes have been generated yet.
                    </td>
                  </tr>
                ) : (
                  invites.map((inv) => {
                    const isUsed = Boolean(inv.used_at);
                    const isExpired = new Date(inv.expires_at) < new Date();
                    return (
                      <tr key={inv.id}>
                        <td>
                          <strong>{inv.area}</strong>
                        </td>
                        <td>{new Date(inv.expires_at).toLocaleDateString()}</td>
                        <td>
                          {isUsed ? (
                            <span className="admin-tag active">Used</span>
                          ) : isExpired ? (
                            <span className="admin-tag inactive">Expired</span>
                          ) : (
                            <span className="admin-tag progress">Active & Valid</span>
                          )}
                        </td>
                        <td>
                          {inv.used_by_name ? (
                            <span>{inv.used_by_name} ({inv.used_by_emp_id})</span>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>Unused</span>
                          )}
                        </td>
                        <td>{inv.note || '—'}</td>
                        <td>
                          {!isUsed && !isExpired && (
                            <button
                              type="button"
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              onClick={() => handleRevokeInvite(inv.id)}
                              title="Revoke code"
                            >
                              <Trash2 size={13} />
                              <span>Revoke</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Generate Invite Code */}
      {inviteModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setInviteModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h3>Generate Officer Invite Code</h3>
              <button type="button" className="admin-logout-btn" onClick={() => setInviteModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {generatedInvite ? (
              <div className="admin-modal-body">
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <Check size={28} />
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '1.2rem', color: '#002651' }}>Invite Code Ready!</h4>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748B' }}>
                    Share this code with the officer. It is locked to <strong>{generatedInvite.area}</strong> and can only be used once.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#F1F5F9', borderRadius: 12, border: '1px dashed #CBD5E1' }}>
                  <code style={{ fontSize: '1.15rem', fontWeight: 800, color: '#034077', letterSpacing: '0.04em' }}>
                    {generatedInvite.code}
                  </code>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary admin-btn-sm"
                    onClick={() => copyToClipboard(generatedInvite.code)}
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>

                <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '8px 0 0' }}>
                  Expires on: {new Date(generatedInvite.expiresAt).toLocaleDateString()}
                </p>

                <div className="admin-modal-foot" style={{ margin: '12px -24px -24px' }}>
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setInviteModalOpen(false)}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite}>
                <div className="admin-modal-body">
                  {actionError && <div className="admin-error-box">{actionError}</div>}

                  <div className="admin-form-group">
                    <label>Jurisdiction Area</label>
                    <select
                      className="admin-form-select"
                      value={inviteArea}
                      onChange={(e) => setInviteArea(e.target.value)}
                    >
                      {AREAS.map((ar) => (
                        <option key={ar} value={ar}>{ar}</option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Validity Duration</label>
                    <select
                      className="admin-form-select"
                      value={inviteDays}
                      onChange={(e) => setInviteDays(Number(e.target.value))}
                    >
                      <option value={1}>1 Day</option>
                      <option value={3}>3 Days</option>
                      <option value={7}>7 Days (Recommended)</option>
                      <option value={30}>30 Days</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Internal Note (Optional)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. Issued for Ward 4 Chief Officer"
                      value={inviteNote}
                      onChange={(e) => setInviteNote(e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-modal-foot">
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setInviteModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary">
                    Generate Code
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Officer Directly */}
      {createModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h3>Create Municipal Officer</h3>
              <button type="button" className="admin-logout-btn" onClick={() => setCreateModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {createdOfficer ? (
              <div className="admin-modal-body">
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <Check size={26} />
                  </div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1.15rem', color: '#002651' }}>Officer Account Created!</h4>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B' }}>
                    Provide these credentials to <strong>{createdOfficer.name}</strong> to sign in to the Authority Portal.
                  </p>
                </div>

                <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div><strong>Employee ID:</strong> <code>{createdOfficer.employeeId}</code></div>
                  <div><strong>Email:</strong> <code>{createdOfficer.email}</code></div>
                  <div><strong>Jurisdiction:</strong> <span>{createdOfficer.area}</span></div>
                  <div><strong>Temporary Password:</strong> <code style={{ color: '#034077', fontWeight: 700 }}>{createdOfficer.temporaryPassword}</code></div>
                </div>

                <div className="admin-modal-foot" style={{ margin: '14px -24px -24px' }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() => {
                      copyToClipboard(`CitySync Authority Account:\nEmployee ID: ${createdOfficer.employeeId}\nPassword: ${createdOfficer.temporaryPassword}\nArea: ${createdOfficer.area}`);
                    }}
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedCode ? 'Credentials Copied!' : 'Copy Credentials'}</span>
                  </button>
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setCreateModalOpen(false)}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateOfficer}>
                <div className="admin-modal-body">
                  {actionError && <div className="admin-error-box">{actionError}</div>}

                  <div className="admin-form-group">
                    <label>Officer Full Name</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. Ramesh Varma"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Official Email</label>
                    <input
                      type="email"
                      className="admin-form-input"
                      placeholder="e.g. ramesh@city.gov.in"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Jurisdiction Area</label>
                    <select
                      className="admin-form-select"
                      value={authArea}
                      onChange={(e) => setAuthArea(e.target.value)}
                    >
                      {AREAS.map((ar) => (
                        <option key={ar} value={ar}>{ar}</option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Phone Number (Optional)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="+919800000000"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Employee ID (Optional, auto-generated if blank)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. AUTH-015"
                      value={authEmpId}
                      onChange={(e) => setAuthEmpId(e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-modal-foot">
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setCreateModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary">
                    Create Officer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

