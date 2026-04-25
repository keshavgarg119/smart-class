import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import ManageUsers from './pages/ManageUsers';
import ManageClasses from './pages/ManageClasses';
import SystemReports from './pages/SystemReports';
import TeacherDashboard from './pages/TeacherDashboard';
import ClassAnalytics from './pages/ClassAnalytics';
import StudentDashboard from './pages/StudentDashboard';
import AttendanceHistory from './pages/AttendanceHistory';
import AttendanceTrends from './pages/AttendanceTrends';
import MarkAttendance from './pages/MarkAttendance';
import ViewAttendance from './pages/ViewAttendance';
import StudentProfile from './pages/StudentProfile';
import BulkImport from './pages/BulkImport';
import ExamEligibility from './pages/ExamEligibility';
import LeaveApplication from './pages/LeaveApplication';
import ManageLeaves from './pages/ManageLeaves';
import Timetable from './pages/Timetable';
import QRAttendance from './pages/QRAttendance';
import QRScan from './pages/QRScan';
import ParentDashboard from './pages/ParentDashboard';

import { ThemeProvider } from './context/ThemeContext';

// Constants
import { USER_ROLES, ROUTES } from './utils/constants';

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<AuthPage />} />
                        <Route path="/register" element={<AuthPage />} />

                        {/* Admin Routes */}
                        <Route
                            path="/admin/dashboard"
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path={ROUTES.MANAGE_USERS}
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                                    <ManageUsers />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path={ROUTES.MANAGE_CLASSES}
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                                    <ManageClasses />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path={ROUTES.SYSTEM_REPORTS}
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                                    <SystemReports />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/bulk-import"
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                                    <BulkImport />
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
                            path={ROUTES.CLASS_ANALYTICS}
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                                    <ClassAnalytics />
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
                        <Route
                            path={ROUTES.ATTENDANCE_HISTORY}
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                                    <AttendanceHistory />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path={ROUTES.ATTENDANCE_TRENDS}
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                                    <AttendanceTrends />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/student/profile"
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                                    <StudentProfile />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/student/leave"
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                                    <LeaveApplication />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/teacher/leaves"
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                                    <ManageLeaves />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/teacher/eligibility"
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER, USER_ROLES.ADMIN]}>
                                    <ExamEligibility />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/timetable"
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN]}>
                                    <Timetable />
                                </ProtectedRoute>
                            }
                        />

                        {/* QR Attendance Routes */}
                        <Route
                            path="/teacher/qr-attendance"
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER, USER_ROLES.ADMIN]}>
                                    <QRAttendance />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/student/scan-qr"
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                                    <QRScan />
                                </ProtectedRoute>
                            }
                        />

                        {/* Parent Portal */}
                        <Route
                            path="/parent/dashboard"
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.PARENT]}>
                                    <ParentDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Default Route */}
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
