"""
Router for querying stored forensic evidence and summary statistics.
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/summary")
def get_evidence_summary():
    """Retrieve global evidence summary across all investigated jobs."""
    raise NotImplementedError("Endpoint not implemented yet")


@router.get("/{job_id}")
def get_evidence_by_job(job_id: str):
    """Retrieve all evidence items collected for a specific job."""
    raise NotImplementedError("Endpoint not implemented yet")
