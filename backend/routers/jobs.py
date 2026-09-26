"""
Router for job dispatching, status tracking, and payload retrieval.
"""
from fastapi import APIRouter

router = APIRouter()


@router.post("/create")
def create_job():
    """Create and dispatch a new forensic job."""
    raise NotImplementedError("Endpoint not implemented yet")


@router.get("/")
def list_jobs():
    """List forensic jobs with optional filtering."""
    raise NotImplementedError("Endpoint not implemented yet")


@router.get("/{job_id}")
def get_job(job_id: str):
    """Retrieve details and status for a specific job."""
    raise NotImplementedError("Endpoint not implemented yet")


@router.patch("/{job_id}/status")
def update_job_status(job_id: str):
    """Update job status callback."""
    raise NotImplementedError("Endpoint not implemented yet")


@router.get("/{job_id}/payload-url")
def get_job_payload_url(job_id: str):
    """Get presigned URL for encrypted job payload download."""
    raise NotImplementedError("Endpoint not implemented yet")
