"""
Result ingester service: downloads encrypted job results from R2, decrypts them,
parses forensic evidence artifacts, and persists structured findings in Supabase.
"""


def ingest_result(job_id: str) -> None:
    """Ingest and process forensic results for a given job ID."""
    raise NotImplementedError("Result ingester not implemented yet")
