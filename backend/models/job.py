"""
Job request and response models.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class JobCreateRequest(BaseModel):
    agent_id: str
    script_id: str
    exec_mode: Optional[str] = "user_mode"


class JobResponse(BaseModel):
    id: str
    agent_id: str
    script_id: Optional[str] = None
    r2_payload_key: Optional[str] = None
    r2_result_key: Optional[str] = None
    status: str
    exec_mode: str
    findings_summary: Optional[str] = None
    risk_score: Optional[float] = 0.0
    created_at: Optional[datetime] = None
    dispatched_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
