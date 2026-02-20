import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaGraduationCap, FaUserCircle, FaIdCard } from 'react-icons/fa';
import { ROUTES, USER_ROLES, DEPARTMENTS, SEMESTERS } from '../utils/constants';
import { validatePassword, PASSWORD_REQUIREMENTS_TEXT } from '../utils/validation';
import '../styles/auth.css';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: USER_ROLES.STUDENT,
        studentId: '',
        department: '',
        semester: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        setLoading(true);

        const result = await register(formData);

        if (result.success) {
            // Redirect based on the actual role returned from the JWT
            const role = result.user?.role;
            if (role === USER_ROLES.ADMIN) {
                navigate(ROUTES.ADMIN_DASHBOARD);
            } else if (role === USER_ROLES.TEACHER) {
                navigate(ROUTES.TEACHER_DASHBOARD);
            } else {
                navigate(ROUTES.STUDENT_DASHBOARD);
            }
        } else {
            setError(result.error || 'Registration failed. Please try again.');
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
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join our smart attendance system</p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">
                            <FaUser /> Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

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

                    <div className="form-row">
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
                                placeholder="Min. 8 characters"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <FaLock /> Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                className="form-input"
                                placeholder="Confirm password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <FaUserCircle /> Register As
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

                    {formData.role === USER_ROLES.STUDENT && (
                        <>
                            <div className="form-group">
                                <label className="form-label">
                                    <FaIdCard /> Student ID
                                </label>
                                <input
                                    type="text"
                                    name="studentId"
                                    className="form-input"
                                    placeholder="CS2024001"
                                    value={formData.studentId}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <select
                                        name="department"
                                        className="form-select"
                                        value={formData.department}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        {DEPARTMENTS.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Semester</label>
                                    <select
                                        name="semester"
                                        className="form-select"
                                        value={formData.semester}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Semester</option>
                                        {SEMESTERS.map(sem => (
                                            <option key={sem} value={sem}>{sem}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to={ROUTES.LOGIN} className="auth-link">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
