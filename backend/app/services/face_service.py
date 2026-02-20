from fastapi import UploadFile
import numpy as np
from sqlalchemy.orm import Session
from app.models.student_model import Student
from app.config import settings
import pickle

# Lazy import – face_recognition may not be installed
try:
    import face_recognition
except ImportError:
    face_recognition = None

async def encode_face(file: UploadFile):
    """Encode face from uploaded image"""
    if face_recognition is None:
        raise ImportError("face_recognition library is not installed")
    try:
        # Read image file
        contents = await file.read()
        
        # Convert to numpy array
        import io
        from PIL import Image
        image = Image.open(io.BytesIO(contents))
        image_array = np.array(image)
        
        # Find face locations
        face_locations = face_recognition.face_locations(image_array)
        
        if len(face_locations) == 0:
            return None
        
        # Get face encoding (use first face if multiple detected)
        face_encodings = face_recognition.face_encodings(image_array, face_locations)
        
        if len(face_encodings) == 0:
            return None
        
        # Serialize encoding to bytes
        encoding_bytes = pickle.dumps(face_encodings[0])
        return encoding_bytes
        
    except Exception as e:
        print(f"Error encoding face: {str(e)}")
        return None

async def recognize_face(file: UploadFile, db: Session):
    """Recognize face from uploaded image"""
    if face_recognition is None:
        return {"success": False, "message": "face_recognition library is not installed"}
    try:
        # Encode the uploaded face
        uploaded_encoding_bytes = await encode_face(file)
        
        if uploaded_encoding_bytes is None:
            return {"success": False, "message": "No face detected in image"}
        
        uploaded_encoding = pickle.loads(uploaded_encoding_bytes)
        
        # Get all students with face encodings
        students = db.query(Student).filter(Student.face_encoding.isnot(None)).all()
        
        if not students:
            return {"success": False, "message": "No registered faces in database"}
        
        best_match = None
        best_distance = float('inf')
        
        # Compare with all registered faces
        for student in students:
            stored_encoding = pickle.loads(student.face_encoding)
            
            # Calculate face distance
            distance = face_recognition.face_distance([stored_encoding], uploaded_encoding)[0]
            
            if distance < best_distance:
                best_distance = distance
                best_match = student
        
        # Check if match is within tolerance
        if best_distance <= settings.FACE_RECOGNITION_TOLERANCE:
            confidence = 1 - best_distance
            return {
                "success": True,
                "student_id": best_match.id,
                "student_roll": best_match.student_id,
                "confidence": confidence,
                "message": "Face recognized successfully"
            }
        else:
            return {"success": False, "message": "Face not recognized"}
            
    except Exception as e:
        print(f"Error recognizing face: {str(e)}")
        return {"success": False, "message": f"Error: {str(e)}"}
