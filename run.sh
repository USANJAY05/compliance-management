#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE_BACKEND="$ROOT/backend.pid"
PID_FILE_FRONTEND="$ROOT/frontend.pid"

FRONTEND_PORT=3000
BACKEND_PORT=""

while getopts p:b: flag
do
    case "${flag}" in
        p) FRONTEND_PORT=${OPTARG};;
        b) BACKEND_PORT=${OPTARG};;
    esac
done

if [ -z "$BACKEND_PORT" ]; then
    if [ "$FRONTEND_PORT" != "3000" ]; then
        BACKEND_PORT=$((FRONTEND_PORT + 1))
    else
        BACKEND_PORT=5000
    fi
fi

# PID files will trace background processes
start_backend() {
  echo "Preparing backend environment..."
  cd "$ROOT/backend"
  if [ ! -d ".venv" ]; then
    python3 -m venv .venv
  fi
  source .venv/bin/activate
  pip install --upgrade pip
  pip install -r requirements.txt
  # Install mcp requirements if needed
  pip install mcp requests
  cp .env.example .env 2>/dev/null || true
  
  echo "Starting Flask API (port ${BACKEND_PORT})..."
  export BACKEND_PORT=${BACKEND_PORT}
  nohup python3 app.py > "$ROOT/backend.log" 2>&1 &
  echo $! > "$PID_FILE_BACKEND"
}

start_frontend() {
  echo "Preparing frontend environment..."
  cd "$ROOT/frontend"
  npm install
  echo "Starting Vite dev server (port ${FRONTEND_PORT})..."
  export VITE_API_BASE="http://localhost:${BACKEND_PORT}"
  nohup npm run dev -- --host 0.0.0.0 --port ${FRONTEND_PORT} > "$ROOT/frontend.log" 2>&1 &
  echo $! > "$PID_FILE_FRONTEND"
}

start_mcp() {
  echo "Preparing MCP server environment..."
  cd "$ROOT/backend"
  source .venv/bin/activate
  echo "Starting MCP server targeting backend on port ${BACKEND_PORT}..."
  export API_BASE_URL="http://localhost:${BACKEND_PORT}"
  
  nohup python3 mcp_ticketing.py > "$ROOT/mcp_ticketing.log" 2>&1 &
  echo $! > "$ROOT/mcp_ticketing.pid"
  
  nohup python3 mcp_hr.py > "$ROOT/mcp_hr.log" 2>&1 &
  echo $! > "$ROOT/mcp_hr.pid"
  
  nohup python3 mcp_inventory.py > "$ROOT/mcp_inventory.log" 2>&1 &
  echo $! > "$ROOT/mcp_inventory.pid"
}

start_backend
start_frontend
start_mcp

echo "All services started in the background using nohup!"
echo "Backend PID: $(cat "$PID_FILE_BACKEND")"
echo "Frontend PID: $(cat "$PID_FILE_FRONTEND")"
echo "MCP Ticketing PID: $(cat "$ROOT/mcp_ticketing.pid")"
echo "MCP HR PID: $(cat "$ROOT/mcp_hr.pid")"
echo "MCP Inventory PID: $(cat "$ROOT/mcp_inventory.pid")"

