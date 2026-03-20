import os
import requests
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

load_dotenv()
API_BASE = os.environ.get("API_BASE_URL", "http://localhost:5000")

mcp = FastMCP("compliance-hr-mcp", description="Autonomous HR & Leave Management Integration Server")

@mcp.tool()
def get_leaves() -> str:
    """Fetch all submitted employee leave requests."""
    try:
        response = requests.get(f"{API_BASE}/leaves")
        response.raise_for_status()
        return response.text
    except Exception as e:
        return f"Error fetching leaves: {str(e)}"

@mcp.tool()
def submit_leave(requesting_agent: str, start_date: str, end_date: str, leave_type: str = "annual", reason: str = "") -> str:
    """Submit a new employee leave request."""
    try:
        payload = {
            "requesting_agent": requesting_agent,
            "start_date": start_date,
            "end_date": end_date,
            "leave_type": leave_type,
            "reason": reason
        }
        response = requests.post(f"{API_BASE}/leaves", json=payload)
        if response.status_code == 201:
            return f"Leave request created successfully: {response.json()}"
        return f"Failed to create leave: {response.text}"
    except Exception as e:
        return f"Error creating leave: {str(e)}"

@mcp.tool()
def approve_leave(leave_id: int, status: str = "approved", reviewed_by: str = "system") -> str:
    """Approve or reject a submitted leave request."""
    try:
        payload = {"status": status, "reviewed_by": reviewed_by}
        response = requests.patch(f"{API_BASE}/leaves/{leave_id}/approve", json=payload)
        response.raise_for_status()
        return f"Leave marked as {status} successfully: {response.json()}"
    except Exception as e:
        return f"Error updating leave: {str(e)}"

@mcp.tool()
def get_employees() -> str:
    """Fetch the corporate employee directory and roles mapping."""
    try:
        response = requests.get(f"{API_BASE}/users")
        response.raise_for_status()
        return response.text
    except Exception as e:
        return f"Error fetching employees: {str(e)}"

if __name__ == "__main__":
    mcp.run()
