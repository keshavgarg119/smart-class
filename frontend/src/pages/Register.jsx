import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaGraduationCap, FaUserCircle, FaIdCard, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';
import { ROUTES, USER_ROLES, DEPARTMENTS, SEMESTERS, generateBatches } from '../utils/constants';
import { validatePassword, PASSWORD_REQUIREMENTS_TEXT } from '../utils/validation';
import * as authService from '../services/authService';
import '../styles/auth.css';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [step, setStep] = useState(1); // 1 = form, 2 = OTP verification
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: USER_ROLES.STUDENT,
        studentId: '',
        department: '',
        semester: '',
        batch: '',
        linkedStudentRollno: '',
    });
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            // Reset batch when department or semester changes
            if (name === 'department' || name === 'semester') {
                updated.batch = '';
            }
            return updated;
        });
    };

    // Dynamic batch list based on semester + department
    const availableBatches = generateBatches(formData.semester ? parseInt(formData.semester.replace('Semester ', '')) : 0, formData.department);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');

        // Validate form before sending OTP
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
        try {
            const response = await authService.sendOtp(formData.email);
            setStep(2);
            setResendCooldown(30);
            // In dev mode (dummy SMTP), the backend returns the OTP directly
            if (response.otp) {
                setOtp(response.otp);
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        setError('');
        setLoading(true);
        try {
            await authService.sendOtp(formData.email);
            setResendCooldown(30);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to resend OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            // Step 1: Verify OTP
            await authService.verifyOtp(formData.email, otp);

            // Step 2: Register the user
            const result = await register(formData);

            if (result.success) {
                const role = result.user?.role;
                if (role === USER_ROLES.ADMIN) {
                    navigate(ROUTES.ADMIN_DASHBOARD);
                } else if (role === USER_ROLES.TEACHER) {
                    navigate(ROUTES.TEACHER_DASHBOARD);
                } else if (role === USER_ROLES.PARENT) {
                    navigate('/parent/dashboard');
                } else {
                    navigate(ROUTES.STUDENT_DASHBOARD);
                }
            } else {
                setError(result.error || 'Registration failed. Please try again.');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid or expired OTP. Please try again.');
        } finally {
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
                    <h1 className="auth-title">{step === 1 ? 'Create Account' : 'Verify Email'}</h1>
                    <p className="auth-subtitle">
                        {step === 1
                            ? 'Join our smart attendance system'
                            : `Enter the 6-digit code sent to ${formData.email}`}
                    </p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    /* ---- STEP 1: Registration Form ---- */
                    <form onSubmit={handleSendOtp} className="auth-form">
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
                                <option value={USER_ROLES.PARENT}>Parent / Guardian</option>
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

                                <div className="form-group">
                                    <label className="form-label">Batch / Subgroup</label>
                                    <select
                                        name="batch"
                                        className="form-select"
                                        value={formData.batch}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.department || !formData.semester}
                                    >
                                        <option value="">{!formData.department || !formData.semester ? 'Select Department & Semester first' : 'Select Batch'}</option>
                                        {availableBatches.map(b => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        {formData.role === USER_ROLES.PARENT && (
                            <div className="form-group">
                                <label className="form-label">
                                    <FaIdCard /> Student Roll Number
                                </label>
                                <input
                                    type="text"
                                    name="linkedStudentRollno"
                                    className="form-input"
                                    placeholder="e.g. 3C33, 102117066"
                                    value={formData.linkedStudentRollno}
                                    onChange={handleChange}
                                    required
                                />
                                <small style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>
                                    Enter your child's student roll number to link their account.
                                </small>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={loading}
                        >
                            {loading ? 'Sending OTP...' : 'Send OTP & Verify Email'}
                        </button>
                    </form>
                ) : (
                    /* ---- STEP 2: OTP Verification ---- */
                    <form onSubmit={handleVerifyAndRegister} className="auth-form">
                        <div className="form-group" style={{ textAlign: 'center' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
                                marginBottom: '1.5rem'
                            }}>
                                <FaShieldAlt style={{ fontSize: '2rem', color: 'var(--primary-600)' }} />
                            </div>
                            <label className="form-label" style={{ display: 'block', fontSize: '1rem', marginBottom: '0.5rem' }}>
                                Enter 6-Digit OTP
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="______"
                                value={otp}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setOtp(val);
                                }}
                                maxLength={6}
                                required
                                style={{
                                    textAlign: 'center',
                                    fontSize: '1.8rem',
                                    letterSpacing: '0.8rem',
                                    fontWeight: 700,
                                    maxWidth: '280px',
                                    margin: '0 auto',
                                }}
                                autoFocus
                            />
                            <p style={{ color: 'var(--gray-500)', marginTop: '1rem', fontSize: '0.85rem' }}>
                                Check your email inbox (and spam folder) for the verification code.
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={loading || otp.length !== 6}
                        >
                            {loading ? 'Verifying...' : 'Verify & Create Account'}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={handleResendOtp}
                                disabled={resendCooldown > 0 || loading}
                                style={{ marginRight: '0.5rem' }}
                            >
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => { setStep(1); setOtp(''); setError(''); }}
                            >
                                <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back
                            </button>
                        </div>
                    </form>
                )}

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
