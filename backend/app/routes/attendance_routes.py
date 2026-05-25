from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List
from datetime import datetime, date
from bson.objectid import ObjectId
from app.database import get_db
from app.schemas.attendance_schema import AttendanceCreate, AttendanceResponse, AttendanceWithDetails, AttendanceStatus
from app.services import face_service, attendance_service

router = APIRouter()

def attendance_helper(att) -> dict:
    if not att:
        return None
    att["id"] = str(att["_id"])
    return att

@router.post("/", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def mark_attendance(attendance: AttendanceCreate, db = Depends(get_db)):
    """Mark attendance for a student"""
    att_dict = attendance.dict()
    att_dict["class_date"] = datetime.utcnow()
    att_dict["marked_at"] = datetime.utcnow()
    
    result = db.attendance.insert_one(att_dict)
    att_dict["_id"] = result.inserted_id
    
    return attendance_helper(att_dict)

@router.post("/mark-by-face")
async def mark_attendance_by_face(
    file: UploadFile = File(...),
    subject: str = None,
    marked_by: str = None,
    db = Depends(get_db)
):
    """Mark attendance using face recognition"""
    # Recognize the face
    result = await face_service.recognize_face(file, db)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    student_id = result["student_id"]
    confidence = result["confidence"]
    
    # Create attendance record
    try:
        att_dict = {
            "student_id": str(student_id),
            "subject": subject,
            "marked_by": marked_by,
            "confidence_score": int(confidence * 100),
            "status": AttendanceStatus.PRESENT.value,
            "class_date": datetime.utcnow(),
            "marked_at": datetime.utcnow()
        }
        
        db_result = db.attendance.insert_one(att_dict)
        
        return {
            "message": "Attendance marked successfully",
            "student_id": str(student_id),
            "confidence": confidence,
            "attendance_id": str(db_result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/", response_model=List[AttendanceResponse])
def get_attendance_records(
    skip: int = 0,
    limit: int = 100,
    student_id: str = None,
    start_date: date = None,
    end_date: date = None,
    db = Depends(get_db)
):
    """Get attendance records with optional filters"""
    query = {}
    
    if student_id:
        query["student_id"] = student_id
    
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = datetime.combine(start_date, datetime.min.time())
        if end_date:
            date_query["$lte"] = datetime.combine(end_date, datetime.max.time())
        query["class_date"] = date_query
    
    records_cursor = db.attendance.find(query).skip(skip).limit(limit)
    records = []
    for r in records_cursor:
        records.append(attendance_helper(r))
    return records

@router.get("/export")
def export_attendance(
    student_id: str = None,
    subject: str = None,
    start_date: date = None,
    end_date: date = None,
    db = Depends(get_db)
):
    """Export attendance records as CSV"""
    return attendance_service.export_attendance_csv(db, student_id, subject, start_date, end_date)

@router.get("/export-pdf")
def export_attendance_pdf(
    student_id: str = None,
    subject: str = None,
    start_date: date = None,
    end_date: date = None,
    db = Depends(get_db)
):
    """Export attendance records as PDF"""
    return attendance_service.export_attendance_pdf(db, student_id, subject, start_date, end_date)

@router.post("/notify-low-attendance")
def notify_low_attendance(db = Depends(get_db)):
    """Mock sending email notifications to students with low attendance"""
    result = attendance_service.send_low_attendance_notifications(db)
    return {"message": f"Notifications sent to {result['count']} students", "count": result["count"]}

@router.get("/eligibility")
def get_exam_eligibility(
    subject: str = None,
    threshold: float = 75.0,
    db = Depends(get_db)
):
    """Get exam eligibility for all students based on attendance threshold"""
    students = list(db.students.find())
    results = []
    
    for stu in students:
        sid = str(stu["_id"])
        query = {"student_id": sid}
        if subject:
            query["subject"] = subject
        
        records = list(db.attendance.find(query))
        total = len(records)
        present = sum(1 for r in records if r.get("status") == "present")
        pct = round((present / total) * 100, 1) if total else 0
        
        # Get user info
        user = None
        if stu.get("user_id"):
            try:
                user = db.users.find_one({"_id": ObjectId(stu["user_id"])})
            except:
                pass
        
        results.append({
            "student_id": stu.get("student_id", ""),
            "name": user.get("full_name", "") if user else "",
            "department": stu.get("department", ""),
            "batch": stu.get("batch", ""),
            "percentage": pct,
            "total_classes": total,
            "present": present,
            "eligible": pct >= threshold
        })
    
    results.sort(key=lambda x: x["percentage"], reverse=True)
    return results


@router.get("/reports/summary")
def get_reports_summary(
    period: str = "weekly",
    db = Depends(get_db)
):
    """Get attendance summary grouped by week or month"""
    records = list(db.attendance.find().sort("class_date", -1).limit(5000))
    
    buckets = {}
    for r in records:
        cd = r.get("class_date")
        if not cd:
            continue
        if isinstance(cd, str):
            cd = datetime.fromisoformat(cd)
        
        if period == "monthly":
            key = cd.strftime("%Y-%m")
            label = cd.strftime("%b %Y")
        else:
            # ISO week
            iso = cd.isocalendar()
            key = f"{iso[0]}-W{iso[1]:02d}"
            label = f"Week {iso[1]}, {iso[0]}"
        
        if key not in buckets:
            buckets[key] = {"key": key, "label": label, "present": 0, "absent": 0, "late": 0, "total": 0}
        
        status = r.get("status", "absent")
        buckets[key][status] = buckets[key].get(status, 0) + 1
        buckets[key]["total"] += 1
    
    result = sorted(buckets.values(), key=lambda x: x["key"])
    for b in result:
        b["rate"] = round((b["present"] / b["total"]) * 100, 1) if b["total"] else 0
    
    return result[-12:]  # Last 12 periods


@router.get("/student/{student_id}/stats")
def get_student_attendance_stats(student_id: str, db = Depends(get_db)):
    """Get attendance statistics for a student"""
    return attendance_service.get_student_stats(db, student_id)


@router.get("/student/{student_id}/heatmap")
def get_student_heatmap(student_id: str, db = Depends(get_db)):
    """Get daily attendance data for heatmap (last 6 months)"""
    six_months_ago = datetime.utcnow() - __import__('datetime').timedelta(days=180)
    records = list(db.attendance.find({
        "student_id": student_id,
        "class_date": {"$gte": six_months_ago}
    }))
    
    day_map = {}
    for r in records:
        cd = r.get("class_date")
        if cd:
            day_str = cd.strftime("%Y-%m-%d") if isinstance(cd, datetime) else str(cd)[:10]
            if day_str not in day_map:
                day_map[day_str] = {"date": day_str, "present": 0, "absent": 0, "total": 0}
            if r.get("status") == "present":
                day_map[day_str]["present"] += 1
            else:
                day_map[day_str]["absent"] += 1
            day_map[day_str]["total"] += 1
    
    return sorted(day_map.values(), key=lambda x: x["date"])


@router.get("/student/{student_id}/prediction")
def get_student_prediction(student_id: str, db = Depends(get_db)):
    """Predict end-of-semester attendance using linear trend"""
    records = list(db.attendance.find({"student_id": student_id}))
    
    if len(records) < 3:
        return {"prediction": None, "message": "Not enough data (need at least 3 records)", "current": 0}
    
    total = len(records)
    present = sum(1 for r in records if r.get("status") == "present")
    current_pct = round((present / total) * 100, 1) if total else 0
    
    # Simple trend: calculate rolling attendance in chunks
    sorted_records = sorted(records, key=lambda r: r.get("class_date", datetime.min))
    chunk_size = max(3, total // 5)
    trend_points = []
    
    for i in range(0, total, chunk_size):
        chunk = sorted_records[i:i + chunk_size]
        if len(chunk) < 2:
            continue
        chunk_present = sum(1 for r in chunk if r.get("status") == "present")
        trend_points.append(round((chunk_present / len(chunk)) * 100, 1))
    
    if len(trend_points) >= 2:
        # Linear extrapolation
        n = len(trend_points)
        slope = (trend_points[-1] - trend_points[0]) / (n - 1) if n > 1 else 0
        predicted = round(trend_points[-1] + slope * 2, 1)
        predicted = max(0, min(100, predicted))
    else:
        predicted = current_pct
    
    return {
        "current": current_pct,
        "predicted": predicted,
        "total_classes": total,
        "present": present,
        "at_risk": predicted < 75,
        "trend": "improving" if len(trend_points) >= 2 and trend_points[-1] > trend_points[0] else "declining"
    }


# Dynamic routes MUST come AFTER all static routes
@router.get("/{attendance_id}", response_model=AttendanceResponse)
def get_attendance(attendance_id: str, db = Depends(get_db)):
    """Get attendance record by ID"""
    try:
        attendance = db.attendance.find_one({"_id": ObjectId(attendance_id)})
    except Exception:
        attendance = None
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return attendance_helper(attendance)


@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance(attendance_id: str, db = Depends(get_db)):
    """Delete an attendance record"""
    try:
        result = db.attendance.delete_one({"_id": ObjectId(attendance_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    return None

