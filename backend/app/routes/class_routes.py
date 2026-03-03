from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson.objectid import ObjectId
from app.database import get_db
from app.schemas.class_schema import ClassCreate, ClassUpdate, ClassResponse

router = APIRouter()

def class_helper(cls) -> dict:
    if not cls:
        return None
    cls["id"] = str(cls["_id"])
    return cls

@router.get("/", response_model=List[ClassResponse])
def get_all_classes(skip: int = 0, limit: int = 100, db = Depends(get_db)):
    """Get all classes/subjects"""
    cursor = db.subjects.find().skip(skip).limit(limit)
    return [class_helper(c) for c in cursor]

@router.get("/{class_id}", response_model=ClassResponse)
def get_class(class_id: str, db = Depends(get_db)):
    """Get a specific class by ID"""
    try:
        cls = db.subjects.find_one({"_id": ObjectId(class_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Class not found")
        
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    return class_helper(cls)

@router.post("/", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(cls_data: ClassCreate, db = Depends(get_db)):
    """Create a new class/subject"""
    new_cls = cls_data.dict()
    result = db.subjects.insert_one(new_cls)
    new_cls["_id"] = result.inserted_id
    return class_helper(new_cls)

@router.put("/{class_id}", response_model=ClassResponse)
def update_class(class_id: str, cls_update: ClassUpdate, db = Depends(get_db)):
    """Update class details"""
    update_data = cls_update.dict(exclude_unset=True)
    if not update_data:
        cls = db.subjects.find_one({"_id": ObjectId(class_id)})
        return class_helper(cls)
        
    try:
        result = db.subjects.update_one({"_id": ObjectId(class_id)}, {"$set": update_data})
    except Exception:
        raise HTTPException(status_code=404, detail="Class not found")
        
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Class not found")
        
    cls = db.subjects.find_one({"_id": ObjectId(class_id)})
    return class_helper(cls)

@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(class_id: str, db = Depends(get_db)):
    """Delete a class"""
    try:
        result = db.subjects.delete_one({"_id": ObjectId(class_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Class not found")
        
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Class not found")
    return None
