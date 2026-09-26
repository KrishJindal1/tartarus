"""
Seed the Supabase scripts table with 8 predefined JOCKY forensic scripts.
"""
import os
import sys

PREDEFINED_SCRIPTS = [
    {
        "name": "Process Monitor",
        "category": "process",
        "risk_level": "medium",
        "os_target": "both",
        "is_predefined": True,
        "jocky_source": "fn collect_processes() {\n  let procs = collect_processes()\n  output procs\n}",
    },
    {
        "name": "Memory Dump",
        "category": "memory",
        "risk_level": "high",
        "os_target": "both",
        "is_predefined": True,
        "jocky_source": "fn dump_memory(pid: int) {\n  let regions = dump_memory(pid)\n  output encrypt(regions)\n}",
    },
    {
        "name": "Network Map",
        "category": "network",
        "risk_level": "low",
        "os_target": "both",
        "is_predefined": True,
        "jocky_source": "fn collect_network() {\n  let conns = collect_network()\n  output conns\n}",
    },
    {
        "name": "Persistence Check",
        "category": "persistence",
        "risk_level": "high",
        "os_target": "windows",
        "is_predefined": True,
        "jocky_source": "fn analyze_persistence() {\n  let entries = analyze_persistence()\n  output entries\n}",
    },
    {
        "name": "Registry Forensics",
        "category": "registry",
        "risk_level": "critical",
        "os_target": "windows",
        "is_predefined": True,
        "jocky_source": "fn dump_registry() {\n  let hive = dump_registry()\n  output encrypt(hive)\n}",
    },
    {
        "name": "User Login Audit",
        "category": "logons",
        "risk_level": "medium",
        "os_target": "both",
        "is_predefined": True,
        "jocky_source": "fn collect_logons() {\n  let sessions = collect_logons()\n  output sessions\n}",
    },
    {
        "name": "System Info",
        "category": "system",
        "risk_level": "low",
        "os_target": "both",
        "is_predefined": True,
        "jocky_source": "fn collect_system() {\n  let info = collect_system()\n  output info\n}",
    },
    {
        "name": "File Recovery",
        "category": "files",
        "risk_level": "medium",
        "os_target": "both",
        "is_predefined": True,
        "jocky_source": "fn collect_files(path: str) {\n  let files = collect_files(path)\n  output files\n}",
    },
]


def seed_database():
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("[ERROR] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables required.")
        sys.exit(1)

    try:
        from supabase import create_client
        sb = create_client(supabase_url, supabase_key)
        for s in PREDEFINED_SCRIPTS:
            sb.table("scripts").insert(s).execute()
            print(f"[SEED] Inserted: {s['name']}")
        print("[DONE] All forensic scripts seeded successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to seed scripts: {e}")


if __name__ == "__main__":
    seed_database()
