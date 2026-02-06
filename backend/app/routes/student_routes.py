from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.student_schema import StudentCreate, StudentResponse, StudentUpdate, StudentWithUser
from app.services import face_service
from app.models.student_model import Student

router = APIRouter()

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    """Create a new student record"""
    # Check if student_id already exists
    existing = db.query(Student).filter(Student.student_id == student.student_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student ID already exists"
        )
    
    db_student = Student(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

@router.get("/", response_model=List[StudentWithUser])
def get_all_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all students"""
    students = db.query(Student).offset(skip).limit(limit).all()
    result = []
    for student in students:
        student_data = StudentWithUser(
            id=student.id,
            user_id=student.user_id,
            student_id=student.student_id,
            department=student.department,
            year=student.year,
            section=student.section,
            phone=student.phone,
            photo_url=student.photo_url,
            created_at=student.created_at,
            full_name=student.user.full_name if student.user else None,
            email=student.user.email if student.user else "",
            username=student.user.username if student.user else ""
        )
        result.append(student_data)
    return result

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    """Get student by ID"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: int, student_update: StudentUpdate, db: Session = Depends(get_db)):
    """Update student information"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    for key, value in student_update.dict(exclude_unset=True).items():
        setattr(student, key, value)
    
    db.commit()
    db.refresh(student)
    return student

@router.post("/{student_id}/upload-face")
async def upload_face_image(student_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload and encode student face image for recognition"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Process face encoding
    encoding = await face_service.encode_face(file)
    if encoding is None:
        raise HTTPException(status_code=400, detail="No face detected in image")
    
    student.face_encoding = encoding
    db.commit()
    
    return {"message": "Face encoding uploaded successfully"}

@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    """Delete a student"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db.delete(student)
    db.commit()
    return None
