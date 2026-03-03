from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"

class AttendanceBase(BaseModel):
    student_id: str
    subject: Optional[str] = None
    status: AttendanceStatus = AttendanceStatus.PRESENT

class AttendanceCreate(AttendanceBase):
    marked_by: str
    remarks: Optional[str] = None
    confidence_score: Optional[int] = None

class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatus] = None
    remarks: Optional[str] = None

class AttendanceResponse(AttendanceBase):
    id: str
    class_date: datetime
    marked_by: Optional[str] = None
    marked_at: Optional[datetime] = None
    confidence_score: Optional[int] = None
    
    class Config:
        from_attributes = True

class AttendanceWithDetails(AttendanceResponse):
    student_name: str
    student_roll: str
    teacher_name: Optional[str] = None
