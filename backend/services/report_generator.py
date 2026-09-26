"""
Forensic report synthesis service: aggregates evidence findings, timelines, and MITRE ATT&CK
mappings into PDF and JSON reports.
"""


def generate_json_report(job_id: str) -> dict:
    """Generate structured JSON report for a forensic investigation job."""
    raise NotImplementedError("Report generator not implemented yet")


def generate_pdf_report(job_id: str) -> bytes:
    """Generate compiled PDF report bytes for a forensic investigation job."""
    raise NotImplementedError("Report generator not implemented yet")
