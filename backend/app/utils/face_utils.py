import numpy as np
from PIL import Image
import io

def preprocess_image(image_bytes: bytes):
    """Preprocess image for face recognition"""
    try:
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize if image is too large (for performance)
        max_size = 1024
        if max(image.size) > max_size:
            ratio = max_size / max(image.size)
            new_size = tuple(int(dim * ratio) for dim in image.size)
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # Convert to numpy array
        image_array = np.array(image)
        return image_array
        
    except Exception as e:
        print(f"Error preprocessing image: {str(e)}")
        return None

def validate_face_encoding(encoding):
    """Validate face encoding"""
    if encoding is None:
        return False
    
    if not isinstance(encoding, np.ndarray):
        return False
    
    # Face encodings should be 128-dimensional
    if len(encoding) != 128:
        return False
    
    return True

def calculate_match_confidence(distance: float, tolerance: float = 0.6):
    """Calculate match confidence from face distance"""
    if distance > tolerance:
        return 0.0
    
    # Convert distance to confidence (0-1 scale)
    confidence = 1 - (distance / tolerance)
    return round(confidence, 4)
