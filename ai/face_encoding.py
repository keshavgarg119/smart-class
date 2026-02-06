"""
Face Encoding Script for Smart Attendance System

This script is used to encode faces from student images for recognition.
It processes images and generates face encodings that are stored in the database.
"""

import face_recognition
import numpy as np
from PIL import Image
import pickle
import os
import sys

def encode_face_from_file(image_path):
    """
    Encode a face from an image file
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Face encoding array or None if no face detected
    """
    try:
        # Load image
        image = face_recognition.load_image_file(image_path)
        
        # Find face locations
        face_locations = face_recognition.face_locations(image)
        
        if len(face_locations) == 0:
            print(f"No face detected in {image_path}")
            return None
        
        if len(face_locations) > 1:
            print(f"Warning: Multiple faces detected in {image_path}. Using the first one.")
        
        # Generate face encoding
        face_encodings = face_recognition.face_encodings(image, face_locations)
        
        if len(face_encodings) == 0:
            print(f"Could not encode face in {image_path}")
            return None
        
        return face_encodings[0]
        
    except Exception as e:
        print(f"Error encoding face from {image_path}: {str(e)}")
        return None

def save_encoding(encoding, output_path):
    """
    Save face encoding to a file
    
    Args:
        encoding: Face encoding array
        output_path: Path to save the encoding
    """
    try:
        with open(output_path, 'wb') as f:
            pickle.dump(encoding, f)
        print(f"Encoding saved to {output_path}")
        return True
    except Exception as e:
        print(f"Error saving encoding: {str(e)}")
        return False

def batch_encode_faces(input_directory, output_directory):
    """
    Encode all faces in a directory
    
    Args:
        input_directory: Directory containing student images
        output_directory: Directory to save encodings
    """
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)
    
    image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
    
    for filename in os.listdir(input_directory):
        file_ext = os.path.splitext(filename)[1].lower()
        
        if file_ext in image_extensions:
            image_path = os.path.join(input_directory, filename)
            encoding = encode_face_from_file(image_path)
            
            if encoding is not None:
                output_filename = os.path.splitext(filename)[0] + '.pkl'
                output_path = os.path.join(output_directory, output_filename)
                save_encoding(encoding, output_path)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python face_encoding.py <image_path_or_directory>")
        print("Example: python face_encoding.py student_photos/")
        sys.exit(1)
    
    input_path = sys.argv[1]
    
    if os.path.isfile(input_path):
        # Single file encoding
        encoding = encode_face_from_file(input_path)
        if encoding is not None:
            output_path = os.path.splitext(input_path)[0] + '_encoding.pkl'
            save_encoding(encoding, output_path)
    elif os.path.isdir(input_path):
        # Batch encoding
        output_dir = os.path.join(input_path, 'encodings')
        batch_encode_faces(input_path, output_dir)
    else:
        print(f"Error: {input_path} is not a valid file or directory")
        sys.exit(1)
