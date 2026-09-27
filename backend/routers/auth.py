"""
Authentication router: login, refresh token, and credential verification.
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from core import db
from core.config import settings
from core.security import create_user_token, decode_token, verify_password
from services import audit_logger

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    token: str


@router.post("/login")
def login(body: LoginRequest, request: Request):
    """Authenticate investigator credentials and issue a JWT."""
    user = db.query_one("SELECT * FROM users WHERE email = ?", (body.email,))
    if user is None or not verify_password(body.password, user["password_hash"]):
        audit_logger.log_action(
            user_id=user["id"] if user else None,
            action="auth.login.failed",
            resource_type="user",
            ip_address=request.client.host if request.client else None,
            metadata={"email": body.email},
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_user_token(user)
    audit_logger.log_action(
        user_id=user["id"],
        action="auth.login",
        resource_type="user",
        resource_id=user["id"],
        ip_address=request.client.host if request.client else None,
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "allowed_agents": user.get("allowed_agents") or [],
        },
    }


@router.post("/refresh")
def refresh_token(body: RefreshRequest):
    """Refresh an existing or expiring JWT if still within the grace window."""
    try:
        claims = decode_token(body.token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    if claims.get("typ") != "user":
        raise HTTPException(status_code=401, detail="Not a user token")
    user = db.query_one("SELECT * FROM users WHERE id = ?", (claims.get("sub"),))
    if user is None:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return {
        "access_token": create_user_token(user),
        "token_type": "bearer",
    }


@router.get("/me")
def me(request: Request):
    """Bootstrap helper: reports auth configuration and seeded admin identity."""
    return {
        "auth_enabled": settings.AUTH_ENABLED,
        "admin_email": settings.SEED_ADMIN_EMAIL,
        "hint": "POST /auth/login with the seeded admin credentials",
    }
