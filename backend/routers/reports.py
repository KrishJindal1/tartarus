"""
Router for exporting structured forensic reports in PDF and JSON formats.
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/{job_id}/json")
def get_report_json(job_id: str):
    """Generate structured JSON forensic report."""
    raise NotImplementedError("Endpoint not implemented yet")


@router.get("/{job_id}/pdf")
def get_report_pdf(job_id: str):
    """Generate compiled PDF forensic report with MITRE ATT&CK mapping."""
    raise NotImplementedError("Endpoint not implemented yet")
