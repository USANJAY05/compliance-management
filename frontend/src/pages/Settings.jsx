import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, MapPin, Briefcase, ShieldCheck, Ticket } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:301';

const ConfigSection = ({ title, icon: Icon, items, onAdd, onDelete, protectedItems = [] }) => {
    const [newValue, setNewValue] = useState('');

    return (
        <article className="panel" style={{ marginBottom: '2rem' }}>
            <header className="page-header" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                    <Icon size={24} color="var(--primary)" />
                    {title}
                </h3>
            </header>

            <form onSubmit={(e) => { e.preventDefault(); onAdd(newValue); setNewValue(''); }} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder={`New ${title.slice(0, -1)}...`}
                    style={{ flex: 1, padding: '0.6rem' }}
                />
                <button type="submit" className="btn-submit" style={{ padding: '0.6rem 1.5rem', whiteSpace: 'nowrap' }}>
                    <Plus size={18} /> Add
                </button>
            </form>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {items.map((item, idx) => (
                    <div key={idx} className="ticket" style={{
                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 1rem',
                        background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)'
                    }}>
                        <span style={{ fontWeight: '600' }}>{item}</span>
                        {!protectedItems.includes(item) && (
                            <button
                                onClick={() => onDelete(item)}
                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem', display: 'flex', opacity: 0.7 }}
                                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </article>
    );
};

export default function Settings() {
    const [ticketTypes, setTicketTypes] = useState([]);
    const [regions, setRegions] = useState([]);
    const [teams, setTeams] = useState([]);
    const [roles, setRoles] = useState([]);
    const [message, setMessage] = useState('');

    const fetchData = async (endpoint, setter) => {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`);
            if (res.ok) {
                const data = await res.json();
                setter(data);
            }
        } catch (err) {
            console.error(`Fetch error for ${endpoint}:`, err);
        }
    };

    useEffect(() => {
        fetchData('/ticket-types', setTicketTypes);
        fetchData('/regions', setRegions);
        fetchData('/teams', setTeams);
        fetchData('/roles', setRoles);
    }, []);

    const performAction = async (endpoint, action, value, setter) => {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, value })
            });
            if (res.ok) {
                const data = await res.json();
                setter(data);
                setMessage(`Successfully updated ${endpoint.slice(1)}`);
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) {
            console.error(`Action error for ${endpoint}:`, err);
        }
    };

    return (
        <div className="fade-in">
            <header className="page-header" style={{ marginBottom: '2rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <SettingsIcon size={32} /> Universal Platform Configuration
                </h2>
                <p>Purge the final hardcoded constraints. Define your global Geography, Departments, and Security Tiers.</p>
            </header>

            {message && <div className="message" style={{ marginBottom: '2rem', textAlign: 'center' }}>{message}</div>}

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                <ConfigSection
                    title="Ticket Typologies"
                    icon={Ticket}
                    items={ticketTypes}
                    onAdd={(v) => performAction('/ticket-types', 'add', v, setTicketTypes)}
                    onDelete={(v) => performAction('/ticket-types', 'remove', v, setTicketTypes)}
                    protectedItems={['Other']}
                />
                <ConfigSection
                    title="Geographic Regions"
                    icon={MapPin}
                    items={regions}
                    onAdd={(v) => performAction('/regions', 'add', v, setRegions)}
                    onDelete={(v) => performAction('/regions', 'remove', v, setRegions)}
                    protectedItems={['Global']}
                />
                <ConfigSection
                    title="Dynamic Teams"
                    icon={Briefcase}
                    items={teams}
                    onAdd={(v) => performAction('/teams', 'add', v, setTeams)}
                    onDelete={(v) => performAction('/teams', 'remove', v, setTeams)}
                    protectedItems={['General']}
                />
                <ConfigSection
                    title="Security Roles"
                    icon={ShieldCheck}
                    items={roles}
                    onAdd={(v) => performAction('/roles', 'add', v, setRoles)}
                    onDelete={(v) => performAction('/roles', 'remove', v, setRoles)}
                    protectedItems={['owner', 'admin']}
                />
            </div>
        </div>
    );
}
