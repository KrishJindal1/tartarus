"""
Router for managing endpoint agents.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()


# Temporary in-memory storage.
# We will replace this with the database later.
agents = []


class AgentRegistration(BaseModel):
    agent_id: str
    hostname: str
    os: str
    architecture: str


@router.get("/")
def list_agents():
    """List all registered agents."""
    return agents


@router.post("/register")
def register_agent(agent: AgentRegistration):
    """Register a new endpoint agent."""

    # Prevent duplicate registration
    for existing in agents:
        if existing["agent_id"] == agent.agent_id:
            return {
                "message": "Agent already registered",
                "agent": existing
            }

    agent_data = {
        "agent_id": agent.agent_id,
        "hostname": agent.hostname,
        "os": agent.os,
        "architecture": agent.architecture,
        "status": "online",
    }

    agents.append(agent_data)

    return {
        "message": "Agent registered successfully",
        "agent": agent_data
    }


@router.patch("/{agent_id}/status")
def update_agent_status(agent_id: str, status: str):
    """Update status of a specific agent."""

    for agent in agents:
        if agent["agent_id"] == agent_id:
            agent["status"] = status
            return {
                "message": "Status updated",
                "agent": agent
            }

    return {"error": "Agent not found"}


@router.patch("/{agent_id}/heartbeat")
def agent_heartbeat(agent_id: str):
    """Handle periodic heartbeat ping from agent."""

    for agent in agents:
        if agent["agent_id"] == agent_id:
            agent["status"] = "online"

            return {
                "message": "Heartbeat received",
                "agent_id": agent_id,
                "status": "online"
            }

    return {"error": "Agent not found"}