"""
Script models for forensic tasks.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class ScriptCreateRequest(BaseModel):
    name: str
    category: str
    jocky_source: str
    risk_level: Optional[str] = "medium"
    os_target: Optional[str] = "both"


class ScriptResponse(BaseModel):
    id: str
    name: str
    category: str
    jocky_source: str
    risk_level: str
    os_target: str
    is_predefined: bool = False
    created_at: Optional[datetime] = None
