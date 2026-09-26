"""
Router for ingesting forensic job results returned from endpoint agents.
"""
from fastapi import APIRouter

router = APIRouter()


@router.post("/ingest/{job_id}")
def ingest_job_results(job_id: str):
    """Ingest, decrypt, verify, and store forensic findings for a completed job."""
    raise NotImplementedError("Endpoint not implemented yet")
