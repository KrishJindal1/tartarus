"""
Cloudflare R2 storage client (S3-compatible via boto3).
"""


def get_r2_client():
    """Retrieve boto3 S3 client for Cloudflare R2."""
    raise NotImplementedError("R2 client not implemented yet")


def upload_to_r2(key: str, data: bytes) -> str:
    """Upload binary object to R2 bucket."""
    raise NotImplementedError("R2 upload not implemented yet")


def download_from_r2(key: str) -> bytes:
    """Download binary object from R2 bucket."""
    raise NotImplementedError("R2 download not implemented yet")


def generate_presigned_get(key: str, expires_in: int = 60) -> str:
    """Generate temporary presigned GET URL for object download."""
    raise NotImplementedError("Presigned GET URL not implemented yet")
