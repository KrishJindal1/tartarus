"""
Agent liveness: activity-based status sync + stale sweep (offline detection).

The backend never initiates TCP to agents (they sit behind NAT and only poll);
liveness = last contact. Agents poll /jobs/pending every few seconds and
heartbeat every 15s, so a live agent refreshes last_seen_at continuously.
Anything silent for STALE_AFTER_SECONDS is marked offline:

  * derived on every /agents/ read  (immediate UI truth)
  * persisted by a background sweep (DB truth for all consumers)
"""

import threading
import time
from datetime import datetime, timezone
from typing import Optional

from core import db

STALE_AFTER_SECONDS = 60
SWEEP_INTERVAL_SECONDS = 30


def _parse(iso: Optional[str]) -> Optional[datetime]:
    if not iso:
        return None
    try:
        dt = datetime.fromisoformat(iso)
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def is_stale(last_seen_at: Optional[str], now: Optional[datetime] = None) -> bool:
    ts = _parse(last_seen_at)
    if ts is None:
        return True
    now = now or datetime.now(timezone.utc)
    return (now - ts).total_seconds() > STALE_AFTER_SECONDS


def effective_status(row: dict) -> str:
    """Status as it should be shown: anything active but silent -> offline."""
    status = row.get("status") or "offline"
    if status in ("online", "busy", "idle") and is_stale(row.get("last_seen_at")):
        return "offline"
    return status


def sync_activity(agent_id: str) -> str:
    """Bump last_seen and derive status: busy while a job runs, else online."""
    now = db.now_iso()
    db.execute(
        """UPDATE agents
           SET last_seen_at = ?,
               status = CASE WHEN EXISTS (
                   SELECT 1 FROM jobs
                   WHERE jobs.agent_id = agents.id
                     AND jobs.status IN ('dispatched', 'executing')
               ) THEN 'busy' ELSE 'online' END
           WHERE id = ?""",
        (now, agent_id),
    )
    row = db.query_one("SELECT status FROM agents WHERE id = ?", (agent_id,))
    return row["status"] if row else "offline"


def sweep_once() -> int:
    """Persist offline for agents whose last contact is older than the threshold."""
    now = datetime.now(timezone.utc)
    changed = 0
    for row in db.query("SELECT id, status, last_seen_at FROM agents"):
        if row["status"] in ("online", "busy", "idle") and is_stale(
            row.get("last_seen_at"), now
        ):
            db.execute("UPDATE agents SET status = 'offline' WHERE id = ?", (row["id"],))
            changed += 1
    return changed


def start_sweeper() -> None:
    def loop() -> None:
        while True:
            time.sleep(SWEEP_INTERVAL_SECONDS)
            try:
                sweep_once()
            except Exception:
                pass

    threading.Thread(target=loop, daemon=True, name="agent-status-sweeper").start()
