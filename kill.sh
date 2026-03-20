#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

kill_process() {
  local service_name=$1
  local pid_file=$2

  if [ -f "$pid_file" ]; then
    local pid=$(cat "$pid_file" 2>/dev/null || true)
    if [ -n "$pid" ]; then
      if kill -0 "$pid" 2>/dev/null; then
        echo "Killing $service_name process (PID: $pid)..."
        kill "$pid" 2>/dev/null || true
        # Wait a moment
        sleep 1
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
          echo "Force killing $service_name process (PID: $pid)..."
          kill -9 "$pid" 2>/dev/null || true
        fi
      else
        echo "$service_name process (PID: $pid) is not running."
      fi
    fi
    echo "Removing $pid_file..."
    rm -f "$pid_file"
  else
    echo "No $pid_file found for $service_name."
  fi
}

echo "Stopping all services for compliance-management..."

kill_process "Backend" "$ROOT/backend.pid"
kill_process "Frontend" "$ROOT/frontend.pid"
kill_process "MCP Ticketing Server" "$ROOT/mcp_ticketing.pid"
kill_process "MCP HR Server" "$ROOT/mcp_hr.pid"
kill_process "MCP Inventory Server" "$ROOT/mcp_inventory.pid"

echo "All services have been stopped successfully."
