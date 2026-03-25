from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    # Credenciales AWS explícitas solo para desarrollo local.
    # En Lambda se usan automáticamente desde el IAM execution role.
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: str = "nebulosahair-asg7asg5dhf8dhf5adg8"
    AWS_S3_REGION: str = "sa-east-1"
    ALLOWED_EMAILS: str  # comma-separated
    FRONTEND_URL: str = "https://nebulosahair.pages.dev"

    @property
    def allowed_emails_list(self) -> List[str]:
        return [e.strip().lower() for e in self.ALLOWED_EMAILS.split(",") if e.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
