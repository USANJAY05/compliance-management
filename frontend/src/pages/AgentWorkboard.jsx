import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Columns, Clock, PlayCircle, CheckCircle, Target, MapPin, Briefcase, Filter, User as UserIcon
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:301';

export default function AgentWorkboard() {
    const { currentUser } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [regions, setRegions] = useState([]);
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [selRegion, setSelRegion] = useState('All Regions');
    const [selTeam, setSelTeam] = useState('All Teams');
    const [selAgent, setSelAgent] = useState('All Agents');

    const fetchData = async () => {
        try {
            const [tic, reg, tea, usr] = await Promise.all([
                fetch(`${API_BASE}/tickets`),
                fetch(`${API_BASE}/regions`),
                fetch(`${API_BASE}/teams`),
                fetch(`${API_BASE}/users`)
            ]);

            if (tic.ok) setTickets(await tic.json());
            if (reg.ok) setRegions(await reg.json());
            if (tea.ok) setTeams(await tea.json());
            if (usr.ok) setUsers(await usr.json());
        } catch (err) {
            console.error("Pipeline sync error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredTickets = useMemo(() => {
        let items = tickets;
        if (selRegion !== 'All Regions') items = items.filter(t => t.region === selRegion);
        if (selTeam !== 'All Teams') items = items.filter(t => t.team === selTeam);
        if (selAgent !== 'All Agents') {
            items = items.filter(t => t.requesting_agent === selAgent || t.target_agent === selAgent);
        }
        return items;
    }, [tickets, selRegion, selTeam, selAgent]);

    if (loading) return <div className="loading">Compiling Hierarchical Workload...</div>;

    // Classification Pipeline (Reactive)
    const yetToPick = filteredTickets.filter(t => t.status === 'pending');
    const inProgress = filteredTickets.filter(t => t.status === 'approved' && !t.reviewed);
    const done = filteredTickets.filter(t => t.reviewed === true || t.status === 'completed');

    const handleAction = async (ticketId, endpoint, payload) => {
        try {
            const res = await fetch(`${API_BASE}/tickets/${ticketId}/${endpoint}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, current_user: currentUser?.id, current_role: currentUser?.role })
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error("Action failed:", err);
        }
    };

    const renderCard = (ticket) => {
        const isOwner = currentUser?.role === 'owner';

        return (
            <div key={ticket.id} className="ticket fade-in" style={{ padding: '1.25rem', marginBottom: '1rem', borderLeft: '3px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                    <span className="badge" style={{ fontSize: '0.65rem', background: 'var(--bg-main)', border: '1px solid var(--glass-border)' }}>
                        {ticket.ticket_type}
                    </span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.6, fontFamily: 'monospace' }}>#{ticket.id}</span>
                </div>

                <div style={{ fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.75rem', fontSize: '1rem' }}>
                    {ticket.title || `Request ${ticket.id}`}
                </div>

                {/* Silo Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        <MapPin size={10} /> {ticket.region || 'Global'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--purple)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        <Briefcase size={10} /> {ticket.team || 'General'}
                    </div>
                </div>

                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '0.75rem', lineHeight: '1.4' }}>
                    {ticket.description?.substring(0, 80)}{ticket.description?.length > 80 ? '...' : ''}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <UserIcon size={12} /> <span style={{ opacity: 0.7 }}>From:</span> <strong>{ticket.requesting_agent}</strong>
                    </div>
                    {ticket.target_agent ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                            <Target size={12} color="var(--primary)" />
                            <strong>{ticket.target_agent}</strong>
                        </div>
                    ) : isOwner && (
                        <button
                            className="btn-purple"
                            style={{ padding: '0.2rem 0.6rem', fontSize: '0.65rem', borderRadius: '4px' }}
                            onClick={() => handleAction(ticket.id, 'owner-approval', { approved: false, next_agent: currentUser.id })}
                        >
                            Claim Triage
                        </button>
                    )}
                </div>

                {isOwner && ticket.status === 'approved' && !ticket.reviewed && (
                    <button
                        className="btn-success"
                        style={{ width: '100%', marginTop: '0.75rem', padding: '0.4rem', fontSize: '0.75rem', borderRadius: '6px' }}
                        onClick={() => handleAction(ticket.id, 'reviewed', { reviewed: true, status: 'completed' })}
                    >
                        Validate & Finish
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="fade-in">
            <header className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Columns size={40} color="var(--primary)" />
                    <div>
                        <h2 style={{ margin: 0 }}>Agent Operations Pipeline</h2>
                        <p style={{ margin: 0, opacity: 0.8 }}>Triage autonomous actions across the decentralized matrix.</p>
                    </div>
                </div>

                {/* Governance Control Bar */}
                <div style={{
                    display: 'flex', gap: '0.75rem', background: 'var(--bg-panel)', padding: '0.75rem',
                    borderRadius: '10px', border: '1px solid var(--glass-border)', flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={14} color="var(--primary)" />
                        <select value={selRegion} onChange={e => setSelRegion(e.target.value)} className="select-sm">
                            <option>All Regions</option>
                            {regions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Briefcase size={14} color="var(--purple)" />
                        <select value={selTeam} onChange={e => setSelTeam(e.target.value)} className="select-sm">
                            <option>All Teams</option>
                            {teams.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserIcon size={14} color="var(--success)" />
                        <select value={selAgent} onChange={e => setSelAgent(e.target.value)} className="select-sm">
                            <option>All Agents</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.id}</option>)}
                        </select>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>

                {/* Yet to Pick Column */}
                <div className="panel" style={{ background: 'rgba(245, 158, 11, 0.03)', borderColor: 'rgba(245, 158, 11, 0.1)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--warning)', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(245, 158, 11, 0.1)' }}>
                        <Clock size={18} />
                        <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>Pending ({yetToPick.length})</h3>
                    </div>
                    <div>
                        {yetToPick.length === 0 ? <div style={{ opacity: 0.4, textAlign: 'center', padding: '2rem', fontSize: '0.9rem' }}>No filtered requests.</div> : yetToPick.map(renderCard)}
                    </div>
                </div>

                {/* In Progress Column */}
                <div className="panel" style={{ background: 'rgba(59, 130, 246, 0.03)', borderColor: 'rgba(59, 130, 246, 0.1)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(59, 130, 246, 0.1)' }}>
                        <PlayCircle size={18} />
                        <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>In Execution ({inProgress.length})</h3>
                    </div>
                    <div>
                        {inProgress.length === 0 ? <div style={{ opacity: 0.4, textAlign: 'center', padding: '2rem', fontSize: '0.9rem' }}>Empty silo pipeline.</div> : inProgress.map(renderCard)}
                    </div>
                </div>

                {/* Done Column */}
                <div className="panel" style={{ background: 'rgba(16, 185, 129, 0.03)', borderColor: 'rgba(16, 185, 129, 0.1)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--success)', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
                        <CheckCircle size={18} />
                        <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>Validated ({done.length})</h3>
                    </div>
                    <div>
                        {done.length === 0 ? <div style={{ opacity: 0.4, textAlign: 'center', padding: '2rem', fontSize: '0.9rem' }}>No matched completions.</div> : done.map(renderCard)}
                    </div>
                </div>

            </div>
        </div>
    );
}
