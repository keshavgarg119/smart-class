from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from datetime import datetime
from app.database import get_db
from app.utils.password_hash import get_password_hash
import csv
import io

router = APIRouter()

@router.post("/import-students")
async def import_students(file: UploadFile = File(...), db = Depends(get_db)):
    """
    Bulk import students from CSV file.
    CSV columns: full_name, email, student_id, department, year, batch, phone
    Auto-creates user accounts with default password 'Welcome@123'.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    contents = await file.read()
    decoded = contents.decode('utf-8-sig')  # Handle BOM
    reader = csv.DictReader(io.StringIO(decoded))
    
    created = 0
    skipped = 0
    errors = []
    
    for row_num, row in enumerate(reader, start=2):  # start=2 because row 1 is header
        try:
            full_name = row.get('full_name', '').strip()
            email = row.get('email', '').strip()
            student_id = row.get('student_id', '').strip()
            department = row.get('department', '').strip()
            year = row.get('year', '').strip()
            batch = row.get('batch', '').strip()
            phone = row.get('phone', '').strip()
            
            if not full_name or not email or not student_id:
                errors.append(f"Row {row_num}: Missing required fields (full_name, email, student_id)")
                skipped += 1
                continue
            
            # Check if user already exists
            if db.users.find_one({"email": email}):
                errors.append(f"Row {row_num}: Email '{email}' already exists")
                skipped += 1
                continue
            
            if db.students.find_one({"student_id": student_id}):
                errors.append(f"Row {row_num}: Student ID '{student_id}' already exists")
                skipped += 1
                continue
            
            # Create user
            username = email.split('@')[0]
            hashed_pw = get_password_hash("Welcome@123")
            
            user_doc = {
                "email": email,
                "username": username,
                "full_name": full_name,
                "hashed_password": hashed_pw,
                "role": "student",
                "is_active": True,
                "created_at": datetime.utcnow()
            }
            user_result = db.users.insert_one(user_doc)
            
            # Create student
            student_doc = {
                "user_id": str(user_result.inserted_id),
                "student_id": student_id,
                "department": department or None,
                "year": int(year) if year else None,
                "section": None,
                "batch": batch or None,
                "phone": phone or None,
                "created_at": datetime.utcnow(),
                "photo_url": None,
                "face_encoding": None
            }
            db.students.insert_one(student_doc)
            created += 1
            
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
            skipped += 1
    
    return {
        "message": f"Import complete: {created} created, {skipped} skipped",
        "created": created,
        "skipped": skipped,
        "errors": errors[:20]  # Return first 20 errors max
    }

@router.get("/sample-csv")
def get_sample_csv():
    """Return a sample CSV template for bulk import"""
    from fastapi.responses import StreamingResponse
    
    sample = "full_name,email,student_id,department,year,batch,phone\n"
    sample += "John Doe,john@example.com,CS2024001,Computer Science,2,2C1,9876543210\n"
    sample += "Jane Smith,jane@example.com,EC2024001,Electronics,3,3O1,9876543211\n"
    
    return StreamingResponse(
        io.StringIO(sample),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=student_import_template.csv"}
    )
