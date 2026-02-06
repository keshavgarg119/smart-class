"""
Face Recognition Script for Smart Attendance System

This script performs real-time face recognition for attendance marking.
It compares captured faces against stored encodings in the database.
"""

import face_recognition
import numpy as np
from PIL import Image
import pickle
import cv2
import sys
import os

class FaceRecognizer:
    """Face Recognition class for attendance system"""
    
    def __init__(self, tolerance=0.6):
        """
        Initialize face recognizer
        
        Args:
            tolerance: Face matching tolerance (lower is more strict)
        """
        self.tolerance = tolerance
        self.known_encodings = []
        self.known_names = []
    
    def load_encodings_from_directory(self, encodings_dir):
        """
        Load all face encodings from a directory
        
        Args:
            encodings_dir: Directory containing pickle files with encodings
        """
        if not os.path.exists(encodings_dir):
            print(f"Encodings directory {encodings_dir} not found")
            return
        
        for filename in os.listdir(encodings_dir):
            if filename.endswith('.pkl'):
                filepath = os.path.join(encodings_dir, filename)
                try:
                    with open(filepath, 'rb') as f:
                        encoding = pickle.load(f)
                        self.known_encodings.append(encoding)
                        # Use filename without extension as name
                        name = os.path.splitext(filename)[0]
                        self.known_names.append(name)
                        print(f"Loaded encoding for {name}")
                except Exception as e:
                    print(f"Error loading {filename}: {str(e)}")
    
    def recognize_face_from_image(self, image_path):
        """
        Recognize face from an image file
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary with recognition results
        """
        try:
            # Load image
            image = face_recognition.load_image_file(image_path)
            
            # Find face locations and encodings
            face_locations = face_recognition.face_locations(image)
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            if len(face_encodings) == 0:
                return {
                    'success': False,
                    'message': 'No face detected in image'
                }
            
            # Use the first detected face
            unknown_encoding = face_encodings[0]
            
            # Compare with known faces
            matches = face_recognition.compare_faces(
                self.known_encodings,
                unknown_encoding,
                tolerance=self.tolerance
            )
            
            face_distances = face_recognition.face_distance(
                self.known_encodings,
                unknown_encoding
            )
            
            if len(face_distances) > 0:
                best_match_index = np.argmin(face_distances)
                
                if matches[best_match_index]:
                    name = self.known_names[best_match_index]
                    confidence = 1 - face_distances[best_match_index]
                    
                    return {
                        'success': True,
                        'name': name,
                        'confidence': float(confidence),
                        'message': 'Face recognized successfully'
                    }
            
            return {
                'success': False,
                'message': 'Face not recognized'
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'Error: {str(e)}'
            }
    
    def recognize_from_webcam(self):
        """
        Real-time face recognition from webcam
        """
        video_capture = cv2.VideoCapture(0)
        
        print("Press 'q' to quit, 's' to capture and recognize")
        
        while True:
            ret, frame = video_capture.read()
            
            if not ret:
                break
            
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Find faces in current frame
            face_locations = face_recognition.face_locations(rgb_frame)
            
            # Draw rectangles around faces
            for (top, right, bottom, left) in face_locations:
                cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
            
            # Display frame
            cv2.imshow('Face Recognition - Press S to Capture', frame)
            
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q'):
                break
            elif key == ord('s'):
                # Recognize face on 's' press
                face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
                
                if len(face_encodings) > 0:
                    unknown_encoding = face_encodings[0]
                    matches = face_recognition.compare_faces(
                        self.known_encodings,
                        unknown_encoding,
                        tolerance=self.tolerance
                    )
                    face_distances = face_recognition.face_distance(
                        self.known_encodings,
                        unknown_encoding
                    )
                    
                    if len(face_distances) > 0:
                        best_match_index = np.argmin(face_distances)
                        
                        if matches[best_match_index]:
                            name = self.known_names[best_match_index]
                            confidence = 1 - face_distances[best_match_index]
                            print(f"Recognized: {name} (Confidence: {confidence:.2%})")
                        else:
                            print("Face not recognized")
                    else:
                        print("No matches found")
                else:
                    print("No face detected")
        
        video_capture.release()
        cv2.destroyAllWindows()

def main():
    """Main function"""
    if len(sys.argv) < 3:
        print("Usage: python face_recognition.py <encodings_dir> <image_path|webcam>")
        print("Example: python face_recognition.py ./encodings student.jpg")
        print("Example: python face_recognition.py ./encodings webcam")
        sys.exit(1)
    
    encodings_dir = sys.argv[1]
    target = sys.argv[2]
    
    # Initialize recognizer
    recognizer = FaceRecognizer(tolerance=0.6)
    recognizer.load_encodings_from_directory(encodings_dir)
    
    if target.lower() == 'webcam':
        # Real-time recognition
        recognizer.recognize_from_webcam()
    else:
        # Single image recognition
        result = recognizer.recognize_face_from_image(target)
        print("\nRecognition Result:")
        print(f"Success: {result['success']}")
        print(f"Message: {result['message']}")
        if result['success']:
            print(f"Name: {result['name']}")
            print(f"Confidence: {result['confidence']:.2%}")

if __name__ == "__main__":
    main()
