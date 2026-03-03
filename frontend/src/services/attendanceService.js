import api from './api';

/**
 * Get attendance statistics for a student
 * Returns: { total_classes, present, absent, percentage, subjects: [...] }
 */
export const getStudentStats = async (studentId) => {
    const response = await api.get(`/attendance/student/${studentId}/stats`);
    return response.data;
};

/**
 * Get attendance records with optional filters
 */
export const getAttendanceRecords = async ({ studentId, startDate, endDate, skip = 0, limit = 50 } = {}) => {
    const params = { skip, limit };
    if (studentId) params.student_id = studentId;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await api.get('/attendance/', { params });
    return response.data;
};

/**
 * Mark attendance manually
 * data: { student_id, subject, status, marked_by, remarks }
 */
export const markAttendance = async (data) => {
    const response = await api.post('/attendance/', data);
    return response.data;
};

/**
 * Mark attendance via face recognition (multipart upload)
 */
export const markAttendanceByFace = async (imageFile, subject, markedBy) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    if (subject) formData.append('subject', subject);
    if (markedBy) formData.append('marked_by', markedBy);

    const response = await api.post('/attendance/mark-by-face', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

/**
 * Delete an attendance record
 */
export const deleteAttendance = async (attendanceId) => {
    await api.delete(`/attendance/${attendanceId}`);
};

/**
 * Export attendance records as CSV
 */
export const exportAttendanceCSV = async ({ studentId, subject, startDate, endDate } = {}) => {
    const params = {};
    if (studentId) params.student_id = studentId;
    if (subject) params.subject = subject;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await api.get('/attendance/export', {
        params,
        responseType: 'blob' // Important for file downloads
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a'); // use 'a' instead of 'link' for downloading
    link.href = url;
    link.setAttribute('download', 'attendance_export.csv');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
};

/**
 * Export attendance records as PDF
 */
export const exportAttendancePDF = async ({ studentId, subject, startDate, endDate } = {}) => {
    const params = {};
    if (studentId) params.student_id = studentId;
    if (subject) params.subject = subject;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await api.get('/attendance/export-pdf', {
        params,
        responseType: 'blob' // Important for file downloads
    });

    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'attendance_report.pdf');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
};

/**
 * Trigger low attendance mock email notifications
 */
export const notifyLowAttendance = async () => {
    const response = await api.post('/attendance/notify-low-attendance');
    return response.data;
};
