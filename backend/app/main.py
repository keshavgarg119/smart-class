from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
from app.routes.auth_routes import router as auth_router
from app.routes.student_routes import router as student_router
from app.routes.attendance_routes import router as attendance_router
from app.routes.user_routes import router as user_router
from app.routes.class_routes import router as class_router
from app.routes.bulk_routes import router as bulk_router
from app.routes.leave_routes import router as leave_router
from app.routes.timetable_routes import router as timetable_router
from app.routes.qr_routes import router as qr_router
from app.routes.parent_routes import router as parent_router
from app.routes.tasks_routes import router as tasks_router
from app.services.scheduler_service import init_scheduler

app = FastAPI(
    title="Smart Attendance System",
    description="AI-powered attendance tracking with face recognition & automated jobs",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    init_scheduler()

# Allow React frontend to call the API
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://smart-class-ten.vercel.app",
]

env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    allowed_origins.extend([origin.strip() for origin in env_origins.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):(517[3-5]|3000)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Register all routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(student_router, prefix="/students", tags=["Students"])
app.include_router(class_router, prefix="/classes", tags=["Classes"])
app.include_router(attendance_router, prefix="/attendance", tags=["Attendance"])
app.include_router(bulk_router, prefix="/bulk", tags=["Bulk Operations"])
app.include_router(leave_router, prefix="/leaves", tags=["Leave Management"])
app.include_router(timetable_router, prefix="/timetable", tags=["Timetable"])
app.include_router(qr_router, prefix="/qr", tags=["QR Attendance"])
app.include_router(parent_router, prefix="/parent", tags=["Parent Portal"])
app.include_router(tasks_router, prefix="/tasks", tags=["Background Tasks"])


# Serve uploaded face images as static files
uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'faces')
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads/faces", StaticFiles(directory=uploads_dir), name="face_uploads")


@app.get("/", tags=["Health"])
def root():
    return {"status": "Backend running", "docs": "/docs"}
