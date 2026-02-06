# Smart Attendance System

An AI-powered attendance tracking system using face recognition technology. Built with FastAPI backend, React frontend, and Python-based face recognition.

## 🚀 Features

- **Face Recognition**: Automated attendance marking using advanced face recognition
- **Role-Based Access**: Separate dashboards for Admin, Teacher, and Student
- **Real-time Processing**: Instant face detection and recognition
- **Attendance Analytics**: Comprehensive statistics and reports
- **RESTful API**: Well-documented API endpoints
- **Modern UI**: Beautiful, responsive interface built with React

## 📋 System Requirements

### Backend
- Python 3.8+
- pip package manager

### Frontend
- Node.js 16+
- npm or yarn

## 🛠️ Installation

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
   - Copy `.env` file and update values
   - Set `DATABASE_URL` for your database
   - Update `SECRET_KEY` for production

5. Run the server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📁 Project Structure

```
smart-attendance-system/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py      # Application entry point
│   │   ├── models/      # Database models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utility functions
│   └── requirements.txt
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   └── services/    # API services
│   └── package.json
├── ai/                  # AI/ML scripts
│   ├── face_encoding.py
│   └── face_recognition.py
└── docs/               # Documentation
```

## 🎯 Usage

### For Students
1. Register an account with role "Student"
2. Upload face image for recognition
3. View attendance records and statistics

### For Teachers
1. Register with role "Teacher"
2. Mark attendance by uploading student photos
3. View class attendance reports

### For Admins
1. Register with role "Admin"
2. Manage students and teachers
3. View system-wide statistics
4. Generate reports

## 🔧 API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🧪 Testing

### Test Face Recognition
```bash
cd ai
python face_encoding.py <path_to_image>
python face_recognition.py ./encodings <test_image>
```

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Secure face encoding storage

## 📊 Database Schema

The system uses SQLAlchemy ORM with support for:
- SQLite (development)
- PostgreSQL (production)

Main tables:
- `users` - User accounts
- `students` - Student information
- `attendance` - Attendance records

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

Your Name - Initial work

## 🙏 Acknowledgments

- face_recognition library by Adam Geitgey
- FastAPI framework
- React community
- Vite build tool

## 📞 Support

For support, email kgarg2_be23@thapar.edu or open an issue in the repository.

## 🗺️ Roadmap

- [ ] Mobile app integration
- [ ] Liveness detection
- [ ] Multi-camera support
- [ ] Automated report generation
- [ ] Email notifications
- [ ] Export attendance to Excel/PDF
