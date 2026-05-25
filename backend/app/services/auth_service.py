import re
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException, status
from app.schemas.user_schema import UserCreate
from app.utils.password_hash import get_password_hash, verify_password
from app.config import settings

def user_helper(user) -> dict:
    if not user:
        return None
    user["id"] = str(user["_id"])
    return user

def get_user_by_email(db, email: str):
    """Get user by email (case-insensitive)"""
    user = db.users.find_one({
        "email": {
            "$regex": f"^{re.escape(email)}$",
            "$options": "i"
        }
    })
    return user_helper(user)

def get_user_by_username(db, username: str):
    """Get user by username (case-insensitive)"""
    user = db.users.find_one({
        "username": {
            "$regex": f"^{re.escape(username)}$",
            "$options": "i"
        }
    })
    return user_helper(user)

def create_user(db, user: UserCreate):
    """Create a new user"""
    hashed_password = get_password_hash(user.password)
    new_user = {
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "hashed_password": hashed_password,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "linked_student_rollno": user.linked_student_rollno,  # For parent role
    }
    result = db.users.insert_one(new_user)
    new_user["_id"] = result.inserted_id
    return user_helper(new_user)

def authenticate_user(db, username: str, password: str):
    """Authenticate user with username or email and password"""
    identifier = username.strip()
    user = get_user_by_username(db, identifier)
    if not user:
        # Try email fallback
        user = get_user_by_email(db, identifier)
    if not user:
        return False
    
    if not verify_password(password, user["hashed_password"]):
        return False
    return user


def create_access_token(data: dict):
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(db, token: str):
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user_by_username(db, username)
    if user is None:
        raise credentials_exception
    return user
