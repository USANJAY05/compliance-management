import { useState, useMemo, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:301';
const defaultForm = {
    requesting_agent: '',
    requested_permissions: '',
    sensitivity: 'low',
    status: 'pending',
    confidential: false,
    title: '',
    description: '',
    rationale: '',
    target_agent: '',
    tagged_agents: '',
    ticket_type: 'Other',
};

export default function SubmitTicket() {
    const [form, setForm] = useState(defaultForm);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [ticketTypes, setTicketTypes] = useState(['Other']);
    const [usersList, setUsersList] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE}/ticket-types`)
            .then(res => res.json())
            .then(data => setTicketTypes(data))
            .catch(() => setTicketTypes(['Other']));

        fetch(`${API_BASE}/users`)
            .then(res => res.json())
            .then(data => setUsersList(data))
            .catch(() => setUsersList([]));
    }, []);

    const statusLabels = useMemo(
        () => [
            { value: 'pending', label: 'Pending' },
            { value: 'reviewed', label: 'Reviewed' },
            { value: 'approved', label: 'Approved' },
            { value: 'needs-info', label: 'Needs more info' },
        ],
        []
    );

    const { currentUser } = useAuth();

    useEffect(() => {
        if (currentUser?.id) {
            setForm(f => ({ ...f, requesting_agent: currentUser.id }));
        }
    }, [currentUser]);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError('');
        setMessage('');
        try {
            const response = await fetch(`${API_BASE}/tickets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!response.ok) {
                const payload = await response.json();
                throw new Error(payload?.error || 'Unable to create ticket');
            }
            const created = await response.json();
            setMessage(`Ticket #${created.id} submitted for review.`);
            setForm(defaultForm);
        } catch (err) {
            setError(err.message ?? 'Failed to submit ticket');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="grid fade-in">
            <article className="panel">
                <header className="page-header">
                    <h2>Submit a Ticket</h2>
                    <p>Request elevated permissions or actions securely.</p>
                </header>

                {error && <p className="error">{error}</p>}
                {message && <p className="message">{message}</p>}

                <form onSubmit={handleSubmit} className="ticket-form">
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Short summary"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group half-width">
                            <label>Requesting Agent *</label>
                            <select
                                name="requesting_agent"
                                value={form.requesting_agent}
                                onChange={handleChange}
                                required
                            >
                                <option value="" disabled>-- Select Agent --</option>
                                {usersList.map((usr, i) => (
                                    <option key={i} value={usr.id}>{usr.id} ({usr.role})</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group half-width">
                            <label>Target Agent</label>
                            <select
                                name="target_agent"
                                value={form.target_agent}
                                onChange={handleChange}
                            >
                                <option value="">-- Select Target (Optional) --</option>
                                {usersList.map((usr, i) => (
                                    <option key={i} value={usr.id}>{usr.id} ({usr.role})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Requested Permissions *</label>
                        <textarea
                            name="requested_permissions"
                            value={form.requested_permissions}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Describe access needed"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description / Reason</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Context and urgency"
                        />
                    </div>

                    <div className="form-group">
                        <label>Rationale</label>
                        <textarea
                            name="rationale"
                            value={form.rationale}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Compliance notes"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group half-width">
                            <label>Ticket Type</label>
                            <select
                                name="ticket_type"
                                value={form.ticket_type}
                                onChange={handleChange}
                            >
                                {ticketTypes.map((type, idx) => (
                                    <option key={idx} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group half-width">
                            <label>Sensitivity</label>
                            <select
                                name="sensitivity"
                                value={form.sensitivity}
                                onChange={handleChange}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div className="form-group half-width">
                            <label>Status</label>
                            <select name="status" value={form.status} onChange={handleChange}>
                                {statusLabels.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Tagged Agents</label>
                        <input
                            name="tagged_agents"
                            value={form.tagged_agents}
                            onChange={handleChange}
                            placeholder="Comma-separated extras"
                        />
                    </div>

                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            name="confidential"
                            checked={form.confidential}
                            onChange={handleChange}
                        />
                        <span className="checkbox-text">Mark as confidential</span>
                    </label>

                    <button type="submit" disabled={submitting} className="btn-submit">
                        {submitting ? 'Submitting...' : 'Submit ticket'}
                    </button>
                </form>
            </article>

            <article className="panel">
                <header className="page-header">
                    <h2>Policy & Workflow</h2>
                </header>
                <div className="policy-content">
                    <p>
                        Tickets persist in compliance storage at <code>backend/data/tickets.db</code>.
                        Admins must review each ticket, mark owner/admin approvals, and only
                        grant access once all approval flags are satisfied.
                    </p>
                    <p>
                        The organizational map (Regions/Teams) is now dynamic. Every ticket inherits the context of its localized silo.
                    </p>
                    <div className="card-info">
                        <p>
                            Run <strong><code>bash backend/scripts/agent_guidance.sh</code></strong> for a quick reminder of the workflow.
                        </p>
                    </div>
                </div>
            </article>
        </div>
    );
}
