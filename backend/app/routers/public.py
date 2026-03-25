from fastapi import APIRouter, Depends, Query
from supabase import Client
from datetime import date, timedelta, datetime, time
from app.dependencies import get_supabase

router = APIRouter()


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
    supabase: Client = Depends(get_supabase),
):
    # Get schedule for that weekday
    # day_of_week: 0=Monday
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

    # Get existing appointments for that date
    appts_res = (
        supabase.table("appointments")
        .select("start_time, end_time, status")
        .eq("date", str(date))
        .neq("status", "cancelled")
        .execute()
    )

    occupied = [(a["start_time"], a["end_time"]) for a in appts_res.data]

    # Generate 30-min slots
    def time_range(start: str, end: str):
        fmt = "%H:%M:%S"
        current = datetime.strptime(start, fmt)
        end_dt = datetime.strptime(end, fmt)
        slots = []
        while current < end_dt:
            slots.append(current.strftime("%H:%M"))
            current += timedelta(minutes=30)
        return slots

    all_slots = time_range(schedule["start_time"], schedule["end_time"])

    # Remove break slots
    break_slots = set()
    if schedule.get("break_start") and schedule.get("break_end"):
        break_slots = set(time_range(schedule["break_start"], schedule["break_end"]))

    # Remove occupied slots
    occupied_slots = set()
    for start_t, end_t in occupied:
        occupied_slots.update(time_range(start_t, end_t))

    available = [
        s for s in all_slots if s not in break_slots and s not in occupied_slots
    ]

    return {"available_slots": available, "is_working": True, "schedule": schedule}
