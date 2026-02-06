from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.attendance_model import AttendanceStatus

class AttendanceBase(BaseModel):
    student_id: int
    subject: Optional[str] = None
    status: AttendanceStatus = AttendanceStatus.PRESENT

class AttendanceCreate(AttendanceBase):
    marked_by: int
    remarks: Optional[str] = None
    confidence_score: Optional[int] = None

class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatus] = None
    remarks: Optional[str] = None

class AttendanceResponse(AttendanceBase):
    id: int
    class_date: datetime
    marked_by: int
    marked_at: datetime
    confidence_score: Optional[int] = None
    
    class Config:
        from_attributes = True

class AttendanceWithDetails(AttendanceResponse):
    student_name: str
    student_roll: str
    teacher_name: Optional[str] = None
