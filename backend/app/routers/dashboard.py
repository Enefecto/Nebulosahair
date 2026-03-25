from fastapi import APIRouter, Depends, Query
from supabase import Client
from typing import Optional
from datetime import date

from app.dependencies import get_supabase, get_current_user
from app.services.stats import (
    get_summary_stats,
    get_revenue_stats,
    get_appointments_stats,
    get_services_stats,
)

router = APIRouter()


@router.get("/summary")
def summary(
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    return get_summary_stats(supabase)


@router.get("/revenue")
def revenue(
    period: str = Query("month"),
    date: Optional[str] = Query(None, description="YYYY-MM for month, YYYY for year"),
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    return get_revenue_stats(supabase, period, date)


@router.get("/appointments-stats")
def appointments_stats(
    period: str = Query("month"),
    date: Optional[str] = Query(None),
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    return get_appointments_stats(supabase, period, date)


@router.get("/services-stats")
def services_stats(
    period: str = Query("month"),
    date: Optional[str] = Query(None),
    _=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    return get_services_stats(supabase, period, date)
