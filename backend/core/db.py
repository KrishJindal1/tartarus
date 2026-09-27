"""
Local persistence layer (SQLite) mirroring infra/supabase/schema.sql.

Used when SUPABASE_URL is not configured, so the full pipeline works offline.
All access goes through this module so a future Supabase swap only touches here.
"""

import json
import os
import sqlite3
import threading
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .config import settings

_lock = threading.Lock()
_conn: Optional[sqlite3.Connection] = None

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'analyst',
    allowed_agents TEXT NOT NULL DEFAULT '[]',
    mfa_enabled INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    hostname TEXT NOT NULL,
    os_type TEXT NOT NULL,
    architecture TEXT NOT NULL DEFAULT '',
    ip_internal TEXT,
    public_key TEXT,
    status TEXT NOT NULL DEFAULT 'offline',
    av_present TEXT,
    agent_version TEXT NOT NULL DEFAULT '1.0.0',
    last_seen_at TEXT,
    registered_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scripts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'system',
    jocky_source TEXT NOT NULL,
    compiled_ir BLOB,
    ir_sha256 TEXT,
    risk_level TEXT NOT NULL DEFAULT 'medium',
    os_target TEXT NOT NULL DEFAULT 'both',
    is_predefined INTEGER NOT NULL DEFAULT 0,
    is_deployed INTEGER NOT NULL DEFAULT 1,
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    script_id TEXT,
    r2_payload_key TEXT,
    r2_result_key TEXT,
    enc_aes_key TEXT,
    ir BLOB,
    ir_sha256 TEXT,
    status TEXT NOT NULL DEFAULT 'queued',
    exec_mode TEXT NOT NULL DEFAULT 'user_mode',
    findings_summary TEXT,
    risk_score REAL NOT NULL DEFAULT 0,
    created_by TEXT,
    created_at TEXT NOT NULL,
    dispatched_at TEXT,
    completed_at TEXT
);

CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    type TEXT NOT NULL,
    data TEXT NOT NULL,
    sha256_hash TEXT NOT NULL,
    risk_score REAL NOT NULL DEFAULT 0,
    r2_result_key TEXT,
    collected_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS results (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    agent_id TEXT,
    status TEXT NOT NULL,
    message TEXT,
    hostname TEXT,
    os TEXT,
    timestamp TEXT,
    raw TEXT,
    received_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    ip_address TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_agent ON jobs(agent_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_evidence_job ON evidence(job_id);
CREATE INDEX IF NOT EXISTS idx_results_job ON results(job_id);
"""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_conn() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        db_path = settings.DATABASE_PATH
        parent = os.path.dirname(os.path.abspath(db_path))
        os.makedirs(parent, exist_ok=True)
        _conn = sqlite3.connect(db_path, check_same_thread=False)
        _conn.row_factory = sqlite3.Row
        _conn.executescript(SCHEMA)
        _conn.commit()
    return _conn


def init_db() -> None:
    get_conn()


def _rows(cur) -> List[Dict[str, Any]]:
    out = []
    for r in cur.fetchall():
        d = dict(r)
        for k, v in d.items():
            if isinstance(v, bytes):
                continue
            if k in ("allowed_agents", "metadata") and isinstance(v, str):
                try:
                    d[k] = json.loads(v)
                except (ValueError, TypeError):
                    pass
        out.append(d)
    return out


def query(sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
    with _lock:
        cur = get_conn().execute(sql, params)
        return _rows(cur)


def query_one(sql: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    rows = query(sql, params)
    return rows[0] if rows else None


def execute(sql: str, params: tuple = ()) -> None:
    with _lock:
        conn = get_conn()
        conn.execute(sql, params)
        conn.commit()


def execute_many(sql: str, seq) -> None:
    with _lock:
        conn = get_conn()
        conn.executemany(sql, seq)
        conn.commit()


# ------------------------------------------------------------------ helpers

def row_to_dict(row: Optional[Dict[str, Any]], blob_fields: tuple = ()) -> Optional[Dict[str, Any]]:
    if row is None:
        return None
    out = dict(row)
    for f in blob_fields:
        if f in out and isinstance(out[f], (bytes, bytearray)):
            out[f] = list(out[f])
    return out
