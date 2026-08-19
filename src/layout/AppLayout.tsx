import { NavLink, Outlet } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, LogOut, Moon, Store, Sun, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/restaurants', label: 'Restaurants', icon: Store },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/audit-logs', label: 'Audit logs', icon: ClipboardList },
];

export default function AppLayout() {
  const { logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">DB</div>
          <div>
            <strong>DailyBites</strong>
            <p>Admin console</p>
          </div>
        </div>

        <nav className="nav-list" aria-label="Admin navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="theme-toggle" onClick={toggle}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button type="button" className="logout-button" onClick={logout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations</p>
            <h1>Dashboard</h1>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}