import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    LayoutDashboard,
    Ticket,
    Users,
    Server,
    Settings,
    LogOut,
    Sun,
    Moon,
    Columns,
    X
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
    const { theme, toggleTheme } = useTheme();
    const { currentUser, logout } = useAuth();

    // Non-members can manage users
    const canManageUsers = currentUser && currentUser.role !== 'member';

    return (
        <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <Server size={24} />
                    <span>ERP Portal</span>
                </div>
                <button className="mobile-close-btn" onClick={onClose} style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text-body)' }}>
                    <X size={24} />
                </button>
            </div>

            <div className="sidebar-user">
                <div className="user-avatar">
                    {currentUser?.id?.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                    <div className="user-name">{currentUser?.id}</div>
                    <div className="user-role badge sens-low">{currentUser?.role}</div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">MAIN MENU</div>
                <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} onClick={onClose} end>
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>

                <div className="nav-section">MODULES</div>
                <NavLink to="/tickets" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} onClick={onClose}>
                    <Ticket size={20} />
                    <span>Ticketing</span>
                </NavLink>

                <div className="nav-section">AGENT OPERATIONS</div>
                <NavLink to="/agent-work" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} onClick={onClose}>
                    <Columns size={20} />
                    <span>Work Board</span>
                </NavLink>

                {canManageUsers && (
                    <>
                        <div className="nav-section">SYSTEM</div>
                        <NavLink to="/manage-users" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} onClick={onClose}>
                            <Users size={20} />
                            <span>Manage Users</span>
                        </NavLink>
                        <NavLink to="/settings" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} onClick={onClose}>
                            <Settings size={20} />
                            <span>Configuration</span>
                        </NavLink>
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <button className="theme-toggle-btn" onClick={toggleTheme}>
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
                <button className="logout-btn" onClick={logout}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
