"""
Main FastAPI Application Entrypoint for Tartarus / JOCKY Backend.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import agents, jobs, results, scripts, evidence, auth, reports

app = FastAPI(
    title="Tartarus Management Server",
    version="2.4.1",
    docs_url="/api/docs",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://tartarus.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return {"status": "operational", "version": "2.4.1"}
