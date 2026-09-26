from fastapi import APIRouter, HTTPException
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
    # Fixed JOCKY IR for the first end-to-end test:
    #
    # CALL system.info()
    #
    # 01       = CALL
    # 06       = "system" length
    # system
    # 04       = "info" length
    # info

    system_info_ir = bytes([
        0x01,
        0x06,
        ord("s"),
        ord("y"),
        ord("s"),
        ord("t"),
        ord("e"),
        ord("m"),
        0x04,
        ord("i"),
        ord("n"),
        ord("f"),
        ord("o"),
    ])

    job_data = {
        "job_id": str(uuid4()),
        "agent_id": job.agent_id,
        "script_id": job.script_id,
        "exec_mode": job.exec_mode,
        "status": "pending",
        "ir": list(system_info_ir),
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
                "ir": job["ir"],
            }

    raise HTTPException(
        status_code=404,
        detail="No pending jobs",
    )


@router.get("/")
def list_jobs():
    return jobs