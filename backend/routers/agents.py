"""
Router for managing endpoint agents: registration, listing, heartbeat, and status updates.
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_agents():
    """List all registered agents."""
    raise NotImplementedError("Endpoint not implemented yet")


@router.post("/register")
def register_agent():
    """Register a new endpoint agent."""
    raise NotImplementedError("Endpoint not implemented yet")


@router.patch("/{agent_id}/status")
def update_agent_status(agent_id: str):
    """Update status of a specific agent."""
    raise NotImplementedError("Endpoint not implemented yet")


@router.patch("/{agent_id}/heartbeat")
def agent_heartbeat(agent_id: str):
    """Handle periodic heartbeat ping from agent."""
    raise NotImplementedError("Endpoint not implemented yet")
