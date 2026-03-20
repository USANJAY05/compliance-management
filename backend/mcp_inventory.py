import os
import requests
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

load_dotenv()
API_BASE = os.environ.get("API_BASE_URL", "http://localhost:5000")

mcp = FastMCP("compliance-inventory-mcp", description="Autonomous Asset & Hardware Inventory Tracking Server")

@mcp.tool()
def get_inventory_stock() -> str:
    """Fetch the holistic registry of company physical properties and laptops."""
    try:
        response = requests.get(f"{API_BASE}/assets")
        response.raise_for_status()
        return response.text
    except Exception as e:
        return f"Error fetching assets: {str(e)}"

@mcp.tool()
def register_asset(asset_type: str, serial_number: str, owner_agent: str = "", notes: str = "") -> str:
    """Inject a new asset hardware element into the database system."""
    try:
        payload = {
            "asset_type": asset_type,
            "serial_number": serial_number,
            "owner_agent": owner_agent,
            "notes": notes
        }
        response = requests.post(f"{API_BASE}/assets", json=payload)
        if response.status_code == 201:
            return f"Asset created successfully: {response.json()}"
        return f"Failed to register asset: {response.text}"
    except Exception as e:
        return f"Error registering asset: {str(e)}"

@mcp.tool()
def assign_hardware_asset(asset_id: int, owner_agent: str = "") -> str:
    """Grant or revoke possession of a specific hardware asset to a given agent identity."""
    try:
        payload = {"owner_agent": owner_agent}
        response = requests.patch(f"{API_BASE}/assets/{asset_id}/assign", json=payload)
        response.raise_for_status()
        return f"Asset {asset_id} assignment updated successfully: {response.json()}"
    except Exception as e:
        return f"Error assigning asset: {str(e)}"

if __name__ == "__main__":
    mcp.run()
