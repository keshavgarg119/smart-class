"""
QR Code Attendance Service
Generates and verifies time-limited QR tokens for attendance marking.
"""
import qrcode
import io
import base64
import math
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from app.config import settings

# In-memory session store: {session_id -> session_data}
# In production this should be Redis or MongoDB
_active_sessions: dict = {}

QR_TOKEN_EXPIRE_MINUTES = 5
QR_SECRET_SUFFIX = ":qr-session"  # Salt to distinguish QR tokens from auth tokens


def generate_qr_session(teacher_id: str, subject: str, class_id: Optional[str] = None,
                        teacher_lat: Optional[float] = None, teacher_lng: Optional[float] = None) -> dict:
    """
    Create a new QR session token (5-min expiry) and return:
    {token, qr_image_base64, session_id, expires_at, subject}
    """
    expires_at = datetime.utcnow() + timedelta(minutes=QR_TOKEN_EXPIRE_MINUTES)

    payload = {
        "type": "qr_session",
        "teacher_id": teacher_id,
        "subject": subject,
        "class_id": class_id or "",
        "exp": expires_at,
        "iat": datetime.utcnow(),
    }
    token = jwt.encode(payload, settings.SECRET_KEY + QR_SECRET_SUFFIX, algorithm=settings.ALGORITHM)

    # Store session
    _active_sessions[token] = {
        "teacher_id": teacher_id,
        "subject": subject,
        "class_id": class_id,
        "expires_at": expires_at,
        "marked_students": [],
        "teacher_lat": teacher_lat,   # teacher's live GPS
        "teacher_lng": teacher_lng,
    }

    # Generate QR image
    qr_image_b64 = _generate_qr_image(token)

    return {
        "token": token,
        "qr_image_base64": qr_image_b64,
        "expires_at": expires_at.isoformat() + "Z",
        "subject": subject,
        "class_id": class_id,
        "geo_enabled": teacher_lat is not None,
    }


def verify_qr_token(token: str) -> dict:
    """
    Verify a QR token and return the session data.
    Raises ValueError on invalid/expired token.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY + QR_SECRET_SUFFIX,
            algorithms=[settings.ALGORITHM]
        )
    except JWTError as e:
        raise ValueError(f"Invalid or expired QR token: {e}")

    if payload.get("type") != "qr_session":
        raise ValueError("Token is not a QR session token")

    session = _active_sessions.get(token)
    if not session:
        raise ValueError("QR session not found or expired")

    if datetime.utcnow() > session["expires_at"]:
        _active_sessions.pop(token, None)
        raise ValueError("QR session has expired")

    return session


def mark_student_in_session(token: str, student_id: str) -> bool:
    """
    Mark a student as having used this QR. Returns False if already marked (prevents duplicate).
    """
    session = _active_sessions.get(token)
    if not session:
        return False
    if student_id in session["marked_students"]:
        return False
    session["marked_students"].append(student_id)
    return True


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance in meters between two GPS coordinates."""
    R = 6_371_000  # Earth radius in metres
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _generate_qr_image(token: str) -> str:
    """Generate a QR code PNG and return as base64 string."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=4,
    )
    qr.add_data(token)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")
