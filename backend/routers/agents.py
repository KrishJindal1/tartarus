"""
Router for managing endpoint agents (registration, status, heartbeat).
"""

from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel

from core import db
from core.config import settings
from core.security import create_agent_token, decode_token, require_role
from services import audit_logger

router = APIRouter()


class AgentRegistration(BaseModel):
    agent_id: Optional[str] = None
    hostname: str
    os: str
    architecture: str = ""
    public_key: Optional[str] = None
    agent_version: str = "1.0.0"
    av_present: Optional[str] = None


class VerifyTokenRequest(BaseModel):
    token: str


def _serialize(row: dict) -> dict:
    return {
        "agent_id": row["id"],
        "hostname": row["hostname"],
        "os": row["os_type"],
        "architecture": row.get("architecture", ""),
        "status": row["status"],
        "public_key": bool(row.get("public_key")),
        "av_present": row.get("av_present"),
        "agent_version": row.get("agent_version"),
        "last_seen_at": row.get("last_seen_at"),
        "registered_at": row.get("registered_at"),
    }


@router.get("/")
def list_agents():
    """List all registered agents."""
    rows = db.query("SELECT * FROM agents ORDER BY registered_at DESC")
    return [_serialize(r) for r in rows]


@router.post("/register")
def register_agent(body: AgentRegistration, request: Request):
    """Register a new endpoint agent (server issues the agent_id + token)."""
    agent_id = body.agent_id or str(uuid4())

    existing = db.query_one("SELECT * FROM agents WHERE id = ?", (agent_id,))
    if existing:
        db.execute(
            "UPDATE agents SET status='online', last_seen_at=?, hostname=?, os_type=?, architecture=?, public_key=COALESCE(?, public_key) WHERE id=?",
            (db.now_iso(), body.hostname, body.os, body.architecture, body.public_key, agent_id),
        )
        return {
            "message": "Agent already registered",
            "agent": _serialize(db.query_one("SELECT * FROM agents WHERE id = ?", (agent_id,))),
            "agent_token": create_agent_token(agent_id),
        }

    db.execute(
        """INSERT INTO agents (id, hostname, os_type, architecture, public_key, status,
             av_present, agent_version, last_seen_at, registered_at)
           VALUES (?,?,?,?,?,'online',?,?,?,?)""",
        (
            agent_id, body.hostname, body.os, body.architecture, body.public_key,
            body.av_present, body.agent_version, db.now_iso(), db.now_iso(),
        ),
    )
    audit_logger.log_action(
        user_id=None,
        action="agent.register",
        resource_type="agent",
        resource_id=agent_id,
        ip_address=request.client.host if request.client else None,
        metadata={"hostname": body.hostname, "os": body.os},
    )
    return {
        "message": "Agent registered successfully",
        "agent": _serialize(db.query_one("SELECT * FROM agents WHERE id = ?", (agent_id,))),
        "agent_token": create_agent_token(agent_id),
    }


@router.patch("/{agent_id}/status")
def update_agent_status(agent_id: str, status: str, user=Depends(require_role("admin", "analyst"))):
    """Update status of a specific agent."""
    if status not in ("online", "offline", "busy", "idle"):
        raise HTTPException(status_code=400, detail="Invalid status")
    agent = db.query_one("SELECT * FROM agents WHERE id = ?", (agent_id,))
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    db.execute("UPDATE agents SET status=?, last_seen_at=? WHERE id=?", (status, db.now_iso(), agent_id))
    return {"message": "Status updated", "agent": _serialize(db.query_one("SELECT * FROM agents WHERE id = ?", (agent_id,)))}


@router.patch("/{agent_id}/heartbeat")
def agent_heartbeat(agent_id: str):
    """Handle periodic heartbeat ping from agent."""
    agent = db.query_one("SELECT * FROM agents WHERE id = ?", (agent_id,))
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    db.execute("UPDATE agents SET status='online', last_seen_at=? WHERE id=?", (db.now_iso(), agent_id))
    return {"message": "Heartbeat received", "agent_id": agent_id, "status": "online"}


@router.delete("/{agent_id}")
def delete_agent(agent_id: str, request: Request, user=Depends(require_role("admin"))):
    """Admin only: remove an agent from the registry."""
    agent = db.query_one("SELECT * FROM agents WHERE id = ?", (agent_id,))
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    db.execute("DELETE FROM agents WHERE id = ?", (agent_id,))
    audit_logger.log_action(
        user_id=user.get("sub"),
        action="agent.delete",
        resource_type="agent",
        resource_id=agent_id,
        ip_address=request.client.host if request.client else None,
    )
    return {"message": "Agent deleted", "agent_id": agent_id}


@router.post("/verify-token")
def verify_agent_token(body: VerifyTokenRequest, x_worker_secret: Optional[str] = Header(None)):
    """Worker/edge gateway helper: validate an agent bearer token."""
    from core.security import check_worker_secret
    check_worker_secret(x_worker_secret)
    try:
        claims = decode_token(body.token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    if claims.get("typ") != "agent":
        raise HTTPException(status_code=401, detail="Not an agent token")
    agent = db.query_one("SELECT * FROM agents WHERE id = ?", (claims.get("agent_id"),))
    if agent is None:
        raise HTTPException(status_code=401, detail="Unknown agent")
    return {"valid": True, "agent_id": claims.get("agent_id")}
