"""
Configuration settings for the Tartarus backend using Pydantic BaseSettings.
"""
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase (optional in development - SQLite is used as local store)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # Cloudflare R2 (optional - payloads are delivered inline when unset)
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "jocky-payloads"
    R2_ENDPOINT_URL: str = ""

    # Console origins allowed by CORS (JSON list via env)
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://tartarus.vercel.app",
    ]

    # Auth
    JWT_SECRET: str = "jockey-dev-secret-change-me-in-production-32ch"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480
    AGENT_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30
    AUTH_ENABLED: bool = False  # set true in production to enforce JWT on console routes

    # Shared secret for Cloudflare Worker -> backend calls
    WORKER_SECRET: str = ""

    # Local persistence (SQLite) - used when SUPABASE_URL is not configured
    DATABASE_PATH: str = "jockey.db"
    # Optional PostgreSQL (Supabase/Render): set to persist beyond container resets.
    DATABASE_URL: str = ""

    # Seeded console account (dev bootstrap)
    SEED_ADMIN_EMAIL: str = "admin@tartarus.local"
    SEED_ADMIN_PASSWORD: str = "Tartarus#Admin1"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
