from fastapi import APIRouter , HTTPException
from pydantic import BaseModel
from uuid import uuid4

router = APIRouter()

jobs = []


class JobCreate(BaseModel):
    agent_id: str
    script_id: str
    exec_mode: str = "user_mode"


@router.post("/create")
def create_job(job: JobCreate):
    job_data = {
        "job_id": str(uuid4()),
        "agent_id": job.agent_id,
        "script_id": job.script_id,
        "exec_mode": job.exec_mode,
        "status": "pending",
    }

    jobs.append(job_data)

    return {
        "message": "Job created",
        "job": job_data,
    }

@router.get("/pending/{agent_id}")
def get_pending_job(agent_id: str):
    for job in jobs:
        if job["agent_id"] == agent_id and job["status"] == "pending":

            job["status"] = "dispatched"

            return {
                "job_id": job["job_id"],
                "payload_url": "",
                "enc_aes_key": "",
                "exec_mode": job["exec_mode"],
                "result_r2_key": "",
            }

    raise HTTPException(
        status_code=404,
        detail="No pending jobs",
    )