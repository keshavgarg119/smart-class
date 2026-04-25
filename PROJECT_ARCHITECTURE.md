# Smart Attendance System: Project Architecture & Documentation

This document provides a comprehensive overview of how the Smart Attendance System is built, how the various components interact, and how data flows through the system.

---

## 1. High-Level Architecture
The project follows a modern **Client-Server architecture** with a clear separation of concerns:

- **Frontend**: A responsive Single Page Application (SPA) built with **React**.
- **Backend**: A high-performance REST API built with **FastAPI (Python)**.
- **Database**: A NoSQL document store using **MongoDB**.
- **AI Service**: Integrated face recognition logic using the `face_recognition` and `OpenCV` libraries.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18+ with Vite for fast bundling.
- **Styling**: Vanilla CSS with a custom design system (variables, glassmorphism, premium gradients).
- **Icons**: FontAwesome (`react-icons`).
- **Communication**: Axios for API calls.
- **State Management**: React Context API (`AuthContext`) for global user state.

### Backend
- **Framework**: FastAPI (Asynchronous Python).
- **Authentication**: JWT (JSON Web Tokens) with `OAuth2PasswordBearer`.
- **Database Driver**: PyMongo (MongoDB integration).
- **QR Engine**: `qrcode` and `python-jose` for secure, rotating tokens.

### AI & Biometrics
- **Library**: `face_recognition` (dlib-based).
- **Processing**: `numpy` for vector calculations and `PIL/OpenCV` for image handling.

---

## 3. Database Structure (MongoDB)
The system uses several collections to manage data. MongoDB's flexible schema allows for quick iteration.

| Collection | Purpose | Key Fields |
| :--- | :--- | :--- |
| `users` | Auth credentials | `username`, `hashed_password`, `role`, `email` |
| `students` | Profile & Biometrics | `user_id`, `student_id`, `batch`, `face_encoding` (binary), `face_image` |
| `attendance` | Daily records | `student_id`, `subject`, `status`, `timestamp`, `marked_via` |
| `leaves` | Leave applications | `student_id`, `reason`, `start_date`, `end_date`, `status` |
| `timetable` | Custom schedules | `subject`, `day`, `start_time`, `subgroup` |

---

## 4. Key Workflows & API Logic

### A. Authentication Flow
1. **Login**: The frontend sends credentials to `POST /auth/login`.
2. **JWT**: The backend verifies password and returns a JWT.
3. **Storage**: The frontend stores the token in `localStorage` and the user object in `AuthContext`.
4. **Authorization**: Every subsequent request includes the `Authorization: Bearer <token>` header.

### B. Biometric Enrollment (Student Registration)
1. **Upload**: Student uploads a face photo via `POST /student/upload-face`.
2. **Processing**: The backend uses AI to extract a **128-dimensional vector** (face encoding).
3. **Storage**: The image is saved to disk, and the numerical vector is stored in the student's MongoDB document.

### C. Marking Attendance (Face + Location)
1. **Camera**: The frontend captures a live frame from the webcam.
2. **Matching**: The backend compares the live encoding with the stored encoding using a distance threshold (usually 0.6).
3. **Geofencing**: The student's GPS is compared against the teacher's classroom coordinates using the **Haversine Formula**.
4. **Verification**: If both Face and GPS match, a record is inserted into the `attendance` collection.

### D. Rolling QR Attendance (The "Secured" Method)
1. **Generation**: The teacher starts a session (`POST /qr/generate`).
2. **Rotation**: The frontend calls the API every 10 seconds to get a new random token.
3. **Verification**: Students scan the QR. The backend validates the token and geofences the student within **25 meters** of the teacher.

---

## 5. API Call Structure
The frontend communicates with the backend via a centralized `api.js` service.

```javascript
// Example: Fetching Student Profile
const getProfile = async () => {
    const response = await api.get('/student/profile'); // Protected route
    return response.data;
};
```

**Route Organization:**
- `/auth`: Login, Logout, Register.
- `/student`: Profile management, attendance history, face upload.
- `/teacher`: Mark attendance (manual), view analytics, class management.
- `/qr`: Rolling QR generation and verification.
- `/timetable`: Integration with external ACM schedules and internal overrides.

---

## 6. How the Database is Attached
1. **Connection**: The backend uses a singleton pattern in `app/database.py` to maintain a persistent connection to the MongoDB URI.
2. **Dependency Injection**: FastAPI's `Depends(get_db)` ensures every route has access to the database session.
3. **Indexing**: Fields like `user_id` and `token` are indexed for high-speed lookups.

---

## 7. Project Directory Map
```text
/backend
├── app/
│   ├── routes/      # API Endpoints (Auth, Student, QR, etc.)
│   ├── services/    # Business logic (Face Recognition, QR logic)
│   ├── database.py  # MongoDB Connection
│   └── main.py      # FastAPI Entry point
└── uploads/         # Profile photos and face data

/frontend
├── src/
│   ├── components/  # Shared UI (Navbar, Sidebar)
│   ├── context/     # AuthContext (Global state)
│   ├── pages/       # View components (Dashboard, Profile)
│   ├── services/    # Axios API wrappers
│   └── styles/      # CSS Design System
└── public/          # Static assets
```

---

## 8. Why this Architecture?
- **Scalability**: By separating AI logic into a service layer, the system can handle thousands of students without slowing down.
- **Security**: Rotating QR codes and Geofencing prevent attendance fraud.
- **Speed**: FastAPI's async nature allows it to handle many concurrent face-matching requests efficiently.

---
*Documentation Generated for Smart Attendance System v2.0*
