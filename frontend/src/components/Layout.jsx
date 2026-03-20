import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X, Server } from 'lucide-react';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', position: 'relative' }}>
            {/* Mobile Header */}
            <header className="mobile-header" style={{
                display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: '60px',
                background: 'var(--bg-panel)', borderBottom: 'var(--glass-border)', zIndex: 90,
                alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem',
                backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                    <Server size={20} />
                    <span>ERP</span>
                </div>
                <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'var(--text-heading)', cursor: 'pointer' }}>
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main style={{ flex: 1, overflowY: 'auto', width: '100%' }}>
                <div className="app-shell" style={{ marginTop: '0' }}>
                    <Outlet />
                </div>
            </main>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                        zIndex: 95, backdropFilter: 'blur(2px)'
                    }}
                    className="mobile-overlay"
                />
            )}
        </div>
    );
}
