import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    FaEnvelope, FaLock, FaUser, FaIdCard, 
    FaShieldAlt, FaArrowLeft, FaGraduationCap,
    FaGoogle, FaApple, FaInfoCircle
} from 'react-icons/fa';
import { ROUTES, USER_ROLES, DEPARTMENTS, SEMESTERS, generateBatches } from '../utils/constants';
import { validatePassword, PASSWORD_REQUIREMENTS_TEXT } from '../utils/validation';
import * as authService from '../services/authService';
import '../styles/auth.css';

const AuthPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register } = useAuth();

    const [mode, setMode] = useState(location.pathname === '/register' ? 'register' : 'login');
    const [regStep, setRegStep] = useState(1);

    const [loginData, setLoginData] = useState({ email: '', password: '', role: USER_ROLES.STUDENT });
    const [regData, setRegData] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        role: USER_ROLES.STUDENT, studentId: '', department: '',
        semester: '', batch: '', linkedStudentRollno: '',
    });

    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        setMode(location.pathname === '/register' ? 'register' : 'login');
    }, [location.pathname]);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleToggleMode = () => {
        const newMode = mode === 'login' ? 'register' : 'login';
        setMode(newMode);
        setError('');
        navigate(newMode === 'login' ? '/login' : '/register');
    };

    const handleLoginChange = (e) => {
        const { name, value } = e.target;
        setLoginData(prev => ({ ...prev, [name]: value }));
    };

    const handleRegChange = (e) => {
        const { name, value } = e.target;
        setRegData(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'department' || name === 'semester') updated.batch = '';
            return updated;
        });
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login({ username: loginData.email, password: loginData.password });
        if (result.success) {
            const role = result.user?.role;
            if (role === USER_ROLES.ADMIN) navigate(ROUTES.ADMIN_DASHBOARD);
            else if (role === USER_ROLES.TEACHER) navigate(ROUTES.TEACHER_DASHBOARD);
            else navigate(ROUTES.STUDENT_DASHBOARD);
        } else {
            setError(result.error || 'Invalid email or password.');
            setLoading(false);
        }
    };

    const handleRegSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (regData.password !== regData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        const passwordError = validatePassword(regData.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }
        setLoading(true);
        try {
            const response = await authService.sendOtp(regData.email);
            setRegStep(2);
            setResendCooldown(30);
            if (response.otp) setOtp(response.otp);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authService.verifyOtp(regData.email, otp);
            const result = await register(regData);
            if (result.success) {
                const role = result.user?.role;
                if (role === USER_ROLES.ADMIN) navigate(ROUTES.ADMIN_DASHBOARD);
                else if (role === USER_ROLES.TEACHER) navigate(ROUTES.TEACHER_DASHBOARD);
                else navigate(ROUTES.STUDENT_DASHBOARD);
            } else setError(result.error || 'Registration failed.');
        } catch (err) {
            setError('Invalid or expired OTP.');
        } finally {
            setLoading(false);
        }
    };

    const availableBatches = generateBatches(regData.semester ? parseInt(regData.semester.replace('Semester ', '')) : 0, regData.department);

    return (
        <div className="auth-page-container">
            <div className="auth-content-wrapper">
                
                {/* --- LEFT SIDE: FORM --- */}
                <div className="form-side">
                    <div className="auth-logo-text">
                        <div style={{background:'var(--auth-primary)', padding:'0.5rem', borderRadius:'12px', display:'flex'}}>
                            <FaGraduationCap size={24} color="#000" />
                        </div>
                        <span>SmartClass</span>
                    </div>

                    <div className="form-header">
                        <h1>{mode === 'login' ? 'Sign In' : 'Create an account'}</h1>
                        <p>{mode === 'login' ? 'Welcome back! Please enter your details.' : 'Join the next generation of campus management.'}</p>
                    </div>

                    {error && <div className="error-badge"><FaInfoCircle /> {error}</div>}

                    {mode === 'login' ? (
                        <form className="auth-inner-form" onSubmit={handleLoginSubmit}>
                            <div className="form-field-group">
                                <label className="field-label">Email address</label>
                                <input type="email" name="email" className="auth-input" placeholder="Enter your email" value={loginData.email} onChange={handleLoginChange} required />
                            </div>
                            <div className="form-field-group">
                                <label className="field-label">Password</label>
                                <input type="password" name="password" className="auth-input" placeholder="••••••••" value={loginData.password} onChange={handleLoginChange} required />
                            </div>
                            <button className="auth-btn" disabled={loading}>
                                {loading ? 'Processing...' : 'Sign In'}
                            </button>
                        </form>
                    ) : regStep === 1 ? (
                        <form className="auth-inner-form" onSubmit={handleRegSubmit}>
                            <div className="form-field-group">
                                <label className="field-label">Full Name</label>
                                <input type="text" name="name" className="auth-input" placeholder="Amélie Laurent" value={regData.name} onChange={handleRegChange} required />
                            </div>
                            <div className="form-field-group">
                                <label className="field-label">Email address</label>
                                <input type="email" name="email" className="auth-input" placeholder="amelie@example.com" value={regData.email} onChange={handleRegChange} required />
                            </div>
                            
                            <div className="form-row">
                                <div className="form-field-group">
                                    <label className="field-label">Password</label>
                                    <input type="password" name="password" className="auth-input" placeholder="••••••••" value={regData.password} onChange={handleRegChange} required />
                                </div>
                                <div className="form-field-group">
                                    <label className="field-label">Confirm Password</label>
                                    <input type="password" name="confirmPassword" className="auth-input" placeholder="••••••••" value={regData.confirmPassword} onChange={handleRegChange} required />
                                </div>
                            </div>

                            <div className="form-field-group">
                                <label className="field-label">Register As</label>
                                <select name="role" className="auth-input" value={regData.role} onChange={handleRegChange} required>
                                    <option value={USER_ROLES.STUDENT}>Student</option>
                                    <option value={USER_ROLES.TEACHER}>Teacher</option>
                                    <option value={USER_ROLES.ADMIN}>Administrator</option>
                                </select>
                            </div>

                            {regData.role === USER_ROLES.STUDENT && (
                                <>
                                    <div className="form-field-group">
                                        <label className="field-label">Student ID</label>
                                        <input type="text" name="studentId" className="auth-input" placeholder="CS2024001" value={regData.studentId} onChange={handleRegChange} required />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-field-group">
                                            <label className="field-label">Department</label>
                                            <select name="department" className="auth-input" value={regData.department} onChange={handleRegChange} required>
                                                <option value="">Select</option>
                                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-field-group">
                                            <label className="field-label">Semester</label>
                                            <select name="semester" className="auth-input" value={regData.semester} onChange={handleRegChange} required>
                                                <option value="">Select</option>
                                                {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-field-group">
                                        <label className="field-label">Batch / Subgroup</label>
                                        <select 
                                            name="batch" 
                                            className="auth-input" 
                                            value={regData.batch} 
                                            onChange={handleRegChange} 
                                            required
                                            disabled={!regData.department || !regData.semester}
                                        >
                                            <option value="">{!regData.department || !regData.semester ? 'Select Dept & Sem first' : 'Select Batch'}</option>
                                            {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}

                            <button className="auth-btn" disabled={loading}>
                                {loading ? 'Sending OTP...' : 'Create Account'}
                            </button>
                        </form>
                    ) : (
                        <form className="auth-inner-form" onSubmit={handleVerifyAndRegister}>
                            <div style={{textAlign:'center', marginBottom:'2rem'}}>
                                <div style={{background:'var(--auth-primary)', width:'64px', height:'64px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem'}}>
                                    <FaShieldAlt size={32} color="#000" />
                                </div>
                                <h2>Verify your email</h2>
                                <p style={{fontSize:'0.9rem', color:'var(--auth-text-muted)'}}>We sent a 6-digit code to {regData.email}</p>
                            </div>
                            <input type="text" className="auth-input" placeholder="0 0 0 0 0 0" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} style={{textAlign:'center', fontSize:'1.75rem', letterSpacing:'0.75rem', fontWeight:'700', marginBottom:'1.5rem'}} required />
                            <button className="auth-btn" disabled={loading || otp.length < 6}>Verify Code</button>
                            <button type="button" className="auth-btn" style={{background:'transparent', border:'1px solid var(--auth-input-border)', marginTop:'1rem'}} onClick={() => setRegStep(1)}>
                                <FaArrowLeft style={{marginRight:'0.5rem'}} /> Back to form
                            </button>
                        </form>
                    )}

                    <div className="social-btns">
                        <button className="social-btn"><FaGoogle size={18} /> Google</button>
                        <button className="social-btn"><FaApple size={18} /> Apple</button>
                    </div>

                    <div className="footer-text">
                        {mode === 'login' ? (
                            <>Don't have an account? <span className="footer-link" onClick={handleToggleMode}>Sign up</span></>
                        ) : (
                            <>Already have an account? <span className="footer-link" onClick={handleToggleMode}>Log in</span></>
                        )}
                    </div>
                </div>

                {/* --- RIGHT SIDE: IMAGE --- */}
                <div className="image-side">
                    <div className="hero-image-container">
                        <img 
                            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" 
                            alt="Smart Attendance Hero" 
                            className="hero-image" 
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.style.background = 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)';
                            }}
                        />
                        <div className="image-overlay-content">
                            <div className="glass-card top">
                                <span className="glass-badge">University Schedule</span>
                                <div style={{fontWeight:700, fontSize:'1.1rem', marginBottom:'0.25rem'}}>Machine Learning 101</div>
                                <div style={{fontSize:'0.85rem', opacity:0.9}}>Hall A • 10:00 AM</div>
                            </div>
                            <div className="glass-card bottom">
                                <span className="glass-badge" style={{background:'rgba(74, 222, 128, 0.3)'}}>Live Activity</span>
                                <div style={{fontWeight:700, fontSize:'1.1rem', marginBottom:'0.5rem'}}>Smart Attendance Active</div>
                                <div style={{display:'flex', gap:'0.5rem', alignItems:'center'}}>
                                    <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 8px #4ade80'}}></div>
                                    <div style={{fontSize:'0.85rem'}}>42 Students recognized</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AuthPage;
