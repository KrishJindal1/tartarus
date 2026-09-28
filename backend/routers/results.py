"""
Results router: agent result submission + worker ingestion into evidence.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel

from core import db, r2_client
from core.security import check_worker_secret, require_agent
from services import audit_logger, result_ingester

router = APIRouter()


class JobResult(BaseModel):
    job_id: str
    agent_id: str
    status: str = "success"
    message: str = ""
    hostname: str = ""
    os: str = ""
    timestamp: str = ""


class IngestBody(BaseModel):
    agent_id: Optional[str] = None
    status: str = "success"
    message: str = ""
    hostname: str = ""
    os: str = ""
    timestamp: str = ""
    result: Optional[dict] = None


@router.post("/ingest/{job_id}")
def ingest_result(
    job_id: str,
    body: IngestBody,
    request: Request,
    x_worker_secret: Optional[str] = Header(None),
    x_jocky_result: Optional[str] = Header(None),
):
    """
    Called by the Cloudflare Worker (with X-Worker-Secret) or directly by an
    agent. Parses the forensic result into evidence rows and completes the job.
    """
    if x_worker_secret is not None:
        check_worker_secret(x_worker_secret)

    payload = body.model_dump()
    raw_bytes = None

    # Encrypted result delivered via worker header (base64) or pulled from R2
    if x_jocky_result:
        import base64
        raw_bytes = base64.b64decode(x_jocky_result)
    elif not body.message and not body.result:
        job = db.query_one("SELECT r2_result_key FROM jobs WHERE id = ?", (job_id,))
        if job and job.get("r2_result_key") and r2_client.is_configured():
            try:
                raw_bytes = r2_client.download_from_r2(job["r2_result_key"])
            except Exception:
                raw_bytes = None

    outcome = result_ingester.ingest_result(
        job_id,
        payload=payload,
        raw_bytes=raw_bytes,
        worker_secret=x_worker_secret,
        ip_address=request.client.host if request.client else None,
    )
    return {"message": "Result ingested", **outcome}


@router.post("/submit")
def submit_result(
    body: JobResult,
    request: Request,
    claims=Depends(require_agent),
):
    """Direct agent submission (compatible path used by the Go agent)."""
    outcome = result_ingester.ingest_result(
        body.job_id,
        payload=body.model_dump(),
        ip_address=request.client.host if request.client else None,
    )
    return {"message": "Result received", **outcome}


@router.get("/")
def list_results(job_id: Optional[str] = None):
    """List submitted results (optionally filtered by job)."""
    if job_id:
        rows = db.query("SELECT * FROM results WHERE job_id = ? ORDER BY received_at DESC", (job_id,))
    else:
        rows = db.query("SELECT * FROM results ORDER BY received_at DESC LIMIT 200")
    return rows
