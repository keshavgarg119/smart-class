from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from app.database import get_db
from app.schemas.attendance_schema import AttendanceCreate, AttendanceResponse, AttendanceWithDetails
from app.models.attendance_model import Attendance
from app.services import face_service, attendance_service

router = APIRouter()

@router.post("/", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def mark_attendance(attendance: AttendanceCreate, db: Session = Depends(get_db)):
    """Mark attendance for a student"""
    db_attendance = Attendance(**attendance.dict())
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

@router.post("/mark-by-face")
async def mark_attendance_by_face(
    file: UploadFile = File(...),
    subject: str = None,
    marked_by: int = None,
    db: Session = Depends(get_db)
):
    """Mark attendance using face recognition"""
    # Recognize the face
    result = await face_service.recognize_face(file, db)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    student_id = result["student_id"]
    confidence = result["confidence"]
    
    # Create attendance record
    attendance_data = AttendanceCreate(
        student_id=student_id,
        subject=subject,
        marked_by=marked_by,
        confidence_score=int(confidence * 100)
    )
    
    db_attendance = Attendance(**attendance_data.dict())
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    
    return {
        "message": "Attendance marked successfully",
        "student_id": student_id,
        "confidence": confidence,
        "attendance_id": db_attendance.id
    }

@router.get("/", response_model=List[AttendanceResponse])
def get_attendance_records(
    skip: int = 0,
    limit: int = 100,
    student_id: int = None,
    start_date: date = None,
    end_date: date = None,
    db: Session = Depends(get_db)
):
    """Get attendance records with optional filters"""
    query = db.query(Attendance)
    
    if student_id:
        query = query.filter(Attendance.student_id == student_id)
    
    if start_date:
        query = query.filter(Attendance.class_date >= start_date)
    
    if end_date:
        query = query.filter(Attendance.class_date <= end_date)
    
    records = query.offset(skip).limit(limit).all()
    return records

@router.get("/{attendance_id}", response_model=AttendanceResponse)
def get_attendance(attendance_id: int, db: Session = Depends(get_db)):
    """Get attendance record by ID"""
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return attendance

@router.get("/student/{student_id}/stats")
def get_student_attendance_stats(student_id: int, db: Session = Depends(get_db)):
    """Get attendance statistics for a student"""
    return attendance_service.get_student_stats(db, student_id)

@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance(attendance_id: int, db: Session = Depends(get_db)):
    """Delete an attendance record"""
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    db.delete(attendance)
    db.commit()
    return None
