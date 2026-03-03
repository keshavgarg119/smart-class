from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson.objectid import ObjectId
from app.database import get_db
from app.schemas.user_schema import UserResponse, UserUpdate, UserCreate
from app.services import auth_service
from app.utils.password_hash import get_password_hash

router = APIRouter()

def user_helper(user) -> dict:
    if not user:
        return None
    user["id"] = str(user["_id"])
    return user

@router.get("/", response_model=List[UserResponse])
def get_all_users(skip: int = 0, limit: int = 100, db = Depends(get_db)):
    """Get all users"""
    users_cursor = db.users.find().skip(skip).limit(limit)
    return [user_helper(u) for u in users_cursor]

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db = Depends(get_db)):
    """Get user by ID"""
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_helper(user)

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db = Depends(get_db)):
    """Create a new user"""
    if auth_service.get_user_by_email(db, user.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    if auth_service.get_user_by_username(db, user.username):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
    
    return auth_service.create_user(db, user)

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: str, user_update: UserUpdate, db = Depends(get_db)):
    """Update a user"""
    update_data = user_update.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
    try:
        result = db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")
        
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    user = db.users.find_one({"_id": ObjectId(user_id)})
    return user_helper(user)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: str, db = Depends(get_db)):
    """Delete a user"""
    try:
        result = db.users.delete_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")
        
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return None
