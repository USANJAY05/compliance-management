# Ticketing System

This workspace contains the Sanjay-approved ticketing application: a React frontend (Vite) coupled with a Flask backend backed by SQLite.

## Structure

```
ticketing-system/
├── backend/                Flask API, SQLite schema, policy script, and documentation
├── frontend/               Vite + React experience for submitting and reviewing tickets
```

## Backend Highlights

- Flask service exposes endpoints to create tickets, list them, and toggle reviewed/confidential flags.
- Ticket records now include title, description, rationale, target/mentioned agents, and owner/admin approval flags so you can capture why the access is needed, who requested it, and who should be notified.
- Existing tickets still track requesting agent, requested permissions, sensitivity, status, reviewed/confidential booleans, and timestamps for compliance logging.
- Data persistently stored in `backend/data/tickets.db` (treat as compliance storage).
- Guidance script (`backend/scripts/agent_guidance.sh`) reminds agents to file tickets before needing access and outlines admin review responsibility.

## Approval workflow

- Agents create tickets describing the requested access, mention you (Chitti) using the targeted/tagged fields if you need to weigh in, and note the reason for the request.
- Once you (the orchestrator) approve, admins can mark owner approval through the new `/tickets/<id>/owner-approval` endpoint. After that, admin can use `/tickets/<id>/admin-approval` to finalize access or escalate back to you if more discretion is required.
- Admins can also raise tickets targeting you (e.g., for high-priority changes), and your approval opens the door for them to grant permissions.

## Frontend Highlights

- React components for listing tickets, submitting new requests, and marking records reviewed/confidential through the API.
- Built with Vite to keep iteration fast.

## Running the Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python3 app.py
```

## Running the Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

The frontend expects the backend at `http://localhost:5000`. Adjust the `package.json` proxy or fetch targets if you run the backend on a different host/port.

## Agent & Admin Guidance

- **Agents** must file a ticket before requesting elevated access. Include the requesting agent, requested permissions, sensitivity, and any necessary context.
- **Admins** are responsible for reviewing each ticket (mark via the `/reviewed` endpoint) and only granting privileges once reviews are complete.
- Run the policy reminder script whenever needed:

```bash
cd backend
bash scripts/agent_guidance.sh
```

## Compliance Storage

Tickets persist in the SQLite database at `backend/data/tickets.db`. Treat this as compliance storage: encrypt or back it up per policy, and limit access to authorized personnel only.
