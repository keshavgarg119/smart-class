import api from './api';

export const getAllUsers = async (skip = 0, limit = 100) => {
    const response = await api.get('/users/', { params: { skip, limit } });
    return response.data;
};

export const getUser = async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
};

export const createUser = async (userData) => {
    const response = await api.post('/users/', userData);
    return response.data;
};

export const updateUser = async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
};

export const deleteUser = async (id) => {
    await api.delete(`/users/${id}`);
};
