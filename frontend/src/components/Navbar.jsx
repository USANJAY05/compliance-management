import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Ticket, LogOut } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();
    const { currentUser, logout } = useAuth();

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <NavLink to="/" className="navbar-logo">
                    <Ticket size={24} />
                    <span>AccessTickets</span>
                </NavLink>
                <div className="navbar-links">
                    <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                        Dashboard
                    </NavLink>
                    <NavLink to="/submit" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                        Submit Ticket
                    </NavLink>
                    {currentUser && currentUser.role !== 'member' && (
                        <NavLink to="/manage-users" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                            Manage Users
                        </NavLink>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto', marginRight: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.85rem' }}>
                        <strong>{currentUser?.id}</strong>
                        <span style={{ opacity: 0.7 }}>{currentUser?.role?.toUpperCase()}</span>
                    </div>
                    <button onClick={logout} className="btn-default" style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <LogOut size={16} /> Logout
                    </button>
                    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                </div>
            </div>
        </nav>
    );
}
