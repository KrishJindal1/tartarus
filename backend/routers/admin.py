"""
Admin router: destructive maintenance operations (clear generated data).
"""

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from core import db
from core.security import require_role
from services import audit_logger

router = APIRouter()


class ClearDataBody(BaseModel):
    jobs: bool = True
    evidence: bool = True
    reports: bool = True
    results: bool = True
    audit: bool = False


def _count(sql: str, params=()) -> int:
    row = db.query_one(f"SELECT COUNT(*) AS n FROM ({sql}) AS scoped", params)
    return int(row["n"]) if row else 0


def _drain(deleted: dict, key: str, select_sql: str, params=()) -> None:
    n = _count(select_sql, params)
    if n:
        db.execute(select_sql.replace("SELECT *", "DELETE", 1), params)
    deleted[key] = n

@router.post("/clear-data")
def clear_data(body: ClearDataBody, request: Request, user=Depends(require_role("admin"))):
    """Delete generated records (jobs, evidence, results, reports, audit trail).

    Reports are derived from completed/failed jobs, so the reports scope
    removes those job rows together with their evidence and results.
    Agents, scripts, users and the schema are never touched.
    """
    deleted: dict = {}

    if body.evidence:
        _drain(deleted, "evidence", "SELECT * FROM evidence")
    if body.results:
        _drain(deleted, "results", "SELECT * FROM results")

    if body.reports and not body.jobs:
        scope = "id IN (SELECT id FROM jobs WHERE status IN ('completed','failed'))"
        _drain(deleted, "report_evidence", f"SELECT * FROM evidence WHERE {scope}")
        _drain(deleted, "report_results", f"SELECT * FROM results WHERE {scope}")
        _drain(deleted, "reports", f"SELECT * FROM jobs WHERE {scope}")

    if body.jobs:
        _drain(deleted, "jobs", "SELECT * FROM jobs")

    if body.audit:
        row = db.query_one("SELECT COUNT(*) AS n FROM audit_logs")
        deleted["audit"] = int(row["n"]) if row else 0
        db.execute("DELETE FROM audit_logs")

    audit_logger.log_action(
        user_id=user.get("sub"),
        action="admin.clear_data",
        resource_type="admin",
        resource_id="clear-data",
        ip_address=request.client.host if request.client else None,
        metadata=deleted,
    )
    return {"message": "Data cleared", "deleted": deleted}
