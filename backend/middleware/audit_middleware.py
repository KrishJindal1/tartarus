"""
Audit middleware for intercepting and logging state-mutating HTTP requests.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Placeholder for auto-logging mutating requests
        return await call_next(request)
