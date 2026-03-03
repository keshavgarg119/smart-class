from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from bson.objectid import ObjectId
from app.database import get_db

router = APIRouter()

@router.post("/")
def create_leave(leave: dict, db = Depends(get_db)):
    """Student applies for leave"""
    leave_doc = {
        "student_id": leave.get("student_id"),
        "student_name": leave.get("student_name", ""),
        "start_date": leave.get("start_date"),
        "end_date": leave.get("end_date"),
        "reason": leave.get("reason", ""),
        "status": "pending",
        "created_at": datetime.utcnow(),
        "reviewed_by": None,
        "reviewed_at": None
    }
    result = db.leaves.insert_one(leave_doc)
    leave_doc["id"] = str(result.inserted_id)
    leave_doc["_id"] = str(result.inserted_id)
    return leave_doc

@router.get("/")
def get_leaves(
    student_id: str = None,
    status_filter: str = None,
    db = Depends(get_db)
):
    """Get leave requests with optional filters"""
    query = {}
    if student_id:
        query["student_id"] = student_id
    if status_filter:
        query["status"] = status_filter
    
    leaves = list(db.leaves.find(query).sort("created_at", -1))
    for l in leaves:
        l["id"] = str(l["_id"])
        l["_id"] = str(l["_id"])
    return leaves

@router.put("/{leave_id}/review")
def review_leave(leave_id: str, review: dict, db = Depends(get_db)):
    """Teacher approves or rejects a leave request"""
    new_status = review.get("status")  # 'approved' or 'rejected'
    if new_status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    
    result = db.leaves.update_one(
        {"_id": ObjectId(leave_id)},
        {"$set": {
            "status": new_status,
            "reviewed_by": review.get("reviewed_by", ""),
            "reviewed_at": datetime.utcnow()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    return {"message": f"Leave {new_status}", "id": leave_id}
