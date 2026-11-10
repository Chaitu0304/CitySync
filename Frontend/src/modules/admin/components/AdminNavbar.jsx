import { Menu } from 'lucide-react';

export default function AdminNavbar({ title, subtitle, actions, onToggleSidebar }) {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        {onToggleSidebar && (
          <button
            type="button"
            className="admin-mobile-toggle"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            title="Open Menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="admin-topbar-title">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      <div className="admin-topbar-actions">
        <div className="admin-status-pill">
          <div className="admin-status-dot" />
          <span>Operations Live</span>
        </div>

        {actions}
      </div>
    </header>
  );
}
