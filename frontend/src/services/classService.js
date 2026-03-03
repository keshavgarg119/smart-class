import api from './api';

export const getAllClasses = async (skip = 0, limit = 100) => {
    const response = await api.get('/classes/', { params: { skip, limit } });
    return response.data;
};

export const getClass = async (id) => {
    const response = await api.get(`/classes/${id}`);
    return response.data;
};

export const createClass = async (classData) => {
    const response = await api.post('/classes/', classData);
    return response.data;
};

export const updateClass = async (id, classData) => {
    const response = await api.put(`/classes/${id}`, classData);
    return response.data;
};

export const deleteClass = async (id) => {
    await api.delete(`/classes/${id}`);
};
