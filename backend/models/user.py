"""
User and RBAC role models.
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserProfile(BaseModel):
    id: str
    email: EmailStr
    role: str
    allowed_agents: List[str] = []
    mfa_enabled: bool = False
    created_at: Optional[datetime] = None
