from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from app.database import get_db
from app.schemas.user_schema import UserCreate, UserResponse, Token
from app.services import auth_service
from app.services import otp_service
from app.utils.email_utils import send_email
from pydantic import BaseModel

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db=Depends(get_db)):
    """Register a new user (student / teacher / admin)"""
    if auth_service.get_user_by_email(db, user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    if auth_service.get_user_by_username(db, user.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    return auth_service.create_user(db, user)


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    """Login with username/email + password, returns JWT access token"""
    user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth_service.create_access_token(
        data={"sub": user["username"], "role": user["role"], "id": user["id"]}
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    """Get current logged-in user info from Bearer token"""
    user = auth_service.get_current_user(db, token)
    return user


class OTPRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    otp: str


@router.post("/send-otp")
def send_otp(request: OTPRequest):
    """Generate an OTP and email it to the user"""
    otp = otp_service.generate_otp(request.email)
    subject = "Smart Attendance - Email Verification OTP"
    body = f"Your OTP for email verification is: {otp}\n\nThis code expires in 5 minutes.\nIf you did not request this, please ignore this email."
    email_sent = send_email(to_email=request.email, subject=subject, body=body)
    
    if not email_sent:
        response = {
            "message": "OTP generated (SMTP delivery failed, returning OTP for verification)",
            "email": request.email,
            "otp": otp,
            "warning": "Email delivery failed. Please check SMTP settings. OTP returned in response for testing."
        }
        return response
        
    response = {"message": "OTP sent successfully", "email": request.email}
    # If SMTP is using dummy credentials, include the OTP in the response for testing
    from app.config import settings
    if "your-email" in settings.SMTP_USER or not settings.SMTP_USER:
        response["otp"] = otp  # Only exposed during local dev with dummy SMTP
    return response


@router.post("/verify-otp")
def verify_otp(request: OTPVerify):
    """Verify the OTP entered by the user"""
    is_valid = otp_service.verify_otp(request.email, request.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    return {"message": "OTP verified successfully", "verified": True}

