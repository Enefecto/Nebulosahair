from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.dependencies import get_supabase, get_current_user
from app.models.schemas import ServiceCreate, ServiceUpdate

router = APIRouter()


@router.get("/")
def list_services(
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    res = supabase.table("services").select("*").order("sort_order").execute()
    return res.data


@router.post("/")
def create_service(
    payload: ServiceCreate,
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    res = supabase.table("services").insert(payload.model_dump()).execute()
    return res.data[0]


@router.put("/{service_id}")
def update_service(
    service_id: str,
    payload: ServiceUpdate,
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    res = (
        supabase.table("services")
        .update(payload.model_dump(exclude_unset=True))
        .eq("id", service_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return res.data[0]


@router.delete("/{service_id}")
def delete_service(
    service_id: str,
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    # Warn if has appointments
    appts = (
        supabase.table("appointments")
        .select("id")
        .eq("service_id", service_id)
        .limit(1)
        .execute()
    )
    if appts.data:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar: el servicio tiene citas asociadas.",
        )
    supabase.table("services").delete().eq("id", service_id).execute()
    return {"message": "Servicio eliminado."}
