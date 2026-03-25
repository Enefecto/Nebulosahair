import traceback
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from supabase import Client

from app.dependencies import get_supabase_admin as get_supabase, get_current_user
from app.models.schemas import ServiceCreate, ServiceUpdate

router = APIRouter()


def _supabase_error(request: Request, exc: Exception) -> JSONResponse:
    tb = traceback.format_exc()
    print(f"[SUPABASE ERROR] {tb}")
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": tb},
        headers={"Access-Control-Allow-Origin": origin},
    )


@router.get("/")
def list_services(
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    res = supabase.table("services").select("*").order("sort_order").execute()
    return res.data


@router.post("/")
def create_service(
    request: Request,
    payload: ServiceCreate,
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    try:
        data = payload.model_dump()
        print(f"[CREATE SERVICE] payload: {data}")
        res = supabase.table("services").insert(data).execute()
        print(f"[CREATE SERVICE] result: {res}")
        return res.data[0]
    except Exception as exc:
        return _supabase_error(request, exc)


@router.put("/{service_id}")
def update_service(
    request: Request,
    service_id: str,
    payload: ServiceUpdate,
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    try:
        res = (
            supabase.table("services")
            .update(payload.model_dump(exclude_unset=True))
            .eq("id", service_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Servicio no encontrado")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        return _supabase_error(request, exc)


@router.delete("/{service_id}")
def delete_service(
    service_id: str,
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
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
