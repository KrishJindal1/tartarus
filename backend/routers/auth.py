"""
Authentication router: login, refresh token, and credential verification.
"""
from fastapi import APIRouter

router = APIRouter()


@router.post("/login")
def login():
    """Authenticate investigator credentials and issue JWT."""
    raise NotImplementedError("Endpoint not implemented yet")


@router.post("/refresh")
def refresh_token():
    """Refresh an existing or expiring JWT."""
    raise NotImplementedError("Endpoint not implemented yet")
