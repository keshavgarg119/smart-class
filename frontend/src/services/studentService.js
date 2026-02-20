import api from './api';

/**
 * Get all students
 */
export const getAllStudents = async (skip = 0, limit = 100) => {
    const response = await api.get('/students/', { params: { skip, limit } });
    return response.data;
};

/**
 * Get a single student by ID
 */
export const getStudent = async (studentId) => {
    const response = await api.get(`/students/${studentId}`);
    return response.data;
};

/**
 * Create a new student record
 * data: { user_id, student_id, department, year, section, phone }
 */
export const createStudent = async (data) => {
    const response = await api.post('/students/', data);
    return response.data;
};

/**
 * Update student information
 */
export const updateStudent = async (studentId, data) => {
    const response = await api.put(`/students/${studentId}`, data);
    return response.data;
};

/**
 * Upload face image for a student
 */
export const uploadStudentFace = async (studentId, imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await api.post(`/students/${studentId}/upload-face`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

/**
 * Delete a student
 */
export const deleteStudent = async (studentId) => {
    await api.delete(`/students/${studentId}`);
};
