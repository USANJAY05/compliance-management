import os
import requests
from mcp.server.fastmcp import FastMCP

# API endpoint configuration
API_BASE = os.environ.get("API_BASE_URL", "http://localhost:5000")

# Create the MCP server
mcp = FastMCP("compliance-ticketing-mcp", description="Autonomous Ticketing Integration Server")

@mcp.tool()
def get_tickets() -> str:
    """Fetch all tickets from the ticketing system."""
    try:
        response = requests.get(f"{API_BASE}/tickets")
        response.raise_for_status()
        return response.text
    except Exception as e:
        return f"Error fetching tickets: {str(e)}"

@mcp.tool()
def get_ticket_types() -> str:
    """Fetch the available ticket types from the ticketing system configuration."""
    try:
        response = requests.get(f"{API_BASE}/ticket-types")
        response.raise_for_status()
        return response.text
    except Exception as e:
        return f"Error fetching ticket types: {str(e)}"

@mcp.tool()
def get_users() -> str:
    """Fetch the list of available agents/users in the system that can be tagged or assigned."""
    try:
        response = requests.get(f"{API_BASE}/users")
        response.raise_for_status()
        return response.text
    except Exception as e:
        return f"Error fetching users: {str(e)}"

@mcp.tool()
def create_ticket(requesting_agent: str, requested_permissions: str, sensitivity: str, ticket_type: str = "Other", title: str = "", description: str = "", target_agent: str = "", tagged_agents: str = "", rationale: str = "") -> str:
    """Submit a new ticket into the ticketing system."""
    try:
        payload = {
            "requesting_agent": requesting_agent,
            "requested_permissions": requested_permissions,
            "sensitivity": sensitivity,
            "ticket_type": ticket_type,
            "title": title,
            "description": description,
            "target_agent": target_agent,
            "tagged_agents": tagged_agents,
            "rationale": rationale
        }
        response = requests.post(f"{API_BASE}/tickets", json=payload)
        response.raise_for_status()
        return response.text
    except Exception as e:
        return f"Error creating ticket: {str(e)}"

@mcp.tool()
def review_ticket(ticket_id: int, reviewed: bool) -> str:
    """Mark a ticket as reviewed or un-reviewed."""
    try:
        response = requests.patch(f"{API_BASE}/tickets/{ticket_id}/reviewed", json={"reviewed": reviewed})
        response.raise_for_status()
        return response.text
    except Exception as e:
        return f"Error updating ticket: {str(e)}"

@mcp.tool()
def mark_confidential(ticket_id: int, confidential: bool) -> str:
    """Mark a ticket as confidential."""
    try:
        response = requests.patch(f"{API_BASE}/tickets/{ticket_id}/confidential", json={"confidential": confidential})
        response.raise_for_status()
        return response.text
    except Exception as e:
        return f"Error updating ticket: {str(e)}"

@mcp.tool()
def owner_approval(ticket_id: int, approved: bool, current_user: str, next_agent: str = "") -> str:
    """Approve or reject a ticket as an owner. You can optionally CC a next_agent to forward the approval chain."""
    try:
        response = requests.patch(f"{API_BASE}/tickets/{ticket_id}/owner-approval", json={
            "approved": approved,
            "current_user": current_user,
            "next_agent": next_agent
        })
        response.raise_for_status()
        return response.text
    except Exception as e:
        return f"Error updating ticket: {str(e)}"

@mcp.tool()
def admin_approval(ticket_id: int, approved: bool) -> str:
    """Approve or reject a ticket as an admin."""
    try:
        response = requests.patch(f"{API_BASE}/tickets/{ticket_id}/admin-approval", json={"approved": approved})
        response.raise_for_status()
        return response.text
    except Exception as e:
        return f"Error updating ticket: {str(e)}"

if __name__ == "__main__":
    mcp.run()
