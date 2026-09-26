"""
Router for managing forensic scripts and routines.
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_scripts():
    """List available forensic scripts."""
    raise NotImplementedError("Endpoint not implemented yet")


@router.post("/")
def create_script():
    """Create a new forensic script."""
    raise NotImplementedError("Endpoint not implemented yet")


@router.get("/{script_id}")
def get_script(script_id: str):
    """Retrieve details and source code of a specific script."""
    raise NotImplementedError("Endpoint not implemented yet")
