from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.config import settings
from app.dependencies import get_supabase, get_current_user
from app.models.schemas import RegisterRequest, LoginRequest

router = APIRouter()


@router.post("/register")
def register(payload: RegisterRequest, supabase: Client = Depends(get_supabase)):
    if payload.email.lower() not in settings.allowed_emails_list:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No se puede crear la cuenta.",
        )
    try:
        res = supabase.auth.sign_up({"email": payload.email, "password": payload.password})
        return {"message": "Cuenta creada. Revisa tu email para confirmar."}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login")
def login(payload: LoginRequest, supabase: Client = Depends(get_supabase)):
    try:
        res = supabase.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
        return {
            "access_token": res.session.access_token,
            "refresh_token": res.session.refresh_token,
            "user": {"id": res.user.id, "email": res.user.email},
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas."
        )


@router.post("/logout")
def logout(
    current_user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    supabase.auth.sign_out()
    return {"message": "Sesión cerrada."}
