from fastapi import UploadFile
import numpy as np
import cv2
from app.config import settings
import pickle

# Lazy import – face_recognition may not be installed
try:
    import face_recognition
    face_recognition_imported = True
except ImportError:
    face_recognition = None
    face_recognition_imported = False

import logging
import os

# Setup detailed logging for face service
log_path = os.path.join(os.path.dirname(__file__), '..', '..', 'face_debug.log')
logging.basicConfig(
    filename=log_path,
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if face_recognition_imported:
    try:
        logger.info(f"face_recognition imported from {face_recognition.__file__}")
    except Exception:
        logger.info("face_recognition imported successfully")
else:
    logger.error("face_recognition library is not installed or import failed")

async def encode_face(file: UploadFile):
    """Encode face from uploaded image"""
    if face_recognition is None:
        logger.error("face_recognition library is not installed")
        raise ImportError("face_recognition library is not installed")
    try:
        # Read image file
        contents = await file.read()
        logger.info(f"Encoding face: Read {len(contents)} bytes")
        
        # Convert to numpy array
        import io
        from PIL import Image
        image = Image.open(io.BytesIO(contents))
        image_array = np.array(image.convert('RGB'))
        
        # Find face locations
        face_locations = face_recognition.face_locations(image_array)
        logger.info(f"Found {len(face_locations)} faces during encoding")
        
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
        logger.exception(f"Error encoding face: {str(e)}")
        return None

async def recognize_face(file: UploadFile, db):
    """Recognize face from uploaded image"""
    if face_recognition is None:
        logger.error("face_recognition library is not installed")
        return {"success": False, "message": "face_recognition library is not installed"}
    try:
        # Read file contents ONCE
        contents = await file.read()
        logger.info(f"Recognizing face: Read {len(contents)} bytes")
        
        if not contents:
            logger.warning("Empty image file received")
            return {"success": False, "message": "Empty image file received"}
        
        # Decode for face encoding using PIL
        import io
        from PIL import Image
        image = Image.open(io.BytesIO(contents))
        # Ensure RGB
        image_array = np.array(image.convert('RGB'))
        
        # Find and encode the face
        face_locations = face_recognition.face_locations(image_array)
        logger.info(f"Detected {len(face_locations)} face(s)")
        
        if len(face_locations) == 0:
            return {"success": False, "message": "No face detected in image. Please ensure your face is clearly visible and within the frame."}
        
        face_encodings = face_recognition.face_encodings(image_array, face_locations)
        if len(face_encodings) == 0:
            return {"success": False, "message": "Face detected but could not be encoded. Try better lighting."}
        
        uploaded_encoding = face_encodings[0]
        
        # Liveness check: Verify image is not too blurry (e.g., printed photo)
        image_bytes = np.frombuffer(contents, np.uint8)
        cv_image = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)
        
        if cv_image is not None:
            gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            fm = cv2.Laplacian(gray, cv2.CV_64F).var()
            logger.info(f"Liveness check: Laplacian variance = {fm}")
            
            if fm < 5: # Lowered from 40 to 5 to accommodate lower quality cameras/lighting
                logger.warning(f"Liveness check failed: fm={fm}")
                return {"success": False, "message": "Image is too blurry. Please stay still and ensure good lighting."}
        else:
            logger.warning("OpenCV failed to decode image for liveness check")
        
        # Get all students with face encodings
        students = list(db.students.find({"face_encoding": {"$ne": None}}))
        logger.info(f"Comparing with {len(students)} registered students")
        
        if not students:
            return {"success": False, "message": "No registered faces in database. Please register your face first."}
        
        best_match = None
        best_distance = float('inf')
        
        # Compare with all registered faces
        for student in students:
            try:
                stored_encoding = pickle.loads(student["face_encoding"])
                
                # Calculate face distance
                distance = face_recognition.face_distance([stored_encoding], uploaded_encoding)[0]
                
                if distance < best_distance:
                    best_distance = distance
                    best_match = student
            except Exception as e:
                logger.error(f"Error comparing with student {student.get('_id')}: {str(e)}")
                continue
        
        logger.info(f"Best distance: {best_distance}")
        
        # Check if match is within tolerance
        if best_distance <= settings.FACE_RECOGNITION_TOLERANCE:
            confidence = 1 - best_distance
            logger.info(f"Match found! Student: {best_match.get('student_id')}, Confidence: {confidence}")
            return {
                "success": True,
                "student_id": str(best_match["_id"]),
                "student_roll": best_match.get("student_id", ""),
                "confidence": confidence,
                "message": "Face recognized successfully"
            }
        else:
            logger.warning(f"No match found. Best distance {best_distance} > tolerance {settings.FACE_RECOGNITION_TOLERANCE}")
            return {"success": False, "message": "Face not recognized. Please ensure you are registered and try again."}
            
    except Exception as e:
        logger.exception(f"Error recognizing face: {str(e)}")
        return {"success": False, "message": f"An error occurred during face recognition: {str(e)}"}


