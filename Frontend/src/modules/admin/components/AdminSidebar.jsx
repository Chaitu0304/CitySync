import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, Users, HardHat, LogOut, X } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

const logoIcon = '/images/logo-icon-96.png';

export default function AdminSidebar({ mobileOpen = false, onCloseMobile }) {
  const { admin, logout } = useAdminAuth();

  return (
    <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="admin-sidebar-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={logoIcon} alt="CitySync Logo" className="admin-sidebar-logo" />
          <div className="admin-brand-text">
            <h2>City<span>Sync</span></h2>
            <span className="admin-badge">Admin Gateway</span>
          </div>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="admin-nav">
        <NavLink 
          to="/" 
          end 
          className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          onClick={onCloseMobile}
        >
          <LayoutDashboard size={19} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/authorities" 
          className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          onClick={onCloseMobile}
        >
          <ShieldCheck size={19} />
          <span>Authorities</span>
        </NavLink>

        <NavLink 
          to="/citizens" 
          className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          onClick={onCloseMobile}
        >
          <Users size={19} />
          <span>Citizens</span>
        </NavLink>

        <NavLink 
          to="/workers" 
          className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          onClick={onCloseMobile}
        >
          <HardHat size={19} />
          <span>Workers</span>
        </NavLink>
      </nav>

      <div className="admin-sidebar-foot">
        <div className="admin-user-info">
          <div className="admin-user-avatar">
            {admin?.name ? admin.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="admin-user-text">
            <h4>{admin?.name || 'Administrator'}</h4>
            <p>{admin?.employee_id || 'ADM-001'}</p>
          </div>
        </div>

        <button 
          type="button" 
          className="admin-logout-btn" 
          onClick={logout} 
          title="Sign out of Admin Portal" 
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
