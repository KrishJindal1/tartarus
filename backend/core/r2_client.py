"""
Cloudflare R2 storage client (S3-compatible via boto3).

Optional: when R2 credentials are not configured the helpers raise
`R2NotConfigured`, and the job dispatcher falls back to inline payload
delivery so the pipeline keeps working in development.
"""

from .config import settings


class R2NotConfigured(RuntimeError):
    pass


def _have_config() -> bool:
    try:
        import boto3  # noqa: F401
    except ImportError:
        return False
    return bool(
        settings.R2_ENDPOINT_URL
        and settings.R2_ACCESS_KEY_ID
        and settings.R2_SECRET_ACCESS_KEY
        and settings.R2_BUCKET_NAME
    )


def is_configured() -> bool:
    return _have_config()


def get_r2_client():
    """Retrieve boto3 S3 client for Cloudflare R2."""
    if not _have_config():
        raise R2NotConfigured("R2 credentials/boto3 are not configured")
    import boto3

    return boto3.client(
        "s3",
        endpoint_url=settings.R2_ENDPOINT_URL,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


def upload_to_r2(key: str, data: bytes) -> str:
    """Upload binary object to R2 bucket."""
    client = get_r2_client()
    client.put_object(Bucket=settings.R2_BUCKET_NAME, Key=key, Body=data)
    return key


def download_from_r2(key: str) -> bytes:
    """Download binary object from R2 bucket."""
    client = get_r2_client()
    resp = client.get_object(Bucket=settings.R2_BUCKET_NAME, Key=key)
    return resp["Body"].read()


def generate_presigned_get(key: str, expires_in: int = 60) -> str:
    """Generate temporary presigned GET URL for object download."""
    client = get_r2_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.R2_BUCKET_NAME, "Key": key},
        ExpiresIn=expires_in,
    )


def generate_presigned_put(key: str, expires_in: int = 60) -> str:
    """Generate temporary presigned PUT URL used by agents to upload results."""
    client = get_r2_client()
    return client.generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.R2_BUCKET_NAME, "Key": key},
        ExpiresIn=expires_in,
    )
