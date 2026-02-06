from fastapi import FastAPI
from app.routes.auth_routes import router as auth_router

app = FastAPI(title="Smart Attendance System")

app.include_router(auth_router, prefix="/auth")

@app.get("/")
def root():
    return {"status": "Backend running"}
