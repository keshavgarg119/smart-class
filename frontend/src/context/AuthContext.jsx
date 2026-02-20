import { createContext, useContext, useState, useEffect } from 'react';
import { USER_ROLES } from '../utils/constants';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restore session from localStorage on page load
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        try {
            const data = await authService.login(credentials.username, credentials.password);

            // Decode JWT to get role and user id
            const payload = authService.decodeToken(data.access_token);

            // Store token first so /auth/me request can use it
            localStorage.setItem('token', data.access_token);

            // Fetch full user profile
            let fullName = payload?.sub || credentials.username;
            try {
                const api = (await import('../services/api')).default;
                const meRes = await api.get('/auth/me');
                fullName = meRes.data.full_name || meRes.data.username;
            } catch { /* non-critical */ }

            const userData = {
                id: payload?.id,
                username: payload?.sub,
                role: payload?.role,
                full_name: fullName,
            };

            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            return { success: true, user: userData };
        } catch (error) {
            const message = error.response?.data?.detail || 'Login failed';
            return { success: false, error: message };
        }
    };

    const register = async (userData) => {
        try {
            const payload = {
                email: userData.email,
                username: userData.email.split('@')[0],
                full_name: userData.name || userData.full_name || userData.username,
                password: userData.password,
                role: (userData.role || 'student').toLowerCase(),
            };

            await authService.register(payload);

            // Auto-login after registration
            return await login({
                username: userData.email,
                password: userData.password,
            });
        } catch (error) {
            const message = error.response?.data?.detail || 'Registration failed';
            return { success: false, error: message };
        }
    };


    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === USER_ROLES.ADMIN,
        isTeacher: user?.role === USER_ROLES.TEACHER,
        isStudent: user?.role === USER_ROLES.STUDENT,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
