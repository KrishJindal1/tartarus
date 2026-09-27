"""
Audit logger service: writes immutable audit records for forensic traceability.
"""

from typing import Dict, Optional

from core import db


def log_action(
    user_id: Optional[str],
    action: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    metadata: Optional[Dict] = None,
) -> None:
    """Log an audit event to the immutable audit log."""
    import json

    db.execute(
        """INSERT INTO audit_logs (user_id, action, resource_type, resource_id,
             ip_address, metadata, created_at)
           VALUES (?,?,?,?,?,?,?)""",
        (
            user_id,
            action,
            resource_type,
            resource_id,
            ip_address,
            json.dumps(metadata or {}, default=str),
            db.now_iso(),
        ),
    )


def recent(limit: int = 100) -> list:
    import json

    rows = db.query("SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?", (limit,))
    for r in rows:
        if isinstance(r.get("metadata"), str):
            try:
                r["metadata"] = json.loads(r["metadata"])
            except (ValueError, TypeError):
                pass
    return rows
