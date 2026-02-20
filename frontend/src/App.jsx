import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import MarkAttendance from './pages/MarkAttendance';
import ViewAttendance from './pages/ViewAttendance';

// Constants
import { USER_ROLES } from './utils/constants';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Admin Routes */}
                    <Route
                        path="/admin/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Teacher Routes */}
                    <Route
                        path="/teacher/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                                <TeacherDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/mark-attendance"
                        element={
                            <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                                <MarkAttendance />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/view-attendance"
                        element={
                            <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                                <ViewAttendance />
                            </ProtectedRoute>
                        }
                    />

                    {/* Student Routes */}
                    <Route
                        path="/student/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                                <StudentDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Default Route */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
