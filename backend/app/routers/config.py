from fastapi import APIRouter, Depends
from supabase import Client

from app.dependencies import get_supabase_admin as get_supabase, get_current_user
from app.models.schemas import SiteConfigUpdate

router = APIRouter()


@router.get("/")
def get_config(
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    res = supabase.table("site_config").select("*").limit(1).execute()
    return res.data[0] if res.data else {}


@router.put("/")
def update_config(
    payload: SiteConfigUpdate,
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    existing = supabase.table("site_config").select("id").limit(1).execute()
    data = payload.model_dump(exclude_unset=True)
    if existing.data:
        res = (
            supabase.table("site_config")
            .update(data)
            .eq("id", existing.data[0]["id"])
            .execute()
        )
    else:
        res = supabase.table("site_config").insert(data).execute()
    return res.data[0]
