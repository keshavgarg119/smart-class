from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.attendance_model import Attendance, AttendanceStatus
from datetime import datetime, timedelta

def get_student_stats(db: Session, student_id: int):
    """Get attendance statistics for a student"""
    # Total attendance records
    total = db.query(Attendance).filter(Attendance.student_id == student_id).count()
    
    # Present count
    present = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.status == AttendanceStatus.PRESENT
    ).count()
    
    # Absent count
    absent = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.status == AttendanceStatus.ABSENT
    ).count()
    
    # Late count
    late = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.status == AttendanceStatus.LATE
    ).count()
    
    # Calculate percentage (present + late both count as attended)
    attended = present + late
    attendance_percentage = (attended / total * 100) if total > 0 else 0
    
    # Build subject-wise breakdown
    all_records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    subject_map = {}
    for r in all_records:
        subj = r.subject or "General"
        if subj not in subject_map:
            subject_map[subj] = {"total": 0, "present": 0}
        subject_map[subj]["total"] += 1
        if r.status in (AttendanceStatus.PRESENT, AttendanceStatus.LATE):
            subject_map[subj]["present"] += 1
    
    subjects = [
        {
            "subject": subj,
            "total": data["total"],
            "present": data["present"],
            "percentage": round((data["present"] / data["total"] * 100), 1) if data["total"] > 0 else 0
        }
        for subj, data in subject_map.items()
    ]
    
    return {
        "total_classes": total,
        "present": present,
        "absent": absent,
        "late": late,
        "percentage": round(attendance_percentage, 2),
        "subjects": subjects
    }


def get_class_attendance(db: Session, class_date: datetime, subject: str = None):
    """Get attendance for a specific class"""
    query = db.query(Attendance).filter(
        func.date(Attendance.class_date) == class_date.date()
    )
    
    if subject:
        query = query.filter(Attendance.subject == subject)
    
    records = query.all()
    
    present_count = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
    absent_count = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
    late_count = sum(1 for r in records if r.status == AttendanceStatus.LATE)
    
    return {
        "date": class_date.date(),
        "subject": subject,
        "total_students": len(records),
        "present": present_count,
        "absent": absent_count,
        "late": late_count,
        "records": records
    }

def get_daily_report(db: Session, date: datetime):
    """Get daily attendance report"""
    records = db.query(Attendance).filter(
        func.date(Attendance.class_date) == date.date()
    ).all()
    
    # Group by subject
    subjects = {}
    for record in records:
        subject = record.subject or "General"
        if subject not in subjects:
            subjects[subject] = {"present": 0, "absent": 0, "late": 0}
        
        if record.status == AttendanceStatus.PRESENT:
            subjects[subject]["present"] += 1
        elif record.status == AttendanceStatus.ABSENT:
            subjects[subject]["absent"] += 1
        elif record.status == AttendanceStatus.LATE:
            subjects[subject]["late"] += 1
    
    return {
        "date": date.date(),
        "total_records": len(records),
        "by_subject": subjects
    }
