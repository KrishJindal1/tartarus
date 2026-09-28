"""
Persistence layer.

- SQLite (default): local/dev + fully offline pipeline (mirrors infra/supabase/schema.sql).
- PostgreSQL (DATABASE_URL set): persistent cloud deploys (Supabase / Render), so
  history survives container resets.

All access goes through this module; the Postgres dialect translation
("?"/BLOB/AUTOINCREMENT -> %s/BYTEA/SERIAL) happens here, so routers and
services stay backend-agnostic.
"""

import json
import os
import re
import sqlite3
import threading
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .config import settings

_lock = threading.Lock()
_conn: Optional[Any] = None
_mode: Optional[str] = None  # "sqlite" | "postgres"

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


# ----------------------------------------------------------------- postgres

def _sql_pg(sql: str) -> str:
    """Translate SQLite-style placeholders to Postgres: ? -> %s (outside 'literals')."""
    out: List[str] = []
    in_str = False
    i, n = 0, len(sql)
    while i < n:
        ch = sql[i]
        if in_str:
            out.append(ch)
            if ch == "'":
                if i + 1 < n and sql[i + 1] == "'":
                    out.append("'")
                    i += 2
                    continue
                in_str = False
            i += 1
        else:
            if ch == "'":
                in_str = True
                out.append(ch)
            elif ch == "?":
                out.append("%s")
            else:
                out.append(ch)
            i += 1
    return "".join(out)


def _schema_pg() -> str:
    s = SCHEMA.replace("INTEGER PRIMARY KEY AUTOINCREMENT", "SERIAL PRIMARY KEY")
    return re.sub(r"\bBLOB\b", "BYTEA", s)


def _adapt(params: tuple):
    """bools must match INTEGER columns (psycopg2 would send boolean literals)."""
    if not params:
        return params
    out = []
    for v in params:
        if isinstance(v, bool):
            out.append(int(v))
        elif isinstance(v, bytearray):
            out.append(bytes(v))
        else:
            out.append(v)
    return tuple(out)


def _connect_pg():
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError(
            "DATABASE_URL is set but psycopg2 is missing (pip install psycopg2-binary)"
        ) from exc
    conn = psycopg2.connect(
        settings.DATABASE_URL, connect_timeout=10, application_name="jocky-backend"
    )
    conn.autocommit = True
    conn.cursor_factory = RealDictCursor
    with conn.cursor() as cur:
        # execute per-statement: Supabase's transaction pooler rejects multi-command queries
        for stmt in _schema_pg().split(";"):
            stmt = stmt.strip()
            if stmt:
                cur.execute(stmt)
    return conn


def _connect_sqlite():
    db_path = settings.DATABASE_PATH
    parent = os.path.dirname(os.path.abspath(db_path))
    os.makedirs(parent, exist_ok=True)
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    conn.commit()
    return conn


def get_conn() -> Any:
    global _conn, _mode
    if _conn is None:
        if settings.DATABASE_URL:
            _mode = "postgres"
            _conn = _connect_pg()
        else:
            _mode = "sqlite"
            _conn = _connect_sqlite()
    return _conn


def init_db() -> None:
    with _lock:
        get_conn()


def _rows(cur) -> List[Dict[str, Any]]:
    out = []
    for r in cur.fetchall():
        d = dict(r)
        for k, v in list(d.items()):
            if isinstance(v, memoryview):
                d[k] = bytes(v)
                continue
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
        conn = get_conn()
        if _mode == "postgres":
            cur = conn.cursor()
            try:
                cur.execute(_sql_pg(sql), _adapt(params))
                return _rows(cur)
            finally:
                cur.close()
        return _rows(conn.execute(sql, params))


def query_one(sql: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    rows = query(sql, params)
    return rows[0] if rows else None


def execute(sql: str, params: tuple = ()) -> None:
    with _lock:
        conn = get_conn()
        if _mode == "postgres":
            cur = conn.cursor()
            try:
                cur.execute(_sql_pg(sql), _adapt(params))
            finally:
                cur.close()
            conn.commit()
            return
        conn.execute(sql, params)
        conn.commit()


def execute_many(sql: str, seq) -> None:
    with _lock:
        conn = get_conn()
        if _mode == "postgres":
            cur = conn.cursor()
            try:
                cur.executemany(_sql_pg(sql), (_adapt(tuple(r)) for r in seq))
            finally:
                cur.close()
            conn.commit()
            return
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
