"""
Seed the JOCKY scripts table with the predefined JOCKY forensic scripts.

Delegates to backend/core/seed.py (single source of truth for seeding).
Usage:
    python scripts/seed_scripts.py
"""
import os
import sys

_BACKEND = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

from core import db, seed  # noqa: E402


def main() -> int:
    db.init_db()
    seed_all = getattr(seed, "seed_all", None)
    if seed_all is None:
        print("backend/core/seed.py has no seed_all()", file=sys.stderr)
        return 1
    seed_all()
    rows = db.query("SELECT name FROM scripts ORDER BY name")
    print(f"Seeded {len(rows)} predefined script(s):")
    for r in rows:
        print(f"  - {r['name']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
