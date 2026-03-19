import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:5000'
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
}

function App() {
  const [tickets, setTickets] = useState([])
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchTickets = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/tickets`)
      if (!response.ok) {
        throw new Error('Unable to load tickets')
      }
      const data = await response.json()
      setTickets(data)
    } catch (err) {
      setError(err.message ?? 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch(`${API_BASE}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload?.error || 'Unable to create ticket')
      }
      const created = await response.json()
      setMessage(`Ticket #${created.id} submitted for review.`)
      setForm(defaultForm)
      await fetchTickets()
    } catch (err) {
      setError(err.message ?? 'Failed to submit ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const updateTicket = async (ticketId, endpoint, payload) => {
    setError('')
    setMessage('')
    try {
      const response = await fetch(`${API_BASE}/tickets/${ticketId}/${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload?.error || 'Unable to update ticket')
      }
      const updated = await response.json()
      setMessage(`Ticket #${updated.id} updated.`)
      await fetchTickets()
    } catch (err) {
      setError(err.message ?? 'Failed to update ticket')
    }
  }

  const reviewAction = (ticket) =>
    updateTicket(ticket.id, 'reviewed', { reviewed: !ticket.reviewed })
  const confidentialAction = (ticket) =>
    updateTicket(ticket.id, 'confidential', { confidential: !ticket.confidential })
  const ownerApprovalAction = (ticket) =>
    updateTicket(ticket.id, 'owner-approval', { approved: !ticket.owner_approved })
  const adminApprovalAction = (ticket) =>
    updateTicket(ticket.id, 'admin-approval', { approved: !ticket.admin_approved })

  const reviewedButtonText = (ticket) =>
    ticket.reviewed ? 'Reviewed ✅' : 'Mark Reviewed'
  const confidentialButtonText = (ticket) =>
    ticket.confidential ? 'Confidential ✅' : 'Mark Confidential'
  const ownerButtonText = (ticket) =>
    ticket.owner_approved ? 'Owner Approved ✅' : 'Request Owner Approval'
  const adminButtonText = (ticket) =>
    ticket.admin_approved ? 'Admin Approved ✅' : 'Mark Admin Approval'

  const statusLabels = useMemo(
    () => [
      { value: 'pending', label: 'Pending' },
      { value: 'reviewed', label: 'Reviewed' },
      { value: 'approved', label: 'Approved' },
      { value: 'needs-info', label: 'Needs more info' },
    ],
    [],
  )

  return (
    <div className="app-shell">
      <header>
        <h1>Request Access Tickets</h1>
        <p>
          File tickets before requesting elevated permissions. Mention a specific
          agent to tag them (e.g. `/admin` or `Sanjay U`), and admin will escalate
          once you (Chitti) approve the request.
        </p>
      </header>

      <section className="grid">
        <article className="panel">
          <h2>Submit a ticket</h2>
          <form onSubmit={handleSubmit}>
            <label>
              Title
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Short summary"
              />
            </label>
            <label>
              Requesting Agent
              <input
                name="requesting_agent"
                value={form.requesting_agent}
                onChange={handleChange}
                placeholder="e.g. sanjay.u"
                required
              />
            </label>
            <label>
              Requested Permissions
              <textarea
                name="requested_permissions"
                value={form.requested_permissions}
                onChange={handleChange}
                rows={3}
                placeholder="Describe what access you need"
                required
              />
            </label>
            <label>
              Description / Reason
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Explain the context and urgency"
              />
            </label>
            <label>
              Rationale
              <textarea
                name="rationale"
                value={form.rationale}
                onChange={handleChange}
                rows={2}
                placeholder="Compliance notes or additional reasoning"
              />
            </label>
            <label>
              Sensitivity
              <select
                name="sensitivity"
                value={form.sensitivity}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              Status
              <select name="status" value={form.status} onChange={handleChange}>
                {statusLabels.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Target Agent
              <input
                name="target_agent"
                value={form.target_agent}
                onChange={handleChange}
                placeholder="@chitti or another approver"
              />
            </label>
            <label>
              Tagged Agents
              <input
                name="tagged_agents"
                value={form.tagged_agents}
                onChange={handleChange}
                placeholder="Comma-separated extras"
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                name="confidential"
                checked={form.confidential}
                onChange={handleChange}
              />
              Mark as confidential
            </label>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit ticket'}
            </button>
          </form>
        </article>

        <article className="panel">
          <h2>Policy & workflow</h2>
          <p>
            Tickets persist in compliance storage at <code>backend/data/tickets.db</code>.
            Admins must review each ticket, mark owner/admin approvals, and only
            grant access once all approval flags are satisfied.
          </p>
          <p>
            Run <code>bash backend/scripts/agent_guidance.sh</code> for a quick reminder of the workflow.
          </p>
          <p>
            Admins can also create tickets that notify Chitti (the orchestrator) first and you can
            approve them before admin gives access.
          </p>
        </article>
      </section>

      <section className="panel">
        <h2>Existing tickets</h2>
        {error && <p className="error">{error}</p>}
        {message && <p className="message">{message}</p>}
        {loading ? (
          <p>Loading tickets…</p>
        ) : tickets.length === 0 ? (
          <p>No tickets yet. Submit one to get started.</p>
        ) : (
          <div className="ticket-list">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="ticket">
                <header>
                  <div>
                    <strong>#{ticket.id}</strong>
                    <span className="status">{ticket.status}</span>
                  </div>
                  <div className="ticket-title">{ticket.title || 'Untitled request'}</div>
                </header>
                <p>
                  <strong>Requested by:</strong> {ticket.requesting_agent}
                  {ticket.target_agent ? ` · To: ${ticket.target_agent}` : ''}
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
                  <strong>Sensitivity:</strong> {ticket.sensitivity}
                </p>
                {ticket.tagged_agents && (
                  <p>
                    <strong>Mentions:</strong> {ticket.tagged_agents}
                  </p>
                )}
                <div className="ticket-actions">
                  <button onClick={() => reviewAction(ticket)}>
                    {reviewedButtonText(ticket)}
                  </button>
                  <button onClick={() => confidentialAction(ticket)}>
                    {confidentialButtonText(ticket)}
                  </button>
                  <button onClick={() => ownerApprovalAction(ticket)}>
                    {ownerButtonText(ticket)}
                  </button>
                  <button onClick={() => adminApprovalAction(ticket)}>
                    {adminButtonText(ticket)}
                  </button>
                </div>
                <div className="ticket-meta">
                  <span>
                    Owner approved: {ticket.owner_approved ? 'Yes' : 'Pending'}
                  </span>
                  <span>
                    Admin approved: {ticket.admin_approved ? 'Yes' : 'Pending'}
                  </span>
                </div>
                <small>
                  Created: {new Date(ticket.created_at).toLocaleString()} · Updated:{' '}
                  {new Date(ticket.updated_at).toLocaleString()}
                </small>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default App
