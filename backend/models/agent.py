"""
Agent Pydantic models.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class AgentRegisterRequest(BaseModel):
    hostname: str
    os_type: str
    public_key: str
    av_present: Optional[str] = None
    agent_version: Optional[str] = "1.0.0"


class AgentResponse(BaseModel):
    id: str
    hostname: str
    os_type: str
    status: str
    av_present: Optional[str] = None
    agent_version: Optional[str] = "1.0.0"
    last_seen_at: Optional[datetime] = None
    registered_at: Optional[datetime] = None
