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
