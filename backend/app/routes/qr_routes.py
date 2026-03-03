"""
QR Code Attendance Routes
POST /qr/generate  — Teacher generates a new QR session
POST /qr/verify    — Student scans/submits token to mark attendance
GET  /qr/sessions  — Teacher views today's active sessions
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.services import qr_service, auth_service
from app.config import settings

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ─── Request / Response schemas ───────────────────────────────────────────────

class QRGenerateRequest(BaseModel):
    subject: str
    class_id: Optional[str] = None
    lat: Optional[float] = None   # teacher's live GPS
    lng: Optional[float] = None


class QRVerifyRequest(BaseModel):
    token: str
    lat: Optional[float] = None
    lng: Optional[float] = None


# ─── Helper ───────────────────────────────────────────────────────────────────

def _get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    return auth_service.get_current_user(db, token)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/generate")
def generate_qr(
    body: QRGenerateRequest,
    user=Depends(_get_current_user),
):
    """
    Teacher generates a 5-minute QR code session.
    Returns the token and a base64-encoded QR image.
    """
    if user.get("role") not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Only teachers or admins can generate QR codes")

    session = qr_service.generate_qr_session(
        teacher_id=user["id"],
        subject=body.subject,
        class_id=body.class_id,
        teacher_lat=body.lat,
        teacher_lng=body.lng,
    )
    return session


@router.post("/verify")
def verify_qr(
    body: QRVerifyRequest,
    user=Depends(_get_current_user),
    db=Depends(get_db),
):
    """
    Student submits a QR token (optionally with lat/lng) to mark attendance.
    Validates token, optionally checks geolocation, then inserts attendance record.
    """
    if user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can submit QR tokens")

    # Verify token
    try:
        session = qr_service.verify_qr_token(body.token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Geolocation check — compare student against teacher's saved position (50m radius)
    teacher_lat = session.get("teacher_lat")
    teacher_lng = session.get("teacher_lng")
    if teacher_lat is not None and teacher_lng is not None:
        if body.lat is None or body.lng is None:
            raise HTTPException(
                status_code=403,
                detail="This session requires location access. Please enable GPS and try again."
            )
        distance = qr_service.haversine_distance(
            body.lat, body.lng,
            teacher_lat, teacher_lng,
        )
        CLASSROOM_RADIUS_M = 50  # must be within 50m of teacher
        if distance > CLASSROOM_RADIUS_M:
            raise HTTPException(
                status_code=403,
                detail=f"You are {int(distance)}m away from the classroom. "
                       f"Must be within {CLASSROOM_RADIUS_M}m of your teacher."
            )

    # Prevent duplicate attendance for same session
    already_marked = not qr_service.mark_student_in_session(body.token, user["id"])
    if already_marked:
        raise HTTPException(status_code=409, detail="Attendance already marked for this session")

    # Find or look up the student record
    student_doc = db.students.find_one({"user_id": user["id"]})
    student_id = str(student_doc["_id"]) if student_doc else user["id"]

    # Insert attendance record
    record = {
        "student_id": student_id,
        "subject": session["subject"],
        "status": "present",
        "date": datetime.utcnow().strftime("%Y-%m-%d"),
        "timestamp": datetime.utcnow(),
        "marked_via": "qr",
        "teacher_id": session["teacher_id"],
        "class_id": session.get("class_id"),
    }
    db.attendance.insert_one(record)

    return {
        "message": "Attendance marked successfully via QR",
        "subject": session["subject"],
        "date": record["date"],
        "status": "present",
    }


@router.get("/sessions/active")
def get_active_sessions(user=Depends(_get_current_user)):
    """
    Returns active (non-expired) QR sessions created by this teacher.
    """
    if user.get("role") not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Only teachers can view sessions")

    now = datetime.utcnow()
    active = []
    for token, sess in qr_service._active_sessions.items():
        if sess["teacher_id"] == user["id"] and sess["expires_at"] > now:
            active.append({
                "subject": sess["subject"],
                "class_id": sess["class_id"],
                "expires_at": sess["expires_at"].isoformat() + "Z",
                "students_marked": len(sess["marked_students"]),
            })
    return {"sessions": active}
