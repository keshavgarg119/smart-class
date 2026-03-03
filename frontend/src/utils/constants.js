// Application Constants

export const USER_ROLES = {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student',
    PARENT: 'parent',
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

// All valid subgroups from ACM Thapar Timetable (2025-2026 EVEN semester)
// Source: https://timetable.acmthapar.in/
export const ACM_SUBGROUPS = [
    "1A11", "1A12", "1A13", "1A14", "1A15", "1A16", "1A17", "1A18",
    "1A21", "1A22", "1A23", "1A24", "1A25", "1A26", "1A27", "1A28",
    "1A31", "1A32", "1A33", "1A34", "1A35", "1A36", "1A37", "1A38",
    "1A41", "1A42", "1A43", "1A44", "1A45",
    "1A51", "1A52", "1A53", "1A54", "1A55",
    "1A61", "1A62", "1A63", "1A64", "1A65",
    "1A71", "1A72", "1A73", "1A74", "1A75",
    "1A81", "1A82", "1A83", "1A84", "1A85",
    "1A91", "1A92", "1A93", "1A94", "1A95",
    "1B11", "1B12", "1B13", "1B14", "1B15", "1B16", "1B17", "1B18",
    "1B21", "1B22", "1B23", "1B24", "1B25", "1B26", "1B27", "1B28",
    "1B31", "1B32", "1B33", "1B34", "1B35", "1B36", "1B37", "1B38",
    "1B41", "1B42", "1B43", "1B44", "1B45",
    "1B51", "1B52", "1B53", "1B54", "1B55",
    "1B61", "1B62", "1B63", "1B64", "1B65",
    "1B71", "1B72", "1B73", "1B74", "1B75",
    "1B81", "1B82", "1B83", "1B84", "1B85",
    "1B91", "1B92", "1B93", "1B94", "1B95",
    "1G11", "1G12", "1G13", "1G14",
    "1J11",
    "1R11", "1R12", "1R13",
    "1X11", "1X12", "1X13", "1X14",
    "1X21", "1X22", "1X23", "1X24",
    "2A11", "2A12",
    "2B11", "2B12", "2B13",
    "2C11", "2C12", "2C13", "2C14", "2C15", "2C16", "2C17", "2C18",
    "2C21", "2C22", "2C23", "2C24", "2C25",
    "2C31", "2C32", "2C33", "2C34", "2C35",
    "2C41", "2C42", "2C43", "2C44", "2C45",
    "2C51", "2C52", "2C53", "2C54", "2C55",
    "2C61", "2C62", "2C63", "2C64", "2C65",
    "2C71", "2C72", "2C73", "2C74", "2C75",
    "2C81", "2C82",
    "2D11", "2D12", "2D13",
    "2E11", "2E12",
    "2F11", "2F12", "2F13", "2F14",
    "2F21", "2F22", "2F23",
    "2F31", "2F32", "2F33",
    "2G11", "2G12", "2G13", "2G14",
    "2H11", "2H12", "2H13",
    "2H21", "2H22", "2H23",
    "2I11", "2I12", "2I13",
    "2J11", "2J12",
    "2O11", "2O12", "2O13", "2O14",
    "2O21", "2O22", "2O23", "2O24",
    "2O31", "2O32", "2O33", "2O34",
    "2Q11", "2Q12", "2Q13", "2Q14", "2Q15",
    "2Q21", "2Q22", "2Q23", "2Q24", "2Q25",
    "2Q31", "2Q32", "2Q33", "2Q34", "2Q35",
    "2Q41",
    "2R11", "2R12", "2R13",
    "2S11", "2S12", "2S13", "2S14", "2S15",
    "2U11",
    "2V11", "2V12", "2V13",
    "2W11", "2W12", "2W13", "2W14",
    "2X11", "2X12", "2X13", "2X14", "2X15",
    "3A11", "3A12",
    "3B11", "3B12", "3B13",
    "3C11", "3C12", "3C13", "3C14", "3C15", "3C16", "3C17", "3C18",
    "3C21", "3C22", "3C23", "3C24", "3C25",
    "3C31", "3C32", "3C33", "3C34", "3C35",
    "3C41", "3C42", "3C43", "3C44", "3C45",
    "3C51", "3C52", "3C53", "3C54", "3C55",
    "3C61", "3C62", "3C63", "3C64", "3C65",
    "3C71", "3C72", "3C73", "3C74", "3C75",
    "3D11", "3D12", "3D13", "3D14",
    "3E11", "3E12", "3E13",
    "3F11", "3F12", "3F13", "3F14",
    "3F21", "3F22", "3F23", "3F24",
    "3G11", "3G12", "3G13", "3G14", "3G15",
    "3H11", "3H12", "3H13",
    "3H21", "3H22", "3H23",
    "3I11", "3I12", "3I13",
    "3J11",
    "3O11", "3O12", "3O13", "3O14",
    "3O21", "3O22", "3O23", "3O24",
    "3O31", "3O32", "3O33",
    "3P11", "3P12", "3P13", "3P14",
    "3Q11", "3Q12", "3Q13", "3Q14", "3Q15", "3Q16",
    "3Q21", "3Q22", "3Q23", "3Q24", "3Q25", "3Q26",
    "3R11", "3R12", "3R13",
    "3S11", "3S12", "3S13", "3S14", "3S15",
    "3U11",
    "3V11", "3V12", "3V13",
    "3W11", "3W12", "3W13",
    "4A11",
    "4B11", "4B12", "4B13",
    "4G11", "4G12", "4G13", "4G14",
    "4H11"
];

// Legacy exports for backwards compatibility
export const BATCHES = ACM_SUBGROUPS;

// Department code mapping (used for display labels)
export const DEPT_CONFIG = {
    'A': 'Group A',
    'B': 'Group B',
    'C': 'Computer Science',
    'D': 'Group D',
    'E': 'Electrical',
    'F': 'Group F',
    'G': 'Group G',
    'H': 'Chemical',
    'I': 'Information Technology',
    'J': 'Group J',
    'O': 'Electronics',
    'P': 'Group P',
    'Q': 'Group Q',
    'R': 'Group R',
    'S': 'Group S',
    'U': 'Group U',
    'V': 'Civil',
    'W': 'Group W',
    'X': 'Group X'
};

/**
 * Filter ACM subgroups based on semester (academic year).
 * Semester 1-2 → year 1, Semester 3-4 → year 2, etc.
 * @param {number|string} semester - Semester number (1-8)
 * @param {string} [department] - Optional: not used anymore (kept for API compat)
 * @returns {string[]} Array of valid ACM subgroup codes
 */
export const generateBatches = (semester, department) => {
    if (!semester) return ACM_SUBGROUPS;

    const semNum = typeof semester === 'string' ? parseInt(semester) : semester;
    const academicYear = Math.ceil(semNum / 2);

    // Filter subgroups that start with this year number
    return ACM_SUBGROUPS.filter(s => s.startsWith(String(academicYear)));
};

export const ATTENDANCE_THRESHOLD = {
    MINIMUM: 75,
    WARNING: 80,
    GOOD: 90
};
