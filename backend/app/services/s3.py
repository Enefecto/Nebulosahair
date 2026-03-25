import boto3
import io
from PIL import Image
from urllib.parse import urlparse

from app.config import settings

s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_S3_REGION,
)

MAX_SIZES = {
    "logo": (400, 400),
    "services": (800, 800),
    "gallery": (1200, 1200),
}


def _process_image(content: bytes, folder: str) -> bytes:
    img = Image.open(io.BytesIO(content))
    img = img.convert("RGB")
    max_size = MAX_SIZES.get(folder, (1200, 1200))
    img.thumbnail(max_size, Image.LANCZOS)
    output = io.BytesIO()
    img.save(output, format="WEBP", quality=85)
    return output.getvalue()


def upload_image(content: bytes, folder: str, name: str, content_type: str) -> str:
    processed = _process_image(content, folder)
    key = f"{folder}/{name}.webp"
    s3_client.put_object(
        Bucket=settings.AWS_S3_BUCKET,
        Key=key,
        Body=processed,
        ContentType="image/webp",
        ACL="public-read",
    )
    return f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_S3_REGION}.amazonaws.com/{key}"


def delete_image_from_url(image_url: str) -> bool:
    try:
        parsed = urlparse(image_url)
        key = parsed.path.lstrip("/")
        s3_client.delete_object(Bucket=settings.AWS_S3_BUCKET, Key=key)
        return True
    except Exception:
        return False
