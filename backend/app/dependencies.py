from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client

from app.config import settings

bearer_scheme = HTTPBearer()


def get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


def get_supabase_admin() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    supabase: Client = Depends(get_supabase),
):
    token = credentials.credentials
    try:
        response = supabase.auth.get_user(token)
        if not response.user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        return response.user
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autorizado")
