import { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:5000';

export default function Dashboard() {
    const { currentUser } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [ccInputs, setCcInputs] = useState({});
    const [usersList, setUsersList] = useState([]);

    const fetchTickets = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE}/tickets`);
            if (!response.ok) {
                throw new Error('Unable to load tickets');
            }
            const data = await response.json();
            setTickets(data);
        } catch (err) {
            setError(err.message ?? 'Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        fetch(`${API_BASE}/users`)
            .then(res => res.json())
            .then(data => setUsersList(data))
            .catch(() => setUsersList([]));
    }, []);

    const updateTicket = async (ticketId, endpoint, payload) => {
        setError('');
        setMessage('');
        try {
            const finalPayload = { ...payload, current_user: currentUser?.id, current_role: currentUser?.role };
            const response = await fetch(`${API_BASE}/tickets/${ticketId}/${endpoint}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalPayload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.error || 'Unable to update ticket');
            }
            const updated = await response.json();
            setMessage(`Ticket #${updated.id} updated.`);
            setCcInputs(prev => ({ ...prev, [ticketId]: '' }));
            await fetchTickets();
        } catch (err) {
            setError(err.message ?? 'Failed to update ticket');
        }
    };

    const reviewAction = (ticket) =>
        updateTicket(ticket.id, 'reviewed', { reviewed: !ticket.reviewed });
    const confidentialAction = (ticket) =>
        updateTicket(ticket.id, 'confidential', { confidential: !ticket.confidential });
    const ownerApprovalAction = (ticket) => {
        const next_agent = ccInputs[ticket.id] || '';
        updateTicket(ticket.id, 'owner-approval', { approved: !ticket.owner_approved, next_agent });
    };
    const adminApprovalAction = (ticket) =>
        updateTicket(ticket.id, 'admin-approval', { approved: !ticket.admin_approved });

    const reviewedButtonText = (ticket) =>
        ticket.reviewed ? 'Reviewed ✅' : 'Mark Reviewed';
    const confidentialButtonText = (ticket) =>
        ticket.confidential ? 'Confidential ✅' : 'Mark Confidential';
    const ownerButtonText = (ticket) =>
        ticket.owner_approved ? 'Owner Approved ✅' : 'Owner Approve';
    const adminButtonText = (ticket) =>
        ticket.admin_approved ? 'Admin Approved ✅' : 'Mark Admin Approval';

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <ShieldCheck size={18} className="text-success" />;
            case 'pending': return <ShieldAlert size={18} className="text-warning" />;
            default: return <ShieldQuestion size={18} className="text-info" />;
        }
    };

    return (
        <section className="panel fade-in">
            <datalist id="users-list">
                {usersList.map((usr, i) => (
                    <option key={i} value={usr.id} />
                ))}
            </datalist>

            <header className="page-header">
                <h2>Dashboard</h2>
                <p>Welcome back, {currentUser?.id}. Review and act upon existing access tickets below.</p>
            </header>

            {error && <p className="error">{error}</p>}
            {message && <p className="message">{message}</p>}

            {loading ? (
                <p className="loading">Loading tickets…</p>
            ) : tickets.length === 0 ? (
                <div className="empty-state">
                    <ShieldQuestion size={48} />
                    <p>No tickets right now. Check back later or submit a new one.</p>
                </div>
            ) : (
                <div className="ticket-list">
                    {tickets.map((ticket) => (
                        <article key={ticket.id} className="ticket">
                            <header className="ticket-header">
                                <div className="ticket-id-wrapper">
                                    <strong>#{ticket.id}</strong>
                                    <span className={`status status-${ticket.status}`}>
                                        {getStatusIcon(ticket.status)} {ticket.status}
                                    </span>
                                </div>
                                <div className="ticket-title">{ticket.title || 'Untitled request'}</div>
                            </header>
                            <div className="ticket-body">
                                <p>
                                    <strong>Requested by:</strong> <span className="highlight-text">{ticket.requesting_agent}</span>
                                </p>
                                <p>
                                    <strong>Pending Approver:</strong>{' '}
                                    <span style={{ color: ticket.owner_approved ? 'green' : 'inherit', fontWeight: 600 }}>
                                        {ticket.target_agent ? ticket.target_agent : 'Unassigned'}
                                    </span>
                                </p>
                                <p>
                                    <strong>Ticket Type:</strong> {ticket.ticket_type}
                                </p>
                                <p>
                                    <strong>Permissions:</strong> {ticket.requested_permissions}
                                </p>
                                <p>
                                    <strong>Description:</strong> {ticket.description || 'No description provided'}
                                </p>
                                <p>
                                    <strong>Rationale:</strong> {ticket.rationale || '—'}
                                </p>
                                <p>
                                    <strong>Sensitivity:</strong> <span className={`badge sens-${ticket.sensitivity}`}>{ticket.sensitivity}</span>
                                </p>
                                {ticket.tagged_agents && (
                                    <p>
                                        <strong>Mentions (CC chain):</strong> {ticket.tagged_agents}
                                    </p>
                                )}
                            </div>
                            <div className="ticket-meta">
                                <span className={`approval-pill ${ticket.owner_approved ? 'approved' : 'pending'}`}>
                                    Owner: {ticket.owner_approved ? 'Yes' : 'Pending'}
                                </span>
                                <span className={`approval-pill ${ticket.admin_approved ? 'approved' : 'pending'}`}>
                                    Admin: {ticket.admin_approved ? 'Yes' : 'Pending'}
                                </span>
                            </div>

                            <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                                <select
                                    value={ccInputs[ticket.id] || ''}
                                    onChange={(e) => setCcInputs({ ...ccInputs, [ticket.id]: e.target.value })}
                                    title="Add CC here before clicking Owner Approve"
                                    disabled={ticket.owner_approved}
                                >
                                    <option value="">-- No CC (Direct Approve) --</option>
                                    {usersList.map((usr, i) => (
                                        <option key={i} value={usr.id}>{usr.id} ({usr.role})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="ticket-actions">
                                <button disabled={ticket.reviewed} className={`btn-action ${ticket.reviewed ? 'btn-success' : 'btn-default'} ${ticket.reviewed ? 'locked' : ''}`} onClick={() => reviewAction(ticket)}>
                                    {reviewedButtonText(ticket)}
                                </button>
                                <button disabled={ticket.confidential} className={`btn-action ${ticket.confidential ? 'btn-warning' : 'btn-default'} ${ticket.confidential ? 'locked' : ''}`} onClick={() => confidentialAction(ticket)}>
                                    {confidentialButtonText(ticket)}
                                </button>
                                <button disabled={ticket.owner_approved} className={`btn-action ${ticket.owner_approved ? 'btn-success' : 'btn-primary'} ${ticket.owner_approved ? 'locked' : ''}`} onClick={() => ownerApprovalAction(ticket)}>
                                    {ownerButtonText(ticket)}
                                </button>
                                <button disabled={ticket.admin_approved} className={`btn-action ${ticket.admin_approved ? 'btn-purple' : 'btn-default'} ${ticket.admin_approved ? 'locked' : ''}`} onClick={() => adminApprovalAction(ticket)}>
                                    {adminButtonText(ticket)}
                                </button>
                            </div>
                            <div className="ticket-footer">
                                <small>
                                    Created: {new Date(ticket.created_at).toLocaleString()} · Updated:{' '}
                                    {new Date(ticket.updated_at).toLocaleString()}
                                </small>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
