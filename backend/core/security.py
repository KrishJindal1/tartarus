"""
Authentication, JWT token verification, and RBAC authorization dependencies.
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from .config import settings

bearer = HTTPBearer(auto_error=False)

PASSWORD_SCHEME = "pbkdf2_sha256"
PBKDF2_ITERATIONS = 260_000


# ---------------------------------------------------------------- passwords

def hash_password(password: str) -> str:
    import base64
    import hashlib
    import os

    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return f"{PASSWORD_SCHEME}${PBKDF2_ITERATIONS}${base64.b64encode(salt).decode()}${base64.b64encode(dk).decode()}"


def verify_password(password: str, stored: str) -> bool:
    import base64
    import hashlib
    import hmac

    try:
        scheme, iterations, salt_b64, hash_b64 = stored.split("$")
        if scheme != PASSWORD_SCHEME:
            return False
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(hash_b64)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, int(iterations))
        return hmac.compare_digest(dk, expected)
    except (ValueError, TypeError):
        return False


# -------------------------------------------------------------------- tokens

def create_token(claims: Dict, expire_minutes: Optional[int] = None, token_type: str = "user") -> str:
    now = datetime.now(timezone.utc)
    minutes = expire_minutes if expire_minutes is not None else settings.JWT_EXPIRE_MINUTES
    payload = dict(claims)
    payload.update({
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=minutes)).timestamp()),
        "typ": token_type,
    })
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])


def create_user_token(user: Dict) -> str:
    return create_token({
        "sub": user["id"],
        "email": user.get("email", ""),
        "role": user.get("role", "viewer"),
        "allowed_agents": user.get("allowed_agents", []),
    })


def create_agent_token(agent_id: str) -> str:
    return create_token(
        {"sub": agent_id, "agent_id": agent_id},
        expire_minutes=settings.AGENT_TOKEN_EXPIRE_MINUTES,
        token_type="agent",
    )


# ------------------------------------------------------------ FastAPI deps

def _extract_claims(credentials: Optional[HTTPAuthorizationCredentials]) -> Dict:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    try:
        return decode_token(credentials.credentials)
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {exc}")


async def current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> Dict:
    """
    Console/API caller. When AUTH_ENABLED is false (dev), an implicit admin
    identity is returned so the dashboard works without a login flow.
    """
    if not settings.AUTH_ENABLED:
        return {"sub": "dev-user", "role": "admin", "email": "dev@local", "allowed_agents": []}
    claims = _extract_claims(credentials)
    if claims.get("typ") != "user":
        raise HTTPException(status_code=401, detail="User token required")
    return claims


def require_role(*roles: str):
    def dependency(token_data: Dict = Depends(current_user)) -> Dict:
        if not settings.AUTH_ENABLED:
            return token_data
        if token_data.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return token_data
    return dependency


async def require_agent(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> Dict:
    """Agent-facing routes: validates an agent-type token when auth is enabled."""
    if not settings.AUTH_ENABLED:
        return {"typ": "agent", "agent_id": "*"}
    claims = _extract_claims(credentials)
    if claims.get("typ") != "agent":
        raise HTTPException(status_code=401, detail="Agent token required")
    return claims


def agent_matches(agent_claims: Dict, agent_id: str) -> bool:
    if not settings.AUTH_ENABLED:
        return True
    return agent_claims.get("agent_id") == agent_id


def check_worker_secret(header_value: Optional[str]) -> None:
    """Validate X-Worker-Secret when a shared secret is configured."""
    if settings.WORKER_SECRET and header_value != settings.WORKER_SECRET:
        raise HTTPException(status_code=403, detail="Invalid worker secret")


def verify_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> Dict:
    """Backwards-compatible public helper: raw JWT decode or 401."""
    return _extract_claims(credentials)
