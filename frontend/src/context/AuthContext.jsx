import { createContext, useContext, useState, useEffect } from 'react';
import { USER_ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in (from localStorage)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        try {
            // TODO: Replace with actual API call
            // For now, mock login
            const mockUser = {
                id: '1',
                name: credentials.email.split('@')[0],
                email: credentials.email,
                role: credentials.role || USER_ROLES.STUDENT,
                department: 'Computer Science',
                studentId: 'CS2024001'
            };

            setUser(mockUser);
            localStorage.setItem('user', JSON.stringify(mockUser));
            localStorage.setItem('token', 'mock-jwt-token');

            return { success: true, user: mockUser };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Login failed' };
        }
    };

    const register = async (userData) => {
        try {
            // TODO: Replace with actual API call
            const newUser = {
                id: Date.now().toString(),
                ...userData
            };

            setUser(newUser);
            localStorage.setItem('user', JSON.stringify(newUser));
            localStorage.setItem('token', 'mock-jwt-token');

            return { success: true, user: newUser };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Registration failed' };
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
        isStudent: user?.role === USER_ROLES.STUDENT
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
