from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.config import settings
from app.routers import public, auth, services, appointments, gallery, schedule, config, upload, dashboard

app = FastAPI(title="NebulosHair API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public.router, prefix="/api/public", tags=["public"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(services.router, prefix="/api/services", tags=["services"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["appointments"])
app.include_router(gallery.router, prefix="/api/gallery", tags=["gallery"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["schedule"])
app.include_router(config.router, prefix="/api/config", tags=["config"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

handler = Mangum(app)
