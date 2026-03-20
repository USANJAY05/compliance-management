import { useEffect, useState, useMemo } from 'react';
import { ShieldCheck, MapPin, Briefcase, User as UserIcon, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:301';

export default function UserManagement() {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [regions, setRegions] = useState(['Global']);
    const [teams, setTeams] = useState(['General']);
    const [roles, setRoles] = useState(['member', 'agent']);

    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');

    // Provisioning State
    const [newId, setNewId] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [newRole, setNewRole] = useState('agent');
    const [newTeam, setNewTeam] = useState('General');
    const [newRegion, setNewRegion] = useState('Global');

    // UI State
    const [expandedRegions, setExpandedRegions] = useState({});

    const fetchData = async (endpoint, setter) => {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`);
            if (res.ok) {
                const data = await res.json();
                setter(data);
                return data;
            }
        } catch (e) {
            console.error(`Fetch error for ${endpoint}:`, e);
        }
        return [];
    };

    const fetchUsers = () => fetchData('/users', setUsers);

    useEffect(() => {
        fetchUsers();
        fetchData('/regions', (data) => {
            setRegions(data);
            setExpandedRegions(data.reduce((acc, r) => ({ ...acc, [r]: true }), {}));
            if (data.length > 0) setNewRegion(data[0]);
        });
        fetchData('/teams', (data) => {
            setTeams(data);
            if (data.length > 0) setNewTeam(data[0]);
        });
        fetchData('/roles', (data) => {
            setRoles(data);
            if (data.length > 0) setNewRole(data[0]);
        });
    }, []);

    const groupedUsers = useMemo(() => {
        const groups = regions.reduce((acc, r) => ({ ...acc, [r]: {} }), {});
        users.forEach(u => {
            const r = u.region || 'Global';
            const t = u.team || 'General';
            if (!groups[r]) groups[r] = {};
            if (!groups[r][t]) groups[r][t] = [];
            groups[r][t].push(u);
        });
        return groups;
    }, [users, regions]);

    const toggleRegion = (r) => {
        setExpandedRegions(prev => ({ ...prev, [r]: !prev[r] }));
    };

    const updateAttribute = async (usr, attr, val) => {
        setError('');
        setMsg('');
        const payload = { ...usr };
        payload[attr] = val;

        try {
            const res = await fetch(`${API_BASE}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setMsg(`Successfully migrated ${usr.id}`);
                fetchUsers();
            } else {
                setError('Failed to migrate identity attribute');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const deleteUser = async (usr) => {
        setError('');
        setMsg('');
        try {
            const res = await fetch(`${API_BASE}/users/${usr.id}`, { method: 'DELETE' });
            if (res.ok) {
                setMsg(`Purged credentials for ${usr.id}`);
                fetchUsers();
            } else {
                setError('Failed to scrub identity');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleProvision = async (e) => {
        e.preventDefault();
        setError('');
        setMsg('');
        try {
            const res = await fetch(`${API_BASE}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: newId, password: newPwd, role: newRole, team: newTeam, region: newRegion
                })
            });
            if (res.ok) {
                setMsg(`Successfully deployed entity: ${newId}`);
                setNewId(''); setNewPwd('');
                fetchUsers();
            } else {
                setError('Failed to deploy new entity.');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    if (currentUser?.role === 'member' || currentUser?.role === 'agent') {
        return (
            <div className="panel fade-in">
                <h2>Access Denied</h2>
                <p>Base-level entities lack organizational governance permissions.</p>
            </div>
        );
    }

    return (
        <section className="panel fade-in">
            <header className="page-header" style={{ marginBottom: '2rem' }}>
                <h2>Hierarchical Intelligence Matrix</h2>
                <p>Manage multiple Regions, each containing multiple Teams of Human and Artificial Agents.</p>
            </header>

            {error && <p className="error" style={{ textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
            {msg && <p className="message" style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--success)' }}>{msg}</p>}

            {/* Creation Block */}
            <div className="ticket" style={{ borderLeft: '4px solid var(--primary)', marginBottom: '2.5rem', background: 'rgba(56, 189, 248, 0.05)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)', fontSize: '1.2rem' }}>
                    <Plus size={20} /> Provision New Entity
                </h3>
                <form onSubmit={handleProvision} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 150px' }}>
                        <label className="label-sm">Identity ID</label>
                        <input type="text" required value={newId} onChange={e => setNewId(e.target.value)} placeholder="agent_node" style={{ width: '100%', padding: '0.5rem' }} />
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                        <label className="label-sm">Password</label>
                        <input type="password" required value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="••••" style={{ width: '100%', padding: '0.5rem' }} />
                    </div>
                    <div style={{ flex: '1 1 100px' }}>
                        <label className="label-sm">Role</label>
                        <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ width: '100%', padding: '0.5rem' }}>
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                        <label className="label-sm">Target Region</label>
                        <select value={newRegion} onChange={e => setNewRegion(e.target.value)} style={{ width: '100%', padding: '0.5rem' }}>
                            {regions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                        <label className="label-sm">Target Team</label>
                        <select value={newTeam} onChange={e => setNewTeam(e.target.value)} style={{ width: '100%', padding: '0.5rem' }}>
                            {teams.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="btn-submit" style={{ padding: '0.6rem 1.5rem' }}>Deploy</button>
                </form>
            </div>

            {/* Hierarchical List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {regions.map(region => (
                    <div key={region} className="region-block" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                        <button
                            onClick={() => toggleRegion(region)}
                            style={{
                                width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem',
                                background: 'rgba(56, 189, 248, 0.1)', border: 'none', color: 'var(--text-heading)', cursor: 'pointer',
                                fontSize: '1.1rem', fontWeight: '700'
                            }}
                        >
                            {expandedRegions[region] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            <MapPin size={18} color="var(--primary)" />
                            {region} Sector
                        </button>

                        {expandedRegions[region] && (
                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {(!groupedUsers[region] || Object.keys(groupedUsers[region]).length === 0) ? (
                                    <p style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center' }}>No active deployments in this region.</p>
                                ) : (
                                    Object.keys(groupedUsers[region]).map(team => (
                                        <div key={team} style={{ borderLeft: '2px dashed var(--glass-border)', paddingLeft: '1.5rem' }}>
                                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                <Briefcase size={16} /> {team} Team
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {groupedUsers[region][team].map(usr => (
                                                    <div key={usr.id} className="ticket" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <UserIcon size={16} color="var(--primary)" />
                                                            <span><strong>{usr.id}</strong> <small style={{ opacity: 0.6 }}>({usr.role})</small></span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <select value={usr.region} onChange={e => updateAttribute(usr, 'region', e.target.value)} style={{ padding: '0.2rem' }}>
                                                                {regions.map(r => <option key={r} value={r}>{r}</option>)}
                                                            </select>
                                                            <select value={usr.team} onChange={e => updateAttribute(usr, 'team', e.target.value)} style={{ padding: '0.2rem' }}>
                                                                {teams.map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                            {usr.role !== 'owner' && (
                                                                <button className="btn-action btn-danger" onClick={() => deleteUser(usr)}>Scrub</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
