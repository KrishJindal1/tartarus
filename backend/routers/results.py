from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

results = []


class JobResult(BaseModel):
    job_id: str
    agent_id: str
    status: str
    message: str
    hostname: str
    os: str
    timestamp: str


@router.post("/submit")
def submit_result(result: JobResult):
    result_data = result.model_dump()

    results.append(result_data)

    return {
        "message": "Result received",
        "result": result_data,
    }


@router.get("/")
def list_results():
    return results