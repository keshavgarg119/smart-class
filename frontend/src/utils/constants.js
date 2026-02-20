// Application Constants

export const USER_ROLES = {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student'
};

export const ATTENDANCE_STATUS = {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    LEAVE: 'leave'
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const ROUTES = {
    // Public routes
    LOGIN: '/login',
    REGISTER: '/register',

    // Admin routes
    ADMIN_DASHBOARD: '/admin/dashboard',
    MANAGE_USERS: '/admin/users',
    MANAGE_CLASSES: '/admin/classes',
    SYSTEM_REPORTS: '/admin/reports',

    // Teacher routes
    TEACHER_DASHBOARD: '/teacher/dashboard',
    MARK_ATTENDANCE: '/teacher/mark-attendance',
    VIEW_ATTENDANCE: '/teacher/view-attendance',
    CLASS_ANALYTICS: '/teacher/analytics',

    // Student routes
    STUDENT_DASHBOARD: '/student/dashboard',
    ATTENDANCE_HISTORY: '/student/history',
    ATTENDANCE_TRENDS: '/student/trends'
};

export const DEPARTMENTS = [
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical',
    'Chemical'
];

export const SEMESTERS = [
    'Semester 1',
    'Semester 2',
    'Semester 3',
    'Semester 4',
    'Semester 5',
    'Semester 6',
    'Semester 7',
    'Semester 8'
];

export const ATTENDANCE_THRESHOLD = {
    MINIMUM: 75,
    WARNING: 80,
    GOOD: 90
};
