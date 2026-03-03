from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List
from datetime import datetime
from bson.objectid import ObjectId
import os
import shutil
from app.database import get_db
from app.schemas.student_schema import StudentCreate, StudentResponse, StudentUpdate, StudentWithUser
from app.services import face_service

# Ensure uploads directory exists
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'faces')
os.makedirs(UPLOADS_DIR, exist_ok=True)

router = APIRouter()

def student_helper(student) -> dict:
    if not student:
        return None
    student["id"] = str(student["_id"])
    student["has_face_encoding"] = student.get("face_encoding") is not None
    return student

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(student: StudentCreate, db = Depends(get_db)):
    """Create a new student record"""
    # Check if student_id already exists
    existing = db.students.find_one({"student_id": student.student_id})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student ID already exists"
        )
    
    new_student = student.dict()
    new_student["created_at"] = datetime.utcnow()
    new_student["photo_url"] = None
    new_student["face_encoding"] = None
    
    result = db.students.insert_one(new_student)
    new_student["_id"] = result.inserted_id
    return student_helper(new_student)

@router.get("/", response_model=List[StudentWithUser])
def get_all_students(skip: int = 0, limit: int = 100, db = Depends(get_db)):
    """Get all students"""
    students_cursor = db.students.find().skip(skip).limit(limit)
    result = []
    for std in students_cursor:
        std = student_helper(std)
        
        # Manually lookup user
        user = None
        if "user_id" in std and std["user_id"]:
            try:
                user = db.users.find_one({"_id": ObjectId(std["user_id"])})
            except:
                pass
                
        student_data = StudentWithUser(
            id=std["id"],
            user_id=std["user_id"],
            student_id=std["student_id"],
            department=std.get("department"),
            year=std.get("year"),
            section=std.get("section"),
            batch=std.get("batch"),
            phone=std.get("phone"),
            photo_url=std.get("photo_url"),
            has_face_encoding=std.get("has_face_encoding", False),
            created_at=std.get("created_at", datetime.utcnow()),
            full_name=user.get("full_name") if user else None,
            email=user.get("email") if user else "",
            username=user.get("username") if user else ""
        )
        result.append(student_data)
    return result

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str, db = Depends(get_db)):
    """Get student by ID"""
    try:
        student = db.students.find_one({"_id": ObjectId(student_id)})
    except Exception:
        student = None
        
    if not student:
        student = db.students.find_one({"user_id": student_id})
        
    if not student:
        # Backward compatibility fallback: auto-create if missing
        try:
            user = db.users.find_one({"_id": ObjectId(student_id)})
            if user and user.get("role") == "student":
                new_student = {
                    "user_id": str(user["_id"]),
                    "student_id": "STU" + str(user["_id"])[-6:].upper(),
                    "department": "General",
                    "year": 1,
                    "section": "A",
                    "batch": None,
                    "phone": None,
                    "created_at": datetime.utcnow(),
                    "photo_url": None,
                    "face_encoding": None
                }
                res = db.students.insert_one(new_student)
                new_student["_id"] = res.inserted_id
                student = new_student
        except Exception:
            pass
            
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student_helper(student)

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: str, student_update: StudentUpdate, db = Depends(get_db)):
    """Update student information"""
    update_data = student_update.dict(exclude_unset=True)
    if not update_data:
        student = db.students.find_one({"_id": ObjectId(student_id)})
        return student_helper(student)
        
    try:
        result = db.students.update_one({"_id": ObjectId(student_id)}, {"$set": update_data})
    except Exception:
        raise HTTPException(status_code=404, detail="Student not found")
        
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
        
    student = db.students.find_one({"_id": ObjectId(student_id)})
    return student_helper(student)

@router.post("/{student_id}/upload-face")
async def upload_face_image(student_id: str, file: UploadFile = File(...), db = Depends(get_db)):
    """Upload and encode student face image for recognition"""
    try:
        student = db.students.find_one({"_id": ObjectId(student_id)})
    except Exception:
        student = None
        
    if not student:
        student = db.students.find_one({"user_id": student_id})
        
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    actual_student_id = student["_id"]
    
    # Save the image file to disk
    await file.seek(0)
    image_filename = f"{str(actual_student_id)}.jpg"
    image_path = os.path.join(UPLOADS_DIR, image_filename)
    with open(image_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Reset file position for face encoding
    await file.seek(0)
    
    # Process face encoding
    encoding = await face_service.encode_face(file)
    if encoding is None:
        # Remove saved image if no face detected
        if os.path.exists(image_path):
            os.remove(image_path)
        raise HTTPException(status_code=400, detail="No face detected in image")
    
    db.students.update_one({"_id": actual_student_id}, {"$set": {
        "face_encoding": encoding,
        "face_image": image_filename
    }})
    
    return {"message": "Face encoding uploaded successfully", "face_image": image_filename}

@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: str, db = Depends(get_db)):
    """Delete a student"""
    try:
        result = db.students.delete_one({"_id": ObjectId(student_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Student not found")
        
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return None
