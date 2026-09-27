"""
Jobs router: full job lifecycle (create -> dispatch -> claim -> complete).
"""

from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel

from core import db, r2_client
from core.config import settings
from core.security import agent_matches, check_worker_secret, current_user, require_agent
from services import audit_logger, job_dispatcher
from services.job_dispatcher import _serialize

router = APIRouter()


class JobCreate(BaseModel):
    agent_id: str
    script_id: str
    exec_mode: str = "user_mode"


class JobStatusPatch(BaseModel):
    status: str
    findings_summary: Optional[str] = None


@router.post("/create")
def create_job(body: JobCreate, request: Request, user=Depends(current_user)):
    """
    Compile the JOCKY script through the polymorphic pipeline and queue the job.
    The IR delivered to the agent is unique per deployment (fresh SHA-256).
    """
    job = job_dispatcher.dispatch_job(
        agent_id=body.agent_id,
        script_id=body.script_id,
        exec_mode=body.exec_mode,
        created_by=user.get("sub"),
        ip_address=request.client.host if request.client else None,
    )
    return {"message": "Job created", "job": job}


@router.get("/pending/{agent_id}")
def get_pending_job(
    agent_id: str,
    claims=Depends(require_agent),
    x_worker_secret: Optional[str] = Header(None),
):
    """Agent poll: claim the oldest queued job for this agent."""
    if not agent_matches(claims, agent_id):
        raise HTTPException(status_code=403, detail="Token does not match agent")
    if x_worker_secret is not None:
        check_worker_secret(x_worker_secret)

    job = job_dispatcher.claim_pending_job(agent_id)
    if job is None:
        raise HTTPException(status_code=404, detail="No pending jobs")

    ir = job.get("ir")
    return {
        "job_id": job["id"],
        "payload_url": job.get("r2_payload_key") or "",
        "enc_aes_key": job.get("enc_aes_key") or "",
        "exec_mode": job.get("exec_mode", "user_mode"),
        "result_r2_key": job.get("r2_result_key") or "",
        "ir": list(ir) if isinstance(ir, (bytes, bytearray)) else (ir or []),
        "ir_sha256": job.get("ir_sha256"),
    }


@router.get("/")
def list_jobs(status: Optional[str] = None, agent_id: Optional[str] = None):
    """List jobs (optionally filtered by status/agent)."""
    sql = (
        "SELECT j.*, a.hostname, a.os_type, s.name AS script_name "
        "FROM jobs j LEFT JOIN agents a ON a.id=j.agent_id LEFT JOIN scripts s ON s.id=j.script_id"
    )
    clauses, params = [], []
    if status:
        clauses.append("j.status = ?")
        params.append(status)
    if agent_id:
        clauses.append("j.agent_id = ?")
        params.append(agent_id)
    if clauses:
        sql += " WHERE " + " AND ".join(clauses)
    sql += " ORDER BY j.created_at DESC LIMIT 200"

    rows = db.query(sql, tuple(params))
    out = []
    for r in rows:
        item = _serialize(r)
        item["hostname"] = r.get("hostname")
        item["os"] = r.get("os_type")
        item["script_name"] = r.get("script_name")
        out.append(item)
    return out


@router.get("/{job_id}")
def get_job(job_id: str):
    """Single job with status + summary."""
    return job_dispatcher.get_job(job_id)


@router.patch("/{job_id}/status")
def update_job_status(
    job_id: str,
    body: JobStatusPatch,
    x_worker_secret: Optional[str] = Header(None),
):
    """Status transition used by agent callback / worker proxy."""
    if settings.WORKER_SECRET:
        check_worker_secret(x_worker_secret)
    job = db.query_one("SELECT * FROM jobs WHERE id = ?", (job_id,))
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    allowed = {"queued", "dispatched", "executing", "completed", "failed"}
    if body.status not in allowed:
        raise HTTPException(status_code=400, detail=f"status must be one of {sorted(allowed)}")
    db.execute(
        "UPDATE jobs SET status=?, findings_summary=COALESCE(?, findings_summary) WHERE id=?",
        (body.status, body.findings_summary, job_id),
    )
    audit_logger.log_action(None, "job.status", "job", job_id, metadata={"status": body.status})
    return job_dispatcher.get_job(job_id)


@router.get("/{job_id}/payload-url")
def get_payload_url(job_id: str, expires_in: int = 60):
    """Presigned R2 GET URL for the encrypted payload (agent fetch path)."""
    job = db.query_one("SELECT * FROM jobs WHERE id = ?", (job_id,))
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if not job.get("r2_payload_key") or not r2_client.is_configured():
        raise HTTPException(status_code=400, detail="Job payload is delivered inline (R2 not configured)")
    return {"payload_url": r2_client.generate_presigned_get(job["r2_payload_key"], expires_in),
            "enc_aes_key": job.get("enc_aes_key")}
