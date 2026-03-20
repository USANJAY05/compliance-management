import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Ticket, GitCommit, Settings, Key, Code, Filter, MapPin, Briefcase
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:301';

export default function ERPDashboard() {
    const { currentUser } = useAuth();
    const [allTickets, setAllTickets] = useState([]);
    const [regions, setRegions] = useState(['All Regions']);
    const [teams, setTeams] = useState(['All Teams']);
    const [loading, setLoading] = useState(true);

    // Filtering State
    const [selectedRegion, setSelectedRegion] = useState('All Regions');
    const [selectedTeam, setSelectedTeam] = useState('All Teams');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tRes, rRes, tmRes] = await Promise.all([
                    fetch(`${API_BASE}/tickets`),
                    fetch(`${API_BASE}/regions`),
                    fetch(`${API_BASE}/teams`)
                ]);

                if (tRes.ok) setAllTickets(await tRes.json());
                if (rRes.ok) {
                    const rData = await rRes.json();
                    setRegions(['All Regions', ...rData]);
                }
                if (tmRes.ok) {
                    const tmData = await tmRes.json();
                    setTeams(['All Teams', ...tmData]);
                }
            } catch (err) {
                console.error("Dashboard sync error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Memoize the filtered metrics for performance
    const filteredMetrics = useMemo(() => {
        let filtered = allTickets;

        if (selectedRegion !== 'All Regions') {
            filtered = filtered.filter(t => t.region === selectedRegion);
        }
        if (selectedTeam !== 'All Teams') {
            filtered = filtered.filter(t => t.team === selectedTeam);
        }

        const calculateType = (validKeywords) => {
            return filtered.filter(t =>
                (t.reviewed === true || t.status === 'completed') &&
                validKeywords.some(kw => t.ticket_type?.toLowerCase().includes(kw) || t.title?.toLowerCase().includes(kw))
            ).length;
        };

        return {
            tickets: {
                total: filtered.length,
                pending: filtered.filter(t => t.status === 'pending').length
            },
            prsCommits: calculateType(['pr', 'commit', 'pusing', 'pushing', 'cloning']),
            software: calculateType(['software', 'install', 'uninstall']),
            creds: calculateType(['creds', 'credential']),
            access: calculateType(['access', 'permissions', 'managing access']),
            agentCreation: calculateType(['new agent', 'agent creation', 'create agent'])
        };
    }, [allTickets, selectedRegion, selectedTeam]);

    if (loading) return <div className="loading">Syncing Silo Telemetry...</div>;

    return (
        <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2rem', flexWrap: 'wrap' }}>
                <div>
                    <h2>Welcome back, <span className="highlight-text">{currentUser?.id}</span></h2>
                    <p>Global Intelligence Command. Drill down into specific Regional and Team performance metrics.</p>
                </div>

                {/* Global Hierarchy Filter */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    background: 'var(--bg-panel)',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: 'var(--glass-border)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={18} color="var(--primary)" />
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-body)' }}
                        >
                            {regions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Briefcase size={18} color="var(--purple)" />
                        <select
                            value={selectedTeam}
                            onChange={(e) => setSelectedTeam(e.target.value)}
                            style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-body)' }}
                        >
                            {teams.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid">
                {/* Metrics Panels same as before... */}
                <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--primary)' }}>
                        <Ticket size={28} />
                        <h3 style={{ margin: 0 }}>Silo Ticket Queue</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{filteredMetrics.tickets.total}</div>
                            <div style={{ color: 'var(--text-body)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.85rem' }}>Tracked in Silo</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--warning)' }}>{filteredMetrics.tickets.pending}</div>
                            <div style={{ color: 'var(--text-body)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.85rem' }}>Awaiting Input</div>
                        </div>
                    </div>
                </div>

                <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--purple)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--purple)' }}>
                        <GitCommit size={28} />
                        <h3 style={{ margin: 0 }}>Code Deployments</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{filteredMetrics.prsCommits}</div>
                            <div style={{ color: 'var(--text-body)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.85rem' }}>PRs / Commits Handled</div>
                        </div>
                    </div>
                </div>

                <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--info)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--info)' }}>
                        <Settings size={28} />
                        <h3 style={{ margin: 0 }}>Software Config</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{filteredMetrics.software}</div>
                            <div style={{ color: 'var(--text-body)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.85rem' }}>Apps Installed / Removed</div>
                        </div>
                    </div>
                </div>

                <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--success)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--success)' }}>
                        <Key size={28} />
                        <h3 style={{ margin: 0 }}>Identity & Access</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{filteredMetrics.creds}</div>
                            <div style={{ color: 'var(--text-body)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.85rem' }}>Credentials Rolled</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary)' }}>{filteredMetrics.access}</div>
                            <div style={{ color: 'var(--text-body)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.85rem' }}>Access Granted</div>
                        </div>
                    </div>
                </div>

                <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--warning)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--warning)' }}>
                        <Code size={28} />
                        <h3 style={{ margin: 0 }}>Agent Instantiation</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{filteredMetrics.agentCreation}</div>
                            <div style={{ color: 'var(--text-body)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.85rem' }}>New Agents Deployed via Tickets</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
