from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StudentBase(BaseModel):
    student_id: str
    department: Optional[str] = None
    year: Optional[int] = None
    section: Optional[str] = None
    batch: Optional[str] = None
    phone: Optional[str] = None

class StudentCreate(StudentBase):
    user_id: str

class StudentUpdate(BaseModel):
    department: Optional[str] = None
    year: Optional[int] = None
    section: Optional[str] = None
    batch: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None

class StudentResponse(StudentBase):
    id: str
    user_id: str
    photo_url: Optional[str] = None
    has_face_encoding: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True

class StudentWithUser(StudentResponse):
    full_name: Optional[str] = None
    email: str
    username: str
