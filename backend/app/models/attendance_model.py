from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject = Column(String)
    class_date = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.PRESENT)
    marked_by = Column(Integer, ForeignKey("users.id"))  # Teacher who marked attendance
    marked_at = Column(DateTime, default=datetime.utcnow)
    remarks = Column(String)
    confidence_score = Column(Integer)  # Face recognition confidence (0-100)
    
    # Relationships
    student = relationship("Student", back_populates="attendance_records")
    teacher = relationship("User", foreign_keys=[marked_by])
