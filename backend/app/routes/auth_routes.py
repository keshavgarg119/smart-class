from fastapi import APIRouter, HTTPException
from app.models.user_model import user_collection
from app.utils.password_hash import hash_password, verify_password

router = APIRouter()

@router.post("/register")
def register_user(user: dict):
    if user_collection.find_one({"email": user["email"]}):
        raise HTTPException(status_code=400, detail="User already exists")

    user["password"] = hash_password(user["password"])
    user_collection.insert_one(user)
    return {"message": "User registered successfully"}

@router.post("/login")
def login_user(credentials: dict):
    user = user_collection.find_one({"email": credentials["email"]})
    if not user or not verify_password(credentials["password"], user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {"message": "Login successful", "role": user["role"]}
