"""
Audit logger service: writes immutable audit records to Supabase for forensic traceability.
"""


def log_action(user_id: str, action: str, resource_type: str, resource_id: str = None, metadata: dict = None) -> None:
    """Log an audit event to the immutable audit log."""
    raise NotImplementedError("Audit logger not implemented yet")
