import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import './styles/admin.css';

import AdminSidebar from './components/AdminSidebar';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AuthorityManager from './pages/AuthorityManager';
import CitizenDirectory from './pages/CitizenDirectory';
import WorkerRoster from './pages/WorkerRoster';
import { RefreshCw } from 'lucide-react';

function AdminLayout() {
  const { admin, loading } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setMobileOpen(false);
  }

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <RefreshCw size={28} className="admin-spin" style={{ color: '#1292EE' }} />
        <p style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 600 }}>Authenticating Executive Portal...</p>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="admin-layout">
      <AdminSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      {mobileOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <Outlet context={{ onToggleSidebar: () => setMobileOpen((v) => !v) }} />
    </div>
  );
}

function PublicAdminLogin() {
  const { admin, loading } = useAdminAuth();
  if (!loading && admin) {
    return <Navigate to="/" replace />;
  }
  return <AdminLogin />;
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <BrowserRouter basename="/admin">
        <Routes>
          <Route path="/login" element={<PublicAdminLogin />} />
          <Route element={<AdminLayout />}>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/authorities" element={<AuthorityManager />} />
            <Route path="/citizens" element={<CitizenDirectory />} />
            <Route path="/workers" element={<WorkerRoster />} />
            <Route path="/system" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}
