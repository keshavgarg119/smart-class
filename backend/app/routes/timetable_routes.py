from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson.objectid import ObjectId
from app.database import get_db

router = APIRouter()

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
TIME_SLOTS = [
    "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
    "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00",
    "16:00-17:00"
]


@router.get("/config")
def get_timetable_config():
    """Return available days and time slots"""
    return {"days": DAYS, "time_slots": TIME_SLOTS}


# ---- ACM Timetable (real Thapar data) ----
import json
import os

_acm_data = None

def _load_acm_data():
    global _acm_data
    if _acm_data is None:
        data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'timetable_data.json')
        if os.path.exists(data_path):
            with open(data_path, 'r', encoding='utf-8') as f:
                _acm_data = json.load(f)
        else:
            _acm_data = {}
    return _acm_data


@router.get("/acm/subgroups")
def get_acm_subgroups():
    """Return all available subgroups from ACM timetable data"""
    data = _load_acm_data()
    return {"subgroups": sorted(data.keys()), "count": len(data)}


@router.get("/acm/{subgroup}")
def get_acm_timetable(subgroup: str):
    """Get the ACM timetable for a specific subgroup"""
    data = _load_acm_data()
    if subgroup not in data:
        raise HTTPException(status_code=404, detail=f"Subgroup '{subgroup}' not found")
    return data[subgroup]


@router.post("/")
def create_timetable_entry(entry: dict, db = Depends(get_db)):
    """Create a timetable slot"""
    doc = {
        "day": entry.get("day"),
        "time_slot": entry.get("time_slot"),
        "subject": entry.get("subject", ""),
        "teacher": entry.get("teacher", ""),
        "room": entry.get("room", ""),
        "department": entry.get("department", ""),
        "semester": entry.get("semester"),
        "batch": entry.get("batch", ""),
        "subgroup": entry.get("subgroup", ""),
        "type": entry.get("type", "lecture"),  # lecture, lab, tutorial
        "created_at": datetime.utcnow()
    }
    
    # Check for conflicts
    conflict = db.timetable.find_one({
        "day": doc["day"],
        "time_slot": doc["time_slot"],
        "department": doc["department"],
        "semester": doc["semester"],
        "batch": doc["batch"]
    })
    if conflict:
        raise HTTPException(status_code=400, detail="Time slot already occupied for this batch")
    
    result = db.timetable.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.get("/")
def get_timetable(
    department: str = None,
    semester: int = None,
    batch: str = None,
    subgroup: str = None,
    db = Depends(get_db)
):
    """Get timetable entries with filters"""
    query = {}
    if department:
        query["department"] = department
    if semester:
        query["semester"] = semester
    if batch:
        # Include entries for this specific batch AND entries with no batch (common classes)
        query["$or"] = [{"batch": batch}, {"batch": ""}, {"batch": None}]
    
    entries = list(db.timetable.find(query))
    for e in entries:
        e["id"] = str(e["_id"])
        e["_id"] = str(e["_id"])
    return entries


@router.put("/{entry_id}")
def update_timetable_entry(entry_id: str, entry: dict, db = Depends(get_db)):
    """Update a timetable entry"""
    update_data = {k: v for k, v in entry.items() if k not in ["id", "_id"]}
    result = db.timetable.update_one(
        {"_id": ObjectId(entry_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Updated", "id": entry_id}


@router.delete("/{entry_id}")
def delete_timetable_entry(entry_id: str, db = Depends(get_db)):
    """Delete a timetable entry"""
    result = db.timetable.delete_one({"_id": ObjectId(entry_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Deleted"}
