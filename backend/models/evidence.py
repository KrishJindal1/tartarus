"""
Forensic evidence and findings models.
"""
from typing import Any, Dict, Optional
from datetime import datetime
from pydantic import BaseModel


class EvidenceItem(BaseModel):
    id: str
    job_id: str
    type: str
    data: Dict[str, Any]
    sha256_hash: str
    risk_score: Optional[float] = 0.0
    r2_result_key: Optional[str] = None
    collected_at: Optional[datetime] = None


class EvidenceSummary(BaseModel):
    job_id: str
    total_findings: int
    max_risk_score: float
    evidence_types: list[str]
