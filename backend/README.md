# Ticketing Backend (Flask + SQLite)

This Flask service powers the ticketing workflow and stores requests in a compliance-grade SQLite database.

## Key Features

- Stores tickets with fields for requesting agent, requested permissions, sensitivity, status, review state, confidentiality, and timestamps.
- Captures additional metadata such as title, description, rationale, tagged/targeted agents, and owner/admin approval flags so each request can mention the right people and track who verified it.
- Supports creating tickets, listing them, and marking them as reviewed/confidential, plus owner/admin approval toggles via dedicated endpoints.
- Loads configuration from `.env` (copy `.env.example`).
- CORS-enabled for the React frontend.

## Environment

1. Copy `.env.example` to `.env` and customize if needed.
2. Key variables:
   - `FLASK_ENV` – typically `development` or `production`.
   - `BACKEND_PORT` – port to bind the Flask service (default `5000`).
   - `DATABASE_PATH` – path to the compliance storage SQLite file (defaults to `data/tickets.db`).
   - `DEFAULT_STATUS` – default ticket status for new submissions.

## Local virtual environment

1. Create a virtual environment so dependencies stay isolated:
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Use the activated environment to run the server (`python3 app.py`).

## Database Schema

The `tickets` table lives in the SQLite file defined by `DATABASE_PATH`. The schema:

| Column               | Type    | Description |
|----------------------|---------|-------------|
| `id`                 | INTEGER | Auto-incremented primary key |
| `requesting_agent`   | TEXT    | Who is requesting the permissions |
| `requested_permissions` | TEXT | Permissions the agent needs |
| `sensitivity`        | TEXT    | Sensitivity level (low/medium/high or custom) |
| `status`             | TEXT    | Ticket lifecycle state (pending/reviewed/etc.) |
| `reviewed`           | INTEGER | 0/1 flag indicating if admin reviewed the request |
| `confidential`       | INTEGER | 0/1 flag indicating confidentiality |
| `title`              | TEXT    | Brief summary/title of the request |
| `description`        | TEXT    | Narrative detailing why the access is required |
| `rationale`          | TEXT    | Additional reasoning or compliance notes |
| `target_agent`       | TEXT    | Primary agent the ticket should notify/tag |
| `tagged_agents`      | TEXT    | Comma-separated additional agents to mention |
| `owner_approved`     | INTEGER | 0/1 flag for orchestrator (owner) approval |
| `admin_approved`     | INTEGER | 0/1 flag for admin completion |
| `created_at`         | TEXT    | UTC timestamp for creation |
| `updated_at`         | TEXT    | UTC timestamp for last update |

## API Endpoints

| Method | Path                             | Description |
|--------|----------------------------------|-------------|
| `GET`  | `/tickets`                        | List all tickets (descending by creation time) |
| `POST` | `/tickets`                        | Create a new ticket (requires `requesting_agent`, `requested_permissions`, `sensitivity`; accepts `title`, `description`, `tagged_agents`, `target_agent`, `rationale`, `owner_approved`, and `admin_approved`) |
| `PATCH`| `/tickets/<id>/reviewed`          | Mark a ticket as reviewed (optional payload to toggle) |
| `PATCH`| `/tickets/<id>/confidential`      | Update the confidential flag |
| `PATCH`| `/tickets/<id>/owner-approval`    | Toggle owner (orchestrator) approval status |
| `PATCH`| `/tickets/<id>/admin-approval`    | Toggle admin approval once owner approves |
| `GET`  | `/health`                         | Basic uptime/database check |

## Running the Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # or edit to customize first
python3 app.py
```

The service listens on `0.0.0.0:<BACKEND_PORT>` by default.

## Admin & Agent Responsibilities

- **Agents** must file a ticket before requesting access. Include the requesting agent, requested permissions, and sensitivity level.
- **Admins** must review each ticket, flip the reviewed flag via the `/reviewed` endpoint, and close the loop before granting permissions.
- Use the guidance script (`scripts/agent_guidance.sh`) to refresh policy reminders:

```bash
cd backend
bash scripts/agent_guidance.sh
```

## Compliance Storage

Ticket data is stored in the SQLite file indicated by `DATABASE_PATH`, for example `backend/data/tickets.db`. Treat this file as compliance storage, back it up per policy, and grant read-only access only to authorized audit personnel.
