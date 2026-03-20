import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ShieldAlert } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:5000';

export default function Login() {
    const { login } = useAuth();

    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // First-boot detection
    const [isFirstBoot, setIsFirstBoot] = useState(false);
    const [checkingNetwork, setCheckingNetwork] = useState(true);

    useEffect(() => {
        const checkInitialization = async () => {
            try {
                const res = await fetch(`${API_BASE}/users`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.length === 0) {
                        setIsFirstBoot(true);
                    }
                }
            } catch (err) {
                console.error("Network offline or backend missing.");
            } finally {
                setCheckingNetwork(false);
            }
        };
        checkInitialization();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, password })
            });

            if (res.ok) {
                const userData = await res.json();
                login(userData);
            } else {
                const fault = await res.json();
                setError(fault.error || 'Invalid credentials');
            }
        } catch (err) {
            setError(err.message || 'Server connection failed');
        } finally {
            setLoading(false);
        }
    };

    const handleInitialization = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Force create the first human owner account
            const res = await fetch(`${API_BASE}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: userId,
                    password: password,
                    role: 'owner',
                    team: 'Executive',
                    region: 'Global'
                })
            });

            if (res.ok) {
                // Immediately log them in
                login({ id: userId, role: 'owner' });
            } else {
                setError('Failed to instantiate root owner.');
            }
        } catch (err) {
            setError(err.message || 'Server connection failed');
        } finally {
            setLoading(false);
        }
    };

    if (checkingNetwork) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-body)' }}>Ping infrastructure...</div>;
    }

    if (isFirstBoot) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1.5rem', background: 'var(--bg-main)' }}>
                <div className="fade-in" style={{
                    width: '100%',
                    maxWidth: '460px',
                    padding: '3rem 2rem',
                    background: 'var(--bg-panel)',
                    borderRadius: '16px',
                    border: '2px solid var(--danger)',
                    boxShadow: 'var(--shadow-lg)',
                    backdropFilter: 'blur(20px)'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ margin: '0 auto 1.5rem auto', color: 'var(--danger)' }}>
                            <ShieldAlert size={48} />
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--danger)' }}>System Uninitialized</h2>
                        <p style={{ color: 'var(--text-body)', opacity: 0.9, fontSize: '0.95rem' }}>
                            No entities detected in the registry. You must securely provision the Root Human Owner identity before Artificial Agents can be deployed.
                        </p>
                    </div>

                    {error && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleInitialization} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><User size={16} /> Root Owner Identifier</label>
                            <input
                                type="text"
                                required
                                autoFocus
                                placeholder="e.g. root_human"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                style={{ padding: '0.85rem' }}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Lock size={16} /> Secure Password</label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ padding: '0.85rem' }}
                            />
                        </div>

                        <button type="submit" className="btn-submit" disabled={loading} style={{ marginTop: '0.5rem', padding: '1rem', fontSize: '1.05rem', background: 'var(--danger)', color: 'white', border: 'none' }}>
                            {loading ? 'Bootstrapping...' : 'Instantiate Root System'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Default Login Flow
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1.5rem', background: 'var(--bg-main)' }}>
            <div className="fade-in" style={{
                width: '100%',
                maxWidth: '420px',
                padding: '3rem 2rem',
                background: 'var(--bg-panel)',
                borderRadius: '16px',
                border: 'var(--glass-border)',
                boxShadow: 'var(--shadow-lg)',
                backdropFilter: 'blur(20px)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        margin: '0 auto 1.5rem auto',
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, var(--primary), var(--purple))',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <Lock size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-heading)' }}>Secure Portal</h2>
                    <p style={{ color: 'var(--text-body)', opacity: 0.8, fontSize: '0.95rem' }}>
                        Provide your registered credentials to access the ERP infrastructure.
                    </p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><User size={16} /> Identity Identifier</label>
                        <input
                            type="text"
                            required
                            autoFocus
                            placeholder="e.g. sanjay.u"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            style={{ padding: '0.85rem' }}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Lock size={16} /> Password</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ padding: '0.85rem' }}
                        />
                    </div>

                    <button type="submit" className="btn-submit" disabled={loading} style={{ marginTop: '0.5rem', padding: '1rem', fontSize: '1.05rem' }}>
                        {loading ? 'Verifying...' : 'Authorize Access'}
                    </button>
                </form>
            </div>
        </div>
    );
}
