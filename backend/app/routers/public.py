from fastapi import APIRouter, Depends, Query, HTTPException, Request
from supabase import Client
from datetime import date, timedelta, datetime, time
from typing import Optional
from app.dependencies import get_supabase, get_supabase_admin
from app.models.schemas import AppointmentCreate
from app.limiter import limiter

router = APIRouter()


@router.post("/appointments")
@limiter.limit("1/minute")
def create_public_appointment(
    request: Request,
    payload: AppointmentCreate,
    supabase: Client = Depends(get_supabase_admin),
):
    """Endpoint público — crea una cita en estado 'pending' desde el formulario web."""
    svc = supabase.table("services").select("duration_minutes, price").eq("id", str(payload.service_id)).single().execute()
    if not svc.data:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    start_dt = datetime.combine(payload.date, payload.start_time)
    end_dt = start_dt + timedelta(minutes=svc.data["duration_minutes"])

    data = payload.model_dump()
    data["service_id"] = str(payload.service_id)
    data["date"] = str(payload.date)
    data["start_time"] = str(payload.start_time)
    data["end_time"] = end_dt.strftime("%H:%M:%S")
    data["status"] = "pending"
    data["source"] = "web"
    data["price_charged"] = payload.price_charged or svc.data["price"]

    res = supabase.table("appointments").insert(data).execute()
    return res.data[0]


@router.get("/config")
def get_config(supabase: Client = Depends(get_supabase)):
    res = supabase.table("site_config").select("*").limit(1).execute()
    return res.data[0] if res.data else {}


@router.get("/services")
def get_services(supabase: Client = Depends(get_supabase)):
    res = (
        supabase.table("services")
        .select("*")
        .eq("is_active", True)
        .order("sort_order")
        .execute()
    )
    return res.data


@router.get("/gallery")
def get_gallery(supabase: Client = Depends(get_supabase)):
    res = (
        supabase.table("gallery")
        .select("*")
        .eq("is_visible", True)
        .order("sort_order")
        .execute()
    )
    return res.data


@router.get("/schedule")
def get_schedule(
    week: date = Query(..., description="Fecha del lunes (YYYY-MM-DD)"),
    supabase: Client = Depends(get_supabase),
):
    res = (
        supabase.table("schedule_config")
        .select("*")
        .eq("week_start_date", str(week))
        .order("day_of_week")
        .execute()
    )
    return res.data


@router.get("/availability")
def get_availability(
    date: date = Query(...),
    service_id: Optional[str] = Query(None),
    supabase: Client = Depends(get_supabase_admin),
):
    weekday = date.weekday()
    week_start = date - timedelta(days=weekday)

    schedule_res = (
        supabase.table("schedule_config")
        .select("*")
        .eq("week_start_date", str(week_start))
        .eq("day_of_week", weekday)
        .limit(1)
        .execute()
    )

    if not schedule_res.data:
        return {"available_slots": [], "is_working": False}

    schedule = schedule_res.data[0]
    if not schedule["is_working"]:
        return {"available_slots": [], "is_working": False}

    # Fetch service duration (default 30 min if no service_id provided)
    duration = 30
    if service_id:
        svc_res = (
            supabase.table("services")
            .select("duration_minutes")
            .eq("id", service_id)
            .single()
            .execute()
        )
        if svc_res.data:
            duration = svc_res.data["duration_minutes"]

    # Get existing appointments (not cancelled)
    appts_res = (
        supabase.table("appointments")
        .select("start_time, end_time, status")
        .eq("date", str(date))
        .neq("status", "cancelled")
        .execute()
    )

    def to_minutes(t: str) -> int:
        """Convert HH:MM:SS or HH:MM to minutes since midnight."""
        parts = t.split(":")
        return int(parts[0]) * 60 + int(parts[1])

    # Parse existing appointment intervals in minutes
    booked = [(to_minutes(a["start_time"]), to_minutes(a["end_time"])) for a in appts_res.data]

    day_start = to_minutes(schedule["start_time"])
    day_end = to_minutes(schedule["end_time"])

    break_start: Optional[int] = None
    break_end: Optional[int] = None
    if schedule.get("break_start") and schedule.get("break_end"):
        break_start = to_minutes(schedule["break_start"])
        break_end = to_minutes(schedule["break_end"])

    # Walk through 30-min increments and check if a booking of `duration` fits
    available = []
    current = day_start
    while current + duration <= day_end:
        slot_start = current
        slot_end = current + duration

        # Skip if slot overlaps with break
        if break_start is not None and slot_start < break_end and slot_end > break_start:
            current += 30
            continue

        # Skip if slot overlaps with any existing appointment
        if any(slot_start < appt_end and slot_end > appt_start for appt_start, appt_end in booked):
            current += 30
            continue

        available.append(f"{slot_start // 60:02d}:{slot_start % 60:02d}")
        current += 30

    return {"available_slots": available, "is_working": True, "schedule": schedule}
