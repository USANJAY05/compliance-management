# Ticketing Frontend (Vite + React)

Simple React interface for submitting and reviewing ticketing requests.

## Features

- Submit tickets with title, requesting agent, permissions, sensitivity, status, description/rationale, and mention/tag other agents or admins.
- Display existing tickets along with owner/admin approval toggles plus the reviewed/confidential flags.
- Policy reminders built into the UI and references the backend compliance storage path.

## Setup

```bash
cd frontend
npm install
cp .env.example .env # update VITE_API_BASE if your backend is remote
```

## Development

Start the dev server with hot reload:

```bash
npm run dev -- --host 0.0.0.0
```

The frontend expects the backend at the URL defined in `VITE_API_BASE` (default `http://localhost:5000`).

## Build

```bash
npm run build
npm run preview
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server (auto reload) |
| `npm run build` | Build a production bundle |
| `npm run preview` | Serve the production bundle locally |

## Environment

- `VITE_API_BASE`: Base URL for the backend API (default `http://localhost:5000`).
