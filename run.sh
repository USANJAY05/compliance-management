#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE_BACKEND="$ROOT/backend.pid"
PID_FILE_FRONTEND="$ROOT/frontend.pid"

cleanup() {
  if [ -f "$PID_FILE_BACKEND" ]; then
    backend_pid=$(cat "$PID_FILE_BACKEND" 2>/dev/null || true)
    if [ -n "$backend_pid" ] && kill -0 "$backend_pid" 2>/dev/null; then
      kill "$backend_pid" 2>/dev/null || true
    fi
    rm -f "$PID_FILE_BACKEND"
  fi
  if [ -f "$PID_FILE_FRONTEND" ]; then
    frontend_pid=$(cat "$PID_FILE_FRONTEND" 2>/dev/null || true)
    if [ -n "$frontend_pid" ] && kill -0 "$frontend_pid" 2>/dev/null; then
      kill "$frontend_pid" 2>/dev/null || true
    fi
    rm -f "$PID_FILE_FRONTEND"
  fi
}
trap cleanup EXIT

start_backend() {
  echo "Preparing backend environment..."
  cd "$ROOT/backend"
  if [ ! -d ".venv" ]; then
    python3 -m venv .venv
  fi
  # shellcheck source=/dev/null
  source .venv/bin/activate
  pip install --upgrade pip
  pip install -r requirements.txt
  cp .env.example .env 2>/dev/null || true
  echo "Starting Flask API (port 5000)..."
  python3 app.py &
  echo $! > "$PID_FILE_BACKEND"
}

start_frontend() {
  echo "Preparing frontend environment..."
  cd "$ROOT/frontend"
  npm install
  echo "Starting Vite dev server (port 3000)..."
  npm run dev -- --host 0.0.0.0 --port 3000 &
  echo $! > "$PID_FILE_FRONTEND"
}

start_backend
backend_pid=$(cat "$PID_FILE_BACKEND")
start_frontend
frontend_pid=$(cat "$PID_FILE_FRONTEND")

# Wait for both background services
wait "$backend_pid" "$frontend_pid"
