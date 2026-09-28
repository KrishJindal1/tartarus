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
        "name": "File Recovery (Linux)",
        "category": "files",
        "risk_level": "medium",
        "os_target": "linux",
        "jocky_source": (
            'fn collect_files() {\n'
            '  let cfg = collect_files("/etc")\n'
            '  let logs = collect_files("/var/log")\n'
            '  let home = collect_files("/home")\n'
            '  output cfg\n'
            '  output logs\n'
            '  output home\n'
            '}'
        ),
    },
    {
        "name": "File Recovery (Windows)",
        "category": "files",
        "risk_level": "medium",
        "os_target": "windows",
        "jocky_source": (
            'fn collect_files() {\n'
            '  let tmp = collect_files("C:\\\\Windows\\\\Temp")\n'
            '  let pub = collect_files("C:\\\\Users\\\\Public")\n'
            '  let prog = collect_files("C:\\\\ProgramData")\n'
            '  output tmp\n'
            '  output pub\n'
            '  output prog\n'
            '}'
        ),
    },
    {
        "name": "Full Endpoint Audit",
        "category": "process",
        "risk_level": "high",
        "os_target": "both",
        "jocky_source": (
            "fn full_audit() {\n"
            "  let procs = collect_processes()\n"
            "  let net = collect_network()\n"
            "  let pers = analyze_persistence()\n"
            "  let sessions = collect_logons()\n"
            "  let sys = collect_system()\n"
            "  output sys\n"
            "  output procs\n"
            "  output net\n"
            "  output pers\n"
            "  output sessions\n"
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


# Predefined scripts renamed/split in later releases; removed only while
# they still carry the pristine seed (version 1, never console-edited).
RETIRED_PREDEFINED = ["File Recovery"]


def _seed_scripts() -> None:
    from uuid import uuid4

    import sys
    import os
    import hashlib
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
    from compiler.ir_emitter import IREmitter
    from compiler.polymorphic_engine import mutate_program

    def compile_ir(source: str):
        prog = IREmitter(source).emit_program()
        ir = mutate_program(prog).to_bytes()
        return ir, hashlib.sha256(ir).hexdigest()

    for name in RETIRED_PREDEFINED:
        execute(
            """DELETE FROM scripts WHERE name=? AND is_predefined=1
                 AND version=1 AND is_deployed=1 AND created_by IS NULL""",
            (name,),
        )

    for script in PREDEFINED_SCRIPTS:
        existing = query_one(
            "SELECT id, jocky_source, version, is_predefined FROM scripts WHERE name = ?",
            (script["name"],),
        )
        if existing:
            # Refresh managed scripts that were never edited through the
            # console (version stays 1 until an operator saves a change).
            stale = (
                existing.get("jocky_source") != script["jocky_source"]
                or existing.get("os_target") != script["os_target"]
                or existing.get("category") != script["category"]
                or existing.get("risk_level") != script["risk_level"]
            )
            untouched = (
                existing.get("is_predefined")
                and int(existing.get("version") or 1) == 1
                and stale
            )
            if untouched:
                try:
                    ir, sha = compile_ir(script["jocky_source"])
                except Exception:
                    ir, sha = None, None
                execute(
                    """UPDATE scripts SET jocky_source=?, compiled_ir=?, ir_sha256=?,
                          category=?, risk_level=?, os_target=?
                       WHERE id=?""",
                    (
                        script["jocky_source"], ir, sha,
                        script["category"], script["risk_level"], script["os_target"],
                        existing["id"],
                    ),
                )
            continue
        try:
            ir, sha = compile_ir(script["jocky_source"])
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
