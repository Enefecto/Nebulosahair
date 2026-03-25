from supabase import Client
from datetime import datetime, date
from typing import Optional
import calendar


def _current_month_range():
    today = date.today()
    first = today.replace(day=1)
    last_day = calendar.monthrange(today.year, today.month)[1]
    last = today.replace(day=last_day)
    return str(first), str(last)


def _prev_month_range():
    today = date.today()
    first_this = today.replace(day=1)
    last_prev = (first_this.replace(day=1) - __import__("datetime").timedelta(days=1))
    first_prev = last_prev.replace(day=1)
    return str(first_prev), str(last_prev)


def get_summary_stats(supabase: Client) -> dict:
    start, end = _current_month_range()
    prev_start, prev_end = _prev_month_range()

    # Current month completed appointments
    curr = (
        supabase.table("appointments")
        .select("price_charged, service_id, status, client_name, client_phone, duration_minutes:services(duration_minutes)")
        .eq("status", "completed")
        .gte("date", start)
        .lte("date", end)
        .execute()
    )
    curr_all = (
        supabase.table("appointments")
        .select("status")
        .gte("date", start)
        .lte("date", end)
        .execute()
    )

    prev = (
        supabase.table("appointments")
        .select("price_charged")
        .eq("status", "completed")
        .gte("date", prev_start)
        .lte("date", prev_end)
        .execute()
    )

    curr_revenue = sum(a.get("price_charged") or 0 for a in curr.data)
    prev_revenue = sum(a.get("price_charged") or 0 for a in prev.data)
    revenue_change = (
        round((curr_revenue - prev_revenue) / prev_revenue * 100, 1) if prev_revenue else None
    )

    # Status breakdown
    status_breakdown = {}
    for a in curr_all.data:
        s = a["status"]
        status_breakdown[s] = status_breakdown.get(s, 0) + 1

    # Most popular service
    service_count: dict = {}
    for a in curr.data:
        sid = a.get("service_id")
        if sid:
            service_count[sid] = service_count.get(sid, 0) + 1
    most_popular_id = max(service_count, key=service_count.get) if service_count else None
    most_popular_name = None
    if most_popular_id:
        svc = supabase.table("services").select("name").eq("id", most_popular_id).single().execute()
        most_popular_name = svc.data["name"] if svc.data else None

    return {
        "current_month": start[:7],
        "revenue": curr_revenue,
        "revenue_vs_prev_month_pct": revenue_change,
        "completed_appointments": len(curr.data),
        "all_appointments_this_month": len(curr_all.data),
        "status_breakdown": status_breakdown,
        "most_popular_service": most_popular_name,
    }


def get_revenue_stats(supabase: Client, period: str, period_date: Optional[str]) -> dict:
    if period == "month" and period_date:
        year, month = period_date.split("-")
        last_day = calendar.monthrange(int(year), int(month))[1]
        start = f"{period_date}-01"
        end = f"{period_date}-{last_day}"
    else:
        start, end = _current_month_range()

    res = (
        supabase.table("appointments")
        .select("date, price_charged")
        .eq("status", "completed")
        .gte("date", start)
        .lte("date", end)
        .execute()
    )

    daily: dict = {}
    for a in res.data:
        d = a["date"]
        daily[d] = daily.get(d, 0) + (a.get("price_charged") or 0)

    return {"period": period, "start": start, "end": end, "data": daily}


def get_appointments_stats(supabase: Client, period: str, period_date: Optional[str]) -> dict:
    if period == "month" and period_date:
        year, month = period_date.split("-")
        last_day = calendar.monthrange(int(year), int(month))[1]
        start = f"{period_date}-01"
        end = f"{period_date}-{last_day}"
    else:
        start, end = _current_month_range()

    res = (
        supabase.table("appointments")
        .select("date, status, start_time")
        .gte("date", start)
        .lte("date", end)
        .execute()
    )

    by_status: dict = {}
    by_hour: dict = {}
    for a in res.data:
        s = a["status"]
        by_status[s] = by_status.get(s, 0) + 1
        hour = a["start_time"][:2] if a.get("start_time") else "?"
        by_hour[hour] = by_hour.get(hour, 0) + 1

    return {
        "start": start,
        "end": end,
        "total": len(res.data),
        "by_status": by_status,
        "by_hour": by_hour,
    }


def get_services_stats(supabase: Client, period: str, period_date: Optional[str]) -> dict:
    if period == "month" and period_date:
        year, month = period_date.split("-")
        last_day = calendar.monthrange(int(year), int(month))[1]
        start = f"{period_date}-01"
        end = f"{period_date}-{last_day}"
    else:
        start, end = _current_month_range()

    res = (
        supabase.table("appointments")
        .select("service_id, price_charged, services(name)")
        .eq("status", "completed")
        .gte("date", start)
        .lte("date", end)
        .execute()
    )

    by_service: dict = {}
    for a in res.data:
        name = (a.get("services") or {}).get("name", "Desconocido")
        if name not in by_service:
            by_service[name] = {"count": 0, "revenue": 0}
        by_service[name]["count"] += 1
        by_service[name]["revenue"] += a.get("price_charged") or 0

    return {"start": start, "end": end, "data": by_service}
