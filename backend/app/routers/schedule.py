from fastapi import APIRouter, Depends, Query
from supabase import Client
from datetime import date

from app.dependencies import get_supabase_admin as get_supabase, get_current_user
from app.models.schemas import ScheduleWeekCreate

router = APIRouter()


@router.get("/")
def get_schedule(
    week: date = Query(...),
    _=Depends(get_current_user),
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


@router.post("/")
def upsert_schedule(
    payload: ScheduleWeekCreate,
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    # Delete existing for that week and re-insert
    supabase.table("schedule_config").delete().eq(
        "week_start_date", str(payload.week_start_date)
    ).execute()

    rows = []
    for day in payload.days:
        row = day.model_dump()
        row["week_start_date"] = str(payload.week_start_date)
        row["start_time"] = str(row["start_time"]) if row["start_time"] else None
        row["end_time"] = str(row["end_time"]) if row["end_time"] else None
        row["break_start"] = str(row["break_start"]) if row["break_start"] else None
        row["break_end"] = str(row["break_end"]) if row["break_end"] else None
        rows.append(row)

    res = supabase.table("schedule_config").insert(rows).execute()
    return res.data
