from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routes.auth_routes import router as auth_router
from app.routes.student_routes import router as student_router
from app.routes.attendance_routes import router as attendance_router

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Attendance System",
    description="AI-powered attendance tracking with face recognition",
    version="1.0.0"
)

# Allow React frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Register all routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(student_router, prefix="/students", tags=["Students"])
app.include_router(attendance_router, prefix="/attendance", tags=["Attendance"])


@app.get("/", tags=["Health"])
def root():
    return {"status": "Backend running", "docs": "/docs"}
