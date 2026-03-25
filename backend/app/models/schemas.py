from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, time, datetime
from uuid import UUID


# --- Auth ---

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# --- Site Config ---

class SiteConfigUpdate(BaseModel):
    business_name: Optional[str] = None
    whatsapp_number: Optional[str] = None
    instagram_url: Optional[str] = None
    address: Optional[str] = None
    address_lat: Optional[float] = None
    address_lng: Optional[float] = None
    logo_url: Optional[str] = None


# --- Services ---

class ServiceCreate(BaseModel):
    name: str
    description: str
    price: int
    duration_minutes: int
    category: str  # corte, barberia, coloracion, permanente, otro
    image_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class ServiceUpdate(ServiceCreate):
    pass


# --- Appointments ---

class AppointmentCreate(BaseModel):
    client_name: str
    client_phone: Optional[str] = None
    service_id: UUID
    date: date
    start_time: time
    price_charged: Optional[int] = None
    notes: Optional[str] = None
    source: str = "whatsapp"  # whatsapp, instagram, walk_in, web


class AppointmentUpdate(AppointmentCreate):
    status: Optional[str] = None


class AppointmentStatusUpdate(BaseModel):
    status: str  # pending, confirmed, completed, cancelled


# --- Gallery ---

class GalleryItemCreate(BaseModel):
    image_url: str
    title: Optional[str] = None
    service_id: Optional[UUID] = None
    is_visible: bool = True
    sort_order: int = 0


class GalleryItemUpdate(GalleryItemCreate):
    pass


# --- Schedule ---

class ScheduleDayConfig(BaseModel):
    day_of_week: int  # 0=Lunes, 6=Domingo
    is_working: bool
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    break_start: Optional[time] = None
    break_end: Optional[time] = None


class ScheduleWeekCreate(BaseModel):
    week_start_date: date
    days: List[ScheduleDayConfig]
