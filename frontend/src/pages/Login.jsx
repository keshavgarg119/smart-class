import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaLock, FaGraduationCap, FaUserCircle } from 'react-icons/fa';
import { ROUTES, USER_ROLES } from '../utils/constants';
import { validatePassword, PASSWORD_REQUIREMENTS_TEXT } from '../utils/validation';
import '../styles/auth.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: USER_ROLES.STUDENT,
        rememberMe: false
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            setError(passwordError);
            setLoading(false);
            return;
        }

        // Pass email as the "username" field — backend supports email OR username login
        const result = await login({ username: formData.email, password: formData.password });

        if (result.success) {
            // Redirect based on the actual role returned from the JWT, not the dropdown
            const role = result.user?.role;
            if (role === USER_ROLES.ADMIN) {
                navigate(ROUTES.ADMIN_DASHBOARD);
            } else if (role === USER_ROLES.TEACHER) {
                navigate(ROUTES.TEACHER_DASHBOARD);
            } else {
                navigate(ROUTES.STUDENT_DASHBOARD);
            }
        } else {
            setError(result.error || 'Login failed. Please try again.');
            setLoading(false);
        }
    };


    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <FaGraduationCap />
                    </div>
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Sign in to your account to continue</p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">
                            <FaEnvelope /> Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            placeholder="your.email@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <FaLock /> Password
                        </label>
                        <span className="password-hint-heading">Password Requirements:</span>
                        <small className="password-hint">
                            {PASSWORD_REQUIREMENTS_TEXT}
                        </small>
                        <input
                            type="password"
                            name="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <FaUserCircle /> Login As
                        </label>
                        <select
                            name="role"
                            className="form-select"
                            value={formData.role}
                            onChange={handleChange}
                            required
                        >
                            <option value={USER_ROLES.STUDENT}>Student</option>
                            <option value={USER_ROLES.TEACHER}>Teacher</option>
                            <option value={USER_ROLES.ADMIN}>Administrator</option>
                        </select>
                    </div>

                    <div className="form-checkbox">
                        <input
                            type="checkbox"
                            id="rememberMe"
                            name="rememberMe"
                            checked={formData.rememberMe}
                            onChange={handleChange}
                        />
                        <label htmlFor="rememberMe">Remember me</label>
                    </div>

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Don't have an account?{' '}
                        <Link to={ROUTES.REGISTER} className="auth-link">
                            Register here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
