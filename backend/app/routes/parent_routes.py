"""
Parent Portal Routes
GET /parent/my-students    — Get linked student(s) for the logged-in parent
GET /parent/attendance/{student_id} — Get attendance summary for a linked student
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from collections import defaultdict

from app.database import get_db
from app.services import auth_service

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    return auth_service.get_current_user(db, token)


@router.get("/my-students")
def get_my_students(user=Depends(_get_current_user), db=Depends(get_db)):
    """
    Returns all students linked to the logged-in parent via `linked_student_rollno`
    stored in the user document.
    """
    if user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Only parents can access this endpoint")

    rollno = user.get("linked_student_rollno")
    if not rollno:
        return {"students": []}

    # Look up student by roll number field
    students = list(db.students.find({"roll_number": rollno}))
    result = []
    for s in students:
        student_user = db.users.find_one({"_id": s.get("user_id")}) if s.get("user_id") else None
        result.append({
            "student_id": str(s["_id"]),
            "roll_number": s.get("roll_number", ""),
            "full_name": s.get("full_name") or (student_user.get("full_name") if student_user else ""),
            "department": s.get("department", ""),
            "semester": s.get("semester", ""),
        })
    return {"students": result}


@router.get("/attendance/{student_id}")
def get_student_attendance(student_id: str, user=Depends(_get_current_user), db=Depends(get_db)):
    """
    Returns attendance summary for a specific student.
    Parent must have the linked_student_rollno that matches this student.
    """
    if user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Only parents can access this endpoint")

    from bson import ObjectId

    try:
        student_doc = db.students.find_one({"_id": ObjectId(student_id)})
    except Exception:
        student_doc = None

    if not student_doc:
        raise HTTPException(status_code=404, detail="Student not found")

    # Authorization: parent must own this student
    if student_doc.get("roll_number") != user.get("linked_student_rollno"):
        raise HTTPException(status_code=403, detail="You are not authorized to view this student's data")

    # Fetch all attendance records for this student
    records = list(db.attendance.find({"student_id": student_id}))

    # Build subject-wise stats
    subject_stats: dict = defaultdict(lambda: {"present": 0, "total": 0})
    recent_absences = []

    for r in records:
        subj = r.get("subject", "Unknown")
        subject_stats[subj]["total"] += 1
        if r.get("status") == "present":
            subject_stats[subj]["present"] += 1
        else:
            recent_absences.append({
                "date": r.get("date", ""),
                "subject": subj,
                "status": r.get("status", "absent"),
            })

    # Overall percentage
    total = sum(v["total"] for v in subject_stats.values())
    total_present = sum(v["present"] for v in subject_stats.values())
    overall_pct = round((total_present / total * 100), 1) if total > 0 else 0

    subject_breakdown = [
        {
            "subject": subj,
            "present": vals["present"],
            "total": vals["total"],
            "percentage": round(vals["present"] / vals["total"] * 100, 1) if vals["total"] > 0 else 0,
        }
        for subj, vals in subject_stats.items()
    ]

    # Sort recent absences by date desc, take last 10
    recent_absences.sort(key=lambda x: x["date"], reverse=True)

    student_user = None
    if student_doc.get("user_id"):
        try:
            student_user = db.users.find_one({"_id": ObjectId(str(student_doc["user_id"]))})
        except Exception:
            pass

    return {
        "student": {
            "student_id": student_id,
            "full_name": student_doc.get("full_name") or (student_user.get("full_name") if student_user else ""),
            "roll_number": student_doc.get("roll_number", ""),
            "department": student_doc.get("department", ""),
            "semester": student_doc.get("semester", ""),
        },
        "overall_percentage": overall_pct,
        "total_classes": total,
        "total_present": total_present,
        "subject_breakdown": sorted(subject_breakdown, key=lambda x: x["subject"]),
        "recent_absences": recent_absences[:10],
    }
