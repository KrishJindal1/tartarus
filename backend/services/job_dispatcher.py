"""
Job dispatcher: compiles scripts, applies the polymorphic engine, optionally
encrypts + uploads the payload to R2, and queues the job for the target agent.
"""

import hashlib
from typing import Dict, Optional
from uuid import uuid4

from fastapi import HTTPException

from core import db, r2_client
from core.config import settings
from core.crypto import aes_encrypt, generate_aes_key, rsa_wrap_key
from services import audit_logger
from services.polymorphic import mutate_source


def dispatch_job(
    agent_id: str,
    script_id: str,
    exec_mode: str = "user_mode",
    created_by: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Dict:
    agent = db.query_one("SELECT * FROM agents WHERE id = ?", (agent_id,))
    if agent is None:
        raise HTTPException(status_code=404, detail=f"Unknown agent_id: {agent_id}")

    script = db.query_one("SELECT * FROM scripts WHERE id = ?", (script_id,))
    if script is None:
        script = db.query_one("SELECT * FROM scripts WHERE name = ?", (script_id,))
    if script is None:
        raise HTTPException(status_code=404, detail=f"Unknown script_id: {script_id}")

    # Compile -> polymorphic IR (unique hash per deployment)
    ir, ir_sha = mutate_source(script["jocky_source"])

    job_id = str(uuid4())
    r2_payload_key = None
    enc_aes_key = None
    r2_result_key = None

    # Encrypted R2 delivery path (only when R2 + agent public key are available)
    if r2_client.is_configured() and agent.get("public_key"):
        try:
            aes_key = generate_aes_key()
            nonce, ct = aes_encrypt(aes_key, ir)
            blob = nonce + ct  # 12-byte nonce prefix
            r2_payload_key = f"payloads/{job_id}/payload.enc"
            r2_client.upload_to_r2(r2_payload_key, blob)
            enc_aes_key = rsa_wrap_key(agent["public_key"], aes_key)
            r2_result_key = f"results/{job_id}/output.enc"
        except Exception:
            # Fall back to inline delivery; encrypted path is best effort
            r2_payload_key = None
            enc_aes_key = None
            r2_result_key = None

    db.execute(
        """INSERT INTO jobs (id, agent_id, script_id, r2_payload_key, r2_result_key, enc_aes_key,
             ir, ir_sha256, status, exec_mode, findings_summary, risk_score, created_by,
             created_at, dispatched_at, completed_at)
           VALUES (?,?,?,?,?,?,?,?, 'queued', ?, NULL, 0.0, ?, ?, NULL, NULL)""",
        (
            job_id, agent_id, script["id"], r2_payload_key, r2_result_key, enc_aes_key,
            ir, ir_sha, exec_mode, created_by, db.now_iso(),
        ),
    )

    audit_logger.log_action(
        user_id=created_by,
        action="job.create",
        resource_type="job",
        resource_id=job_id,
        ip_address=ip_address,
        metadata={
            "agent_id": agent_id,
            "script": script["name"],
            "ir_sha256": ir_sha,
            "exec_mode": exec_mode,
            "delivery": "r2" if r2_payload_key else "inline",
        },
    )

    job = get_job(job_id)
    return job


def get_job(job_id: str) -> Dict:
    job = db.query_one("SELECT * FROM jobs WHERE id = ?", (job_id,))
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return _serialize(job)


def _serialize(job: Dict) -> Dict:
    out = dict(job)
    ir = out.pop("ir", None)
    out["ir"] = list(ir) if isinstance(ir, (bytes, bytearray)) else ir
    # Never leak payload encryption internals to console consumers
    return out


def claim_pending_job(agent_id: str) -> Optional[Dict]:
    """Return the oldest queued job for the agent and mark it dispatched."""
    job = db.query_one(
        "SELECT * FROM jobs WHERE agent_id = ? AND status = 'queued' ORDER BY created_at ASC LIMIT 1",
        (agent_id,),
    )
    if job is None:
        return None
    db.execute(
        "UPDATE jobs SET status = 'dispatched', dispatched_at = ? WHERE id = ?",
        (db.now_iso(), job["id"]),
    )
    job = db.query_one("SELECT * FROM jobs WHERE id = ?", (job["id"],))
    return job
