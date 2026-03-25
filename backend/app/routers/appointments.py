from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from datetime import date as Date
from typing import Optional

from app.dependencies import get_supabase_admin as get_supabase, get_current_user
from app.models.schemas import AppointmentCreate, AppointmentUpdate, AppointmentStatusUpdate

router = APIRouter()


@router.get("/")
def list_appointments(
    status: Optional[str] = Query(None),
    date: Optional[Date] = Query(None),
    service_id: Optional[str] = Query(None),
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    query = supabase.table("appointments").select("*, services(name, duration_minutes)")
    if status:
        query = query.eq("status", status)
    if date:
        query = query.eq("date", str(date))
    if service_id:
        query = query.eq("service_id", service_id)
    res = query.order("date").order("start_time").execute()
    return res.data


@router.post("/")
def create_appointment(
    payload: AppointmentCreate,
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    # Get service duration to calculate end_time
    svc = supabase.table("services").select("duration_minutes, price").eq("id", str(payload.service_id)).single().execute()
    if not svc.data:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    from datetime import datetime, timedelta
    start_dt = datetime.combine(payload.date, payload.start_time)
    end_dt = start_dt + timedelta(minutes=svc.data["duration_minutes"])

    data = payload.model_dump()
    data["service_id"] = str(payload.service_id)
    data["date"] = str(payload.date)
    data["start_time"] = str(payload.start_time)
    data["end_time"] = end_dt.strftime("%H:%M:%S")
    data["status"] = "pending"
    data["price_charged"] = payload.price_charged or svc.data["price"]

    res = supabase.table("appointments").insert(data).execute()
    return res.data[0]


@router.put("/{appointment_id}")
def update_appointment(
    appointment_id: str,
    payload: AppointmentUpdate,
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    data = payload.model_dump(exclude_unset=True)
    if "service_id" in data:
        data["service_id"] = str(data["service_id"])
    if "date" in data:
        data["date"] = str(data["date"])
    if "start_time" in data:
        data["start_time"] = str(data["start_time"])

    res = supabase.table("appointments").update(data).eq("id", appointment_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return res.data[0]


@router.put("/{appointment_id}/status")
def update_status(
    appointment_id: str,
    payload: AppointmentStatusUpdate,
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    valid_statuses = {"pending", "confirmed", "completed", "cancelled"}
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Estado inválido")
    res = (
        supabase.table("appointments")
        .update({"status": payload.status})
        .eq("id", appointment_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return res.data[0]


@router.delete("/{appointment_id}")
def delete_appointment(
    appointment_id: str,
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    supabase.table("appointments").delete().eq("id", appointment_id).execute()
    return {"message": "Cita eliminada."}
