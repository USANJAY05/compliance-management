import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Server, Monitor, Key, PlusCircle, CheckCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function InventoryModule() {
    const { currentUser } = useAuth();
    const [assets, setAssets] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const canManageAssets = currentUser?.role === 'owner' || currentUser?.role === 'admin';

    // Form states
    const [assetType, setAssetType] = useState('Laptop');
    const [serialNumber, setSerialNumber] = useState('');
    const [notes, setNotes] = useState('');

    // Quick assign states mapping
    const [assignments, setAssignments] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [assetsRes, usersRes] = await Promise.all([
                fetch(`${API_BASE}/assets`),
                fetch(`${API_BASE}/users`)
            ]);

            if (assetsRes.ok) setAssets(await assetsRes.json());
            if (usersRes.ok) {
                const fetchedUsers = await usersRes.json();
                setUsersList(fetchedUsers);
            }
        } catch (err) {
            console.error("Failed to fetch Inventory data", err);
        } finally {
            setLoading(false);
        }
    };

    const registerAsset = async (e) => {
        e.preventDefault();
        setError(''); setMessage('');
        try {
            const payload = {
                asset_type: assetType,
                serial_number: serialNumber,
                notes,
                owner_agent: '' // Default to unassigned
            };
            const response = await fetch(`${API_BASE}/assets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                setMessage('Asset injected into inventory successfully.');
                setSerialNumber(''); setNotes('');
                fetchData();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to register asset');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const assignAsset = async (assetId, targetOwner) => {
        setError(''); setMessage('');
        try {
            const response = await fetch(`${API_BASE}/assets/${assetId}/assign`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ owner_agent: targetOwner })
            });
            if (response.ok) {
                setMessage(`Asset ownership physically transferred to ${targetOwner || 'Pool'}.`);
                fetchData(); // refresh list
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to assign asset');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleAssignmentChange = (assetId, val) => {
        setAssignments(prev => ({ ...prev, [assetId]: val }));
    };

    if (loading) return <div className="loading">Scanning Hardware Assets...</div>;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>Hardware Inventory</h2>
                <p>Register, track, and assign operational hardware and credentials entirely across the fleet.</p>
            </div>

            {error && <div className="error">{error}</div>}
            {message && <div className="message">{message}</div>}

            <div className="grid">
                {/* Register Asset Form */}
                {canManageAssets && (
                    <div className="panel" style={{ alignSelf: 'start', padding: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--info)' }}>
                            <PlusCircle size={24} />
                            <h3 style={{ margin: 0 }}>Register New Asset</h3>
                        </div>
                        <form onSubmit={registerAsset} className="ticket-form">
                            <div className="form-group">
                                <label>Asset Categorisation</label>
                                <select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
                                    <option value="Laptop">Operational Laptop (Mac/PC)</option>
                                    <option value="Mobile">Mobile Test Device</option>
                                    <option value="License">Software / System License</option>
                                    <option value="Server">Physical Server Instance</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Hardware Serial Number / UUID</label>
                                <input type="text" required value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="e.g. SN-99827X..." />
                            </div>
                            <div className="form-group">
                                <label>Logistical Notes</label>
                                <textarea rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional specs..."></textarea>
                            </div>
                            <button type="submit" className="btn-submit" style={{ width: '100%', background: 'linear-gradient(135deg, var(--info), #0284c7)' }}>
                                Inject Asset to Pool
                            </button>
                        </form>
                    </div>
                )}

                {/* Inventory List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', gridColumn: canManageAssets ? 'auto' : '1 / -1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-heading)' }}>
                        <Server size={24} />
                        <h3 style={{ margin: 0 }}>Active Fleet Directory</h3>
                    </div>
                    {assets.length === 0 ? (
                        <div className="empty-state">
                            <Monitor size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                            <p>No functional assets registered in the organizational database.</p>
                        </div>
                    ) : (
                        <div className="ticket-list" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                            {assets.map(asset => (
                                <div key={asset.id} className="ticket" style={{ padding: '1.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            {asset.asset_type === 'Laptop' || asset.asset_type === 'Mobile' ? <Monitor size={20} color="var(--primary)" /> : <Key size={20} color="var(--warning)" />}
                                            <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{asset.asset_type}</div>
                                        </div>
                                        <span className={`badge ${asset.status === 'available' ? 'sens-low' : 'sens-medium'}`}>
                                            {asset.status}
                                        </span>
                                    </div>

                                    <div className="ticket-body" style={{ margin: '1rem 0', fontSize: '0.9rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '0.5rem', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                                            S/N: {asset.serial_number}
                                        </div>
                                        {asset.notes && <p style={{ fontStyle: 'italic', opacity: 0.8 }}>"{asset.notes}"</p>}
                                    </div>

                                    {/* Assignment UI */}
                                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        {asset.status === 'assigned' ? (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ fontSize: '0.9rem' }}>
                                                    Assigned to: <strong style={{ color: 'var(--primary)' }}>{asset.owner_agent}</strong>
                                                </div>
                                                {canManageAssets && (
                                                    <button onClick={() => assignAsset(asset.id, '')} style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}>
                                                        Revoke
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            canManageAssets ? (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <select
                                                        style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                                                        value={assignments[asset.id] || ''}
                                                        onChange={(e) => handleAssignmentChange(asset.id, e.target.value)}
                                                    >
                                                        <option value="">Select Target...</option>
                                                        {usersList.map(u => (
                                                            <option key={u.id} value={u.id}>{u.id} ({u.role})</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => assignAsset(asset.id, assignments[asset.id])}
                                                        disabled={!assignments[asset.id]}
                                                        className="btn-submit"
                                                        style={{ margin: 0, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                    >
                                                        Assign
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '0.9rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <CheckCircle size={16} /> Ready in Pool
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
