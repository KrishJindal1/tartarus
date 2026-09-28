"""
Result ingester: receives agent results (inline JSON or R2-encrypted),
parses forensic sections into evidence rows, computes integrity hashes and
risk scores, and completes the job.

Also runnable as a worker:  python -m services.result_ingester --worker
"""

import hashlib
import json
import time
from typing import Dict, List, Optional, Tuple
from uuid import uuid4

from fastapi import HTTPException

from core import db, r2_client
from core.config import settings
from core.crypto import aes_decrypt
from services import agent_monitor, audit_logger

# agent result section -> evidence.type
SECTION_TYPES = {
    "processes": "process",
    "network": "network",
    "memory": "memory",
    "persistence": "persistence",
    "registry": "registry",
    "files": "files",
    "system": "system",
    "logons": "logons",
    "byovd": "byovd",
}


def _canonical_sha256(data) -> str:
    blob = json.dumps(data, sort_keys=True, separators=(",", ":"), default=str).encode()
    return hashlib.sha256(blob).hexdigest()


def _section_risk(etype: str, data) -> float:
    """Simple heuristic risk scoring per evidence type (0-10)."""
    try:
        if etype == "process":
            items = data if isinstance(data, list) else [data]
            return min(10.0, sum(2.0 for p in items if isinstance(p, dict) and p.get("is_suspicious")))
        if etype == "persistence":
            items = data if isinstance(data, list) else [data]
            return min(10.0, len(items) * 1.5)
        if etype == "byovd":
            items = data if isinstance(data, list) else [data]
            return min(10.0, len(items) * 3.0)
        if etype == "memory":
            items = data if isinstance(data, list) else [data]
            rwx = [m for m in items if isinstance(m, dict) and "rwx" in str(m.get("permissions", "")).lower()]
            return min(10.0, float(len(rwx)) * 1.0)
        if etype == "logons":
            items = data if isinstance(data, list) else [data]
            priv = [l for l in items if isinstance(l, dict) and l.get("is_privilege")]
            return min(10.0, float(len(priv)) * 2.0)
    except Exception:
        return 0.0
    return 0.0


def parse_result_message(message: str) -> Tuple[Dict, List[str]]:
    """Agent results arrive as a JSON string; tolerate plain text too."""
    errors: List[str] = []
    if not message:
        return {}, ["empty result message"]
    try:
        parsed = json.loads(message)
        if isinstance(parsed, dict):
            return parsed, errors
        return {"value": parsed}, errors
    except (ValueError, TypeError):
        return {"raw_message": message}, ["result was not valid JSON"]


def ingest_result(
    job_id: str,
    payload: Optional[Dict] = None,
    raw_bytes: Optional[bytes] = None,
    worker_secret: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Dict:
    job = db.query_one("SELECT * FROM jobs WHERE id = ?", (job_id,))
    if job is None:
        raise HTTPException(status_code=404, detail=f"Unknown job_id: {job_id}")

    payload = payload or {}
    errors: List[str] = []

    # Worker secret check when configured
    if settings.WORKER_SECRET and worker_secret is not None and worker_secret != settings.WORKER_SECRET:
        raise HTTPException(status_code=403, detail="Invalid worker secret")

    # 1. Obtain result payload: inline body -> R2 download -> stored message
    findings: Dict = {}
    if raw_bytes is not None:
        try:
            # R2 blob format: nonce(12) + ciphertext, encrypted with the job AES key.
            # Without the AES key available server-side, treat as opaque and record.
            findings = {"sealed_blob_sha256": hashlib.sha256(raw_bytes).hexdigest()}
            errors.append("encrypted blob recorded (decryption requires job key)")
        except Exception as exc:
            errors.append(f"blob processing failed: {exc}")
    else:
        message = payload.get("message") or payload.get("result")
        if isinstance(message, dict):
            findings = message
        elif isinstance(message, str):
            findings, parse_errors = parse_result_message(message)
            errors.extend(parse_errors)
        elif job.get("findings_summary") and payload.get("status") == "success":
            findings = {}

    # 2. Persist raw agent submission
    db.execute(
        """INSERT INTO results (id, job_id, agent_id, status, message, hostname, os, timestamp, raw, received_at)
           VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (
            str(uuid4()),
            job_id,
            payload.get("agent_id") or job["agent_id"],
            payload.get("status", "success"),
            payload.get("message", ""),
            payload.get("hostname", ""),
            payload.get("os", ""),
            payload.get("timestamp", db.now_iso()),
            json.dumps(payload, default=str),
            db.now_iso(),
        ),
    )

    # 3. Evidence rows per forensic section
    evidence_rows: List[Dict] = []
    max_risk = 0.0
    summary_parts: List[str] = []
    for section, etype in SECTION_TYPES.items():
        if section not in findings:
            continue
        data = findings[section]
        if data in (None, [], {}):
            continue
        risk = _section_risk(etype, data)
        sha = _canonical_sha256(data)
        row = {
            "id": str(uuid4()),
            "job_id": job_id,
            "type": etype,
            "data": data,
            "sha256_hash": sha,
            "risk_score": risk,
            "collected_at": db.now_iso(),
        }
        evidence_rows.append(row)
        max_risk = max(max_risk, risk)
        count = len(data) if isinstance(data, list) else 1
        summary_parts.append(f"{count} {etype}")

    # Script outputs (the values the JOCKY script emitted)
    if findings.get("outputs"):
        data = {"outputs": findings["outputs"]}
        evidence_rows.append({
            "id": str(uuid4()),
            "job_id": job_id,
            "type": "system",
            "data": data,
            "sha256_hash": _canonical_sha256(data),
            "risk_score": 0.0,
            "collected_at": db.now_iso(),
        })
        summary_parts.append(f"{len(findings['outputs'])} output(s)")

    for row in evidence_rows:
        db.execute(
            """INSERT INTO evidence (id, job_id, type, data, sha256_hash, risk_score, r2_result_key, collected_at)
               VALUES (?,?,?,?,?,?,?,?)""",
            (
                row["id"], row["job_id"], row["type"],
                json.dumps(row["data"], default=str), row["sha256_hash"],
                row["risk_score"], job.get("r2_result_key"), row["collected_at"],
            ),
        )

    # 4. Complete the job
    agent_risk = findings.get("risk_score")
    if isinstance(agent_risk, (int, float)):
        max_risk = max(max_risk, float(agent_risk))
    status = payload.get("status", "success")
    job_status = "completed" if status == "success" else "failed"
    findings_list = findings.get("findings") or []
    summary = ", ".join(summary_parts) if summary_parts else ("no structured findings")
    if findings_list:
        summary += f" | findings: {'; '.join(str(f) for f in findings_list[:5])}"
    if errors:
        summary += f" | warnings: {'; '.join(errors[:3])}"

    db.execute(
        """UPDATE jobs SET status = ?, completed_at = ?, findings_summary = ?, risk_score = ?
           WHERE id = ?""",
        (job_status, db.now_iso(), summary, max_risk, job_id),
    )
    agent_monitor.sync_activity(payload.get("agent_id") or job.get("agent_id") or "")

    audit_logger.log_action(
        user_id=None,
        action="job.complete",
        resource_type="job",
        resource_id=job_id,
        ip_address=ip_address,
        metadata={"status": job_status, "evidence_rows": len(evidence_rows), "risk_score": max_risk},
    )

    return {
        "job_id": job_id,
        "status": job_status,
        "evidence_rows": len(evidence_rows),
        "risk_score": max_risk,
        "findings_summary": summary,
        "warnings": errors,
    }


def ingest_result_by_job(job_id: str) -> Dict:
    """Worker helper: pull an encrypted result from R2 (if configured) then ingest."""
    job = db.query_one("SELECT * FROM jobs WHERE id = ?", (job_id,))
    if job is None:
        raise HTTPException(status_code=404, detail=f"Unknown job_id: {job_id}")
    if job.get("r2_result_key") and r2_client.is_configured():
        try:
            blob = r2_client.download_from_r2(job["r2_result_key"])
            return ingest_result(job_id, raw_bytes=blob)
        except r2_client.R2NotConfigured:
            pass
        except Exception as exc:
            return {"job_id": job_id, "status": "error", "detail": str(exc)}
    return ingest_result(job_id, payload={"status": "success", "message": ""})


def worker_loop(interval: int = 5) -> None:
    """Polling worker for R2-delivered results (used by docker-compose backend-worker)."""
    print(f"[result_ingester] worker started (interval={interval}s)")
    while True:
        pending = db.query(
            "SELECT id FROM jobs WHERE status = 'dispatched' AND r2_result_key IS NOT NULL LIMIT 10"
        )
        for row in pending:
            try:
                ingest_result_by_job(row["id"])
            except Exception as exc:
                print(f"[result_ingester] ingest {row['id']} failed: {exc}")
        time.sleep(interval)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Tartarus result ingester worker")
    parser.add_argument("--worker", action="store_true", help="run continuous ingest loop")
    parser.add_argument("--interval", type=int, default=5)
    args = parser.parse_args()

    db.init_db()
    if args.worker:
        worker_loop(args.interval)
    else:
        print("nothing to do; pass --worker to run the loop")
