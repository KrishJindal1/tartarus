"""
Optional Supabase client. The local SQLite store in core.db is the default
persistence layer; this module activates only when SUPABASE_URL is configured
and the supabase package is installed.
"""

from .config import settings

_client = None


def is_configured() -> bool:
    return bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY)


def get_supabase_client():
    """Retrieve Supabase database client instance (service-role)."""
    global _client
    if not is_configured():
        raise RuntimeError("Supabase is not configured (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)")
    if _client is None:
        from supabase import create_client

        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    return _client
