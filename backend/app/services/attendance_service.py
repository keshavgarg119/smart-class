from datetime import datetime, timedelta, date
import csv
import io
from fastapi.responses import StreamingResponse
from app.schemas.attendance_schema import AttendanceStatus
from bson.objectid import ObjectId

def get_student_stats(db, student_id: str):
    """Get attendance statistics for a student"""
    # Total attendance records
    total = db.attendance.count_documents({"student_id": student_id})
    
    # Present count
    present = db.attendance.count_documents({
        "student_id": student_id,
        "status": AttendanceStatus.PRESENT.value
    })
    
    # Absent count
    absent = db.attendance.count_documents({
        "student_id": student_id,
        "status": AttendanceStatus.ABSENT.value
    })
    
    # Late count
    late = db.attendance.count_documents({
        "student_id": student_id,
        "status": AttendanceStatus.LATE.value
    })
    
    # Calculate percentage (present + late both count as attended)
    attended = present + late
    attendance_percentage = (attended / total * 100) if total > 0 else 0
    
    # Build subject-wise breakdown
    all_records = list(db.attendance.find({"student_id": student_id}))
    subject_map = {}
    for r in all_records:
        subj = r.get("subject") or "General"
        if subj not in subject_map:
            subject_map[subj] = {"total": 0, "present": 0}
        subject_map[subj]["total"] += 1
        if r.get("status") in (AttendanceStatus.PRESENT.value, AttendanceStatus.LATE.value, AttendanceStatus.PRESENT, AttendanceStatus.LATE):
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


def get_class_attendance(db, class_date: datetime, subject: str = None):
    """Get attendance for a specific class"""
    start_of_day = datetime.combine(class_date.date(), datetime.min.time())
    end_of_day = datetime.combine(class_date.date(), datetime.max.time())
    
    query = {
        "class_date": {"$gte": start_of_day, "$lte": end_of_day}
    }
    
    if subject:
        query["subject"] = subject
    
    records = list(db.attendance.find(query))
    
    present_count = sum(1 for r in records if r.get("status") == AttendanceStatus.PRESENT.value)
    absent_count = sum(1 for r in records if r.get("status") == AttendanceStatus.ABSENT.value)
    late_count = sum(1 for r in records if r.get("status") == AttendanceStatus.LATE.value)
    
    # Convert ObjectIds for response
    for r in records:
        r["id"] = str(r["_id"])
        
    return {
        "date": class_date.date(),
        "subject": subject,
        "total_students": len(records),
        "present": present_count,
        "absent": absent_count,
        "late": late_count,
        "records": records
    }

def get_daily_report(db, report_date: datetime):
    """Get daily attendance report"""
    start_of_day = datetime.combine(report_date.date(), datetime.min.time())
    end_of_day = datetime.combine(report_date.date(), datetime.max.time())
    
    records = list(db.attendance.find({
        "class_date": {"$gte": start_of_day, "$lte": end_of_day}
    }))
    
    # Group by subject
    subjects = {}
    for record in records:
        subject = record.get("subject") or "General"
        if subject not in subjects:
            subjects[subject] = {"present": 0, "absent": 0, "late": 0}
        
        status = record.get("status")
        if status == AttendanceStatus.PRESENT.value:
            subjects[subject]["present"] += 1
        elif status == AttendanceStatus.ABSENT.value:
            subjects[subject]["absent"] += 1
        elif status == AttendanceStatus.LATE.value:
            subjects[subject]["late"] += 1
    
    return {
        "date": report_date.date(),
        "total_records": len(records),
        "by_subject": subjects
    }

def build_export_query(student_id: str = None, subject: str = None, start_date: date = None, end_date: date = None):
    query = {}
    if student_id:
        query["student_id"] = student_id
    if subject:
        query["subject"] = subject
    
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = datetime.combine(start_date, datetime.min.time())
        if end_date:
            date_query["$lte"] = datetime.combine(end_date, datetime.max.time())
        query["class_date"] = date_query
        
    return query

def export_attendance_csv(db, student_id: str = None, subject: str = None, start_date: date = None, end_date: date = None):
    query = build_export_query(student_id, subject, start_date, end_date)
    records = list(db.attendance.find(query))
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Student ID", "Date", "Subject", "Status"])
    
    for record in records:
        writer.writerow([
            str(record["_id"]),
            record.get("student_id", ""),
            record.get("class_date").isoformat() if record.get("class_date") else "",
            record.get("subject") or "General",
            record.get("status", "")
        ])
        
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=attendance_export.csv"}
    )

def send_low_attendance_notifications(db):
    from app.utils.email_utils import send_email
    
    students = list(db.students.find())
    notified_count = 0
    
    for student in students:
        student_id_str = str(student.get("_id"))
        stats = get_student_stats(db, student_id_str)
        if stats["total_classes"] > 0 and stats["percentage"] < 75.0:
            user = None
            if "user_id" in student and student["user_id"]:
                user = db.users.find_one({"_id": ObjectId(student["user_id"])})
            
            student_email = user.get("email") if user else f"{student.get('student_id')}@example.com"
            student_name = user.get("full_name") if user else student.get("student_id")
            
            subject_msg = "Smart Attendance: Low Attendance Warning"
            body = f"Dear {student_name},\n\nYour attendance is currently at {stats['percentage']}%, which is below the required 75% threshold.\nPlease ensure you attend upcoming classes to avoid any penalties.\n\nBest Regards,\nSmart Attendance System"
            
            # Send real or mocked email
            send_email(to_email=student_email, subject=subject_msg, body=body)
            notified_count += 1
            
    return {"count": notified_count}


def export_attendance_pdf(db, student_id: str = None, subject: str = None, start_date: date = None, end_date: date = None):
    try:
        from fpdf import FPDF
    except ImportError:
        raise ImportError("fpdf2 library is not installed")

    query = build_export_query(student_id, subject, start_date, end_date)
    records = list(db.attendance.find(query))
    
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("helvetica", "B", 16)
    pdf.cell(0, 10, "Smart Class Attendance Report", new_x="LMARGIN", new_y="NEXT", align="C")
    
    pdf.set_font("helvetica", "", 10)
    pdf.cell(0, 10, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", new_x="LMARGIN", new_y="NEXT", align="R")
    
    pdf.ln(5)
    
    # Header
    pdf.set_font("helvetica", "B", 10)
    col_widths = (20, 30, 60, 40, 30)
    headers = ["ID", "Student ID", "Date", "Subject", "Status"]
    for i, h in enumerate(headers):
        pdf.cell(col_widths[i], 10, h, border=1, align="C")
    pdf.ln()

    # Data rows
    pdf.set_font("helvetica", "", 10)
    for record in records:
        pdf.cell(col_widths[0], 10, str(record["_id"])[-6:], border=1, align="C") # Abbreviate ID for space
        pdf.cell(col_widths[1], 10, str(record.get("student_id", "")), border=1, align="C")
        
        date_obj = record.get("class_date")
        date_str = date_obj.strftime('%Y-%m-%d %H:%M') if date_obj else ""
        pdf.cell(col_widths[2], 10, date_str, border=1, align="C")
        
        pdf.cell(col_widths[3], 10, str(record.get("subject") or "General"), border=1, align="C")
        pdf.cell(col_widths[4], 10, str(record.get("status", "")), border=1, align="C")
        pdf.ln()

    # Generate PDF to bytes
    pdf_bytes = pdf.output()
    
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=attendance_report.pdf"}
    )

