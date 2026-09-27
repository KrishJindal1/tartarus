"""
Router for querying stored forensic evidence and summary statistics.
"""

import json
from collections import Counter

from fastapi import APIRouter, HTTPException

from core import db

router = APIRouter()


def _parse_row(row: dict) -> dict:
    out = dict(row)
    if isinstance(out.get("data"), str):
        try:
            out["data"] = json.loads(out["data"])
        except (ValueError, TypeError):
            out["data"] = {"raw": out["data"]}
    return out


@router.get("/summary")
def get_evidence_summary():
    """Retrieve global evidence summary across all investigated jobs."""
    total = db.query_one("SELECT COUNT(*) AS n FROM evidence")
    by_type = db.query("SELECT type, COUNT(*) AS n, AVG(risk_score) AS avg_risk FROM evidence GROUP BY type")
    by_job = db.query("SELECT job_id, COUNT(*) AS n FROM evidence GROUP BY job_id")
    risk = db.query_one("SELECT MAX(risk_score) AS max_risk, AVG(risk_score) AS avg_risk FROM evidence")
    latest = db.query_one("SELECT * FROM evidence ORDER BY collected_at DESC LIMIT 1")
    return {
        "total_evidence": total["n"] if total else 0,
        "by_type": {r["type"]: {"count": r["n"], "avg_risk": round(r["avg_risk"] or 0, 2)} for r in by_type},
        "jobs_with_evidence": len(by_job),
        "max_risk": risk["max_risk"] if risk else 0,
        "avg_risk": round((risk["avg_risk"] or 0), 2) if risk else 0,
        "latest": _parse_row(latest) if latest else None,
    }


@router.get("/")
def list_evidence(limit: int = 200):
    """All evidence rows (newest first) for the Evidence view."""
    rows = db.query(
        """SELECT e.*, a.hostname FROM evidence e
           LEFT JOIN jobs j ON j.id = e.job_id
           LEFT JOIN agents a ON a.id = j.agent_id
           ORDER BY e.collected_at DESC LIMIT ?""",
        (limit,),
    )
    return [_parse_row(r) for r in rows]


@router.get("/{job_id}")
def get_evidence_by_job(job_id: str):
    """Retrieve all evidence items collected for a specific job."""
    job = db.query_one("SELECT id FROM jobs WHERE id = ?", (job_id,))
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    rows = db.query("SELECT * FROM evidence WHERE job_id = ? ORDER BY collected_at ASC", (job_id,))
    return [_parse_row(r) for r in rows]
