"""
Job dispatcher service: handles compiling scripts, encrypting payloads, uploading to R2,
and queuing jobs in Supabase.
"""


def dispatch_job(agent_id: str, script_id: str, exec_mode: str = "user_mode") -> str:
    """Dispatch forensic job to target agent."""
    raise NotImplementedError("Job dispatcher not implemented yet")
