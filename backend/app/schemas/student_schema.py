from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StudentBase(BaseModel):
    student_id: str
    department: Optional[str] = None
    year: Optional[int] = None
    section: Optional[str] = None
    phone: Optional[str] = None

class StudentCreate(StudentBase):
    user_id: int

class StudentUpdate(BaseModel):
    department: Optional[str] = None
    year: Optional[int] = None
    section: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None

class StudentResponse(StudentBase):
    id: int
    user_id: int
    photo_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class StudentWithUser(StudentResponse):
    full_name: Optional[str] = None
    email: str
    username: str
