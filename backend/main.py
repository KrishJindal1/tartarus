"""
Main FastAPI Application Entrypoint for the JOCKY Management Server.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from core import db
from core.config import settings
from core.seed import seed_all
from routers import agents, auth, evidence, jobs, reports, results, scripts
from services import audit_logger

app = FastAPI(
    title="JOCKEY Management Server",
    version="2.5.0",
    docs_url="/api/docs",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    """Create local store and seed predefined scripts + console admin."""
    db.init_db()
    seed_all()


@app.middleware("http")
async def audit_middleware(request: Request, call_next):
    """Auto-log every mutating request to the audit log."""
    response = await call_next(request)
    if request.method in ("POST", "PUT", "PATCH", "DELETE") and request.url.path != "/health":
        try:
            audit_logger.log_action(
                user_id=None,
                action=f"http.{request.method.lower()}",
                resource_type="http",
                resource_id=request.url.path,
                ip_address=request.client.host if request.client else None,
                metadata={"status": response.status_code},
            )
        except Exception:
            pass  # never break the request path on audit failure
    return response


# Register routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(agents.router, prefix="/agents", tags=["Agents"])
app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
app.include_router(results.router, prefix="/results", tags=["Results"])
app.include_router(scripts.router, prefix="/scripts", tags=["Scripts"])
app.include_router(evidence.router, prefix="/evidence", tags=["Evidence"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])


@app.get("/health")
def health():
    return {"status": "operational", "version": "2.5.0"}


@app.get("/audit")
def audit_trail(limit: int = 100):
    """Tamper-evident chronological audit trail (frontend Timeline view)."""
    return audit_logger.recent(limit)
