import api from './api';

/**
 * Login — uses OAuth2 form data format required by FastAPI
 * Returns: { access_token, token_type }
 */
export const login = async (username, password) => {
    // FastAPI OAuth2 expects form data, not JSON
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
};

/**
 * Register a new user
 * userData: { email, username, full_name, password, role }
 */
export const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

/**
 * Decode JWT payload (no library needed — just parse the base64 middle section)
 */
export const decodeToken = (token) => {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
};
