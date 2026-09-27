"""
Predefined JOCKY scripts and bootstrap console accounts.
Applied on startup so /scripts and /auth work out of the box.
"""

from .db import execute, now_iso, query_one
from .security import hash_password
from .config import settings

PREDEFINED_SCRIPTS = [
    {
        "name": "Process Monitor",
        "category": "process",
        "risk_level": "medium",
        "os_target": "both",
        "jocky_source": 'fn collect_processes() {\n  let procs = collect_processes()\n  output procs\n}',
    },
    {
        "name": "Memory Dump",
        "category": "memory",
        "risk_level": "high",
        "os_target": "both",
        "jocky_source": 'fn dump_memory() {\n  let regions = dump_memory(0)\n  output encrypt(regions)\n}',
    },
    {
        "name": "Network Map",
        "category": "network",
        "risk_level": "low",
        "os_target": "both",
        "jocky_source": 'fn collect_network() {\n  let conns = collect_network()\n  output conns\n}',
    },
    {
        "name": "Persistence Check",
        "category": "persistence",
        "risk_level": "high",
        "os_target": "both",
        "jocky_source": 'fn analyze_persistence() {\n  let entries = analyze_persistence()\n  output entries\n}',
    },
    {
        "name": "Registry Forensics",
        "category": "registry",
        "risk_level": "critical",
        "os_target": "windows",
        "jocky_source": 'fn dump_registry() {\n  let hive = dump_registry()\n  output encrypt(hive)\n}',
    },
    {
        "name": "User Login Audit",
        "category": "logons",
        "risk_level": "medium",
        "os_target": "both",
        "jocky_source": 'fn collect_logons() {\n  let sessions = collect_logons()\n  output sessions\n}',
    },
    {
        "name": "System Info",
        "category": "system",
        "risk_level": "low",
        "os_target": "both",
        "jocky_source": 'fn collect_system() {\n  let info = collect_system()\n  output info\n}',
    },
    {
        "name": "File Recovery",
        "category": "files",
        "risk_level": "medium",
        "os_target": "both",
        "jocky_source": 'fn collect_files() {\n  let files = collect_files("/etc")\n  output files\n}',
    },
    {
        "name": "Full Endpoint Audit",
        "category": "process",
        "risk_level": "high",
        "os_target": "linux",
        "jocky_source": (
            "fn full_audit() {\n"
            "  let procs = collect_processes()\n"
            "  let net = collect_network()\n"
            "  let pers = analyze_persistence()\n"
            "  let sys = collect_system()\n"
            "  if procs == 0 {\n"
            "    log(\"no processes?\")\n"
            "  }\n"
            "  output sys\n"
            "  output procs\n"
            "  output net\n"
            "  output pers\n"
            "}"
        ),
    },
    {
        "name": "BYOVD Driver Audit",
        "category": "system",
        "risk_level": "critical",
        "os_target": "both",
        "jocky_source": (
            "fn byovd_audit() {\n"
            "  let vuln = scan_byovd()\n"
            "  output vuln\n"
            "}"
        ),
    },
]


def _seed_scripts() -> None:
    from uuid import uuid4

    import sys
    import os
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
    from compiler.ir_emitter import IREmitter
    from compiler.polymorphic_engine import mutate_program

    for script in PREDEFINED_SCRIPTS:
        existing = query_one("SELECT id FROM scripts WHERE name = ?", (script["name"],))
        if existing:
            continue
        try:
            prog = IREmitter(script["jocky_source"]).emit_program()
            ir = mutate_program(prog).to_bytes()
            import hashlib
            sha = hashlib.sha256(ir).hexdigest()
        except Exception:
            ir, sha = None, None

        execute(
            """INSERT INTO scripts (id, name, category, jocky_source, compiled_ir, ir_sha256,
                 risk_level, os_target, is_predefined, is_deployed, version, created_by, created_at)
               VALUES (?,?,?,?,?,?,?,?,?,1,1,NULL,?)""",
            (
                str(uuid4()), script["name"], script["category"], script["jocky_source"],
                ir, sha, script["risk_level"], script["os_target"], 1, now_iso(),
            ),
        )


def _seed_users() -> None:
    from uuid import uuid4

    email = settings.SEED_ADMIN_EMAIL
    if query_one("SELECT id FROM users WHERE email = ?", (email,)):
        return
    execute(
        """INSERT INTO users (id, email, password_hash, role, allowed_agents, mfa_enabled, created_at)
           VALUES (?,?,?,'admin','[]',0,?)""",
        (str(uuid4()), email, hash_password(settings.SEED_ADMIN_PASSWORD), now_iso()),
    )


def seed_all() -> None:
    _seed_users()
    _seed_scripts()
