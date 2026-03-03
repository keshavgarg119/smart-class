from pydantic import BaseModel
from typing import Optional

class ClassBase(BaseModel):
    name: str
    department: str
    year: int

class ClassCreate(ClassBase):
    pass

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None

class ClassResponse(ClassBase):
    id: str
    
    class Config:
        from_attributes = True
