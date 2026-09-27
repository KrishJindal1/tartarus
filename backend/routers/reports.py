"""
Router for exporting structured forensic reports in PDF and JSON formats.
"""

from fastapi import APIRouter, HTTPException, Response

from services import report_generator

router = APIRouter()


@router.get("/")
def list_reports():
    """Report summaries for completed jobs (frontend Reports view)."""
    return report_generator.list_reports()


@router.get("/{job_id}/json")
def get_report_json(job_id: str):
    """Generate structured JSON forensic report."""
    return report_generator.generate_json_report(job_id)


@router.get("/{job_id}/pdf")
def get_report_pdf(job_id: str):
    """Generate compiled PDF forensic report with MITRE ATT&CK mapping."""
    try:
        pdf_bytes = report_generator.generate_pdf_report(job_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc}")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="jockey-report-{job_id[:8]}.pdf"'},
    )
