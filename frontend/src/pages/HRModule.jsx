import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, CheckCircle, Clock, XCircle, Users } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function HRModule() {
    const { currentUser } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const canReview = currentUser?.role === 'owner' || currentUser?.role === 'admin';

    // Form states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [leaveType, setLeaveType] = useState('annual');
    const [reason, setReason] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [leavesRes, usersRes] = await Promise.all([
                fetch(`${API_BASE}/leaves`),
                fetch(`${API_BASE}/users`)
            ]);

            if (leavesRes.ok) setLeaves(await leavesRes.json());
            if (usersRes.ok) setUsersList(await usersRes.json());
        } catch (err) {
            console.error("Failed to fetch HR data", err);
        } finally {
            setLoading(false);
        }
    };

    const submitLeave = async (e) => {
        e.preventDefault();
        setError(''); setMessage('');
        try {
            const payload = {
                requesting_agent: currentUser.id,
                leave_type: leaveType,
                start_date: startDate,
                end_date: endDate,
                reason
            };
            const response = await fetch(`${API_BASE}/leaves`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                setMessage('Leave request filed successfully.');
                setStartDate(''); setEndDate(''); setReason('');
                fetchData();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to file leave');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const reviewLeave = async (id, status) => {
        setError(''); setMessage('');
        try {
            const response = await fetch(`${API_BASE}/leaves/${id}/approve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, reviewed_by: currentUser.id })
            });
            if (response.ok) {
                setMessage(`Leave ${status} successfully.`);
                fetchData();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to review leave');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="loading">Syncing HR Database...</div>;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>Human Resources & leaves</h2>
                <p>Manage employee presence, vacation allocations, and sick leave approvals.</p>
            </div>

            {error && <div className="error">{error}</div>}
            {message && <div className="message">{message}</div>}

            <div className="grid">
                {/* File a Leave Form */}
                <div className="panel" style={{ alignSelf: 'start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--text-heading)' }}>
                        <Calendar size={24} />
                        <h3 style={{ margin: 0 }}>File a Leave Request</h3>
                    </div>
                    {currentUser?.role === 'agent' ? (
                        <div className="message" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                            <div style={{ fontWeight: '800', marginBottom: '0.5rem', fontSize: '1.1rem' }}>AI Entity Core Overridden</div>
                            <p style={{ margin: 0, fontWeight: '500', opacity: 0.9 }}>Algorithmic deployment vehicles operate continuously without rest dependencies. Leave scheduling protocols are intentionally disabled for active agent identities.</p>
                        </div>
                    ) : (
                        <form onSubmit={submitLeave} className="ticket-form">
                            <div className="form-group">
                                <label>Requesting Agent</label>
                                <input type="text" value={currentUser?.id} disabled />
                            </div>
                            <div className="form-group">
                                <label>Leave Type</label>
                                <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                                    <option value="annual">Annual / Vacation</option>
                                    <option value="sick">Sick Leave</option>
                                    <option value="unpaid">Unpaid Personal</option>
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group half-width">
                                    <label>Start Date</label>
                                    <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                </div>
                                <div className="form-group half-width">
                                    <label>End Date</label>
                                    <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Reason / Notes</label>
                                <textarea required rows="3" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide reasoning..."></textarea>
                            </div>
                            <button type="submit" className="btn-submit">Submit Request</button>
                        </form>
                    )}
                </div>

                {/* Leaves Tracking */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-heading)' }}>
                        <Users size={24} />
                        <h3 style={{ margin: 0 }}>Recent Leave Applications</h3>
                    </div>
                    {leaves.length === 0 ? (
                        <div className="empty-state">
                            <Clock size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                            <p>No leaves filed across the directory.</p>
                        </div>
                    ) : (
                        <div className="ticket-list">
                            {leaves.map(leave => (
                                <div key={leave.id} className="ticket">
                                    <div className="ticket-header" style={{ paddingBottom: '1rem', marginBottom: '1rem' }}>
                                        <div className="ticket-id-wrapper">
                                            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-heading)' }}>{leave.requesting_agent}</div>
                                            <span className={`status status-${leave.status}`}>
                                                {leave.status === 'approved' && <CheckCircle size={16} />}
                                                {leave.status === 'rejected' && <XCircle size={16} />}
                                                {leave.status === 'pending' && <Clock size={16} />}
                                                {leave.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ticket-body" style={{ marginBottom: '1.5rem' }}>
                                        <p><strong>Type:</strong> <span className="badge sens-low">{leave.leave_type}</span></p>
                                        <p><strong>Duration:</strong> {leave.start_date} to {leave.end_date}</p>
                                        <p style={{ marginTop: '1rem', fontStyle: 'italic', opacity: 0.8 }}>"{leave.reason}"</p>
                                    </div>
                                    <div className="ticket-footer" style={{ flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Filed: {new Date(leave.created_at).toLocaleString()}</div>

                                        {/* Action buttons if Pending */}
                                        {leave.status === 'pending' && canReview && (
                                            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
                                                <button onClick={() => reviewLeave(leave.id, 'approved')} className="btn-action btn-success">✅ Approve Leave</button>
                                                <button onClick={() => reviewLeave(leave.id, 'rejected')} className="btn-action btn-danger" style={{ background: 'var(--danger)' }}>❌ Reject</button>
                                            </div>
                                        )}

                                        {leave.status !== 'pending' && (
                                            <div style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                                                Reviewed by <strong>{leave.reviewed_by}</strong> on {new Date(leave.updated_at).toLocaleDateString()}
                                            </div>
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
