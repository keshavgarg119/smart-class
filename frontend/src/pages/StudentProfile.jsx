import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaArrowLeft, FaSave, FaUser, FaIdCard, FaBuilding, FaLayerGroup, FaCamera, FaCheckCircle, FaUpload, FaVideo, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import * as studentService from '../services/studentService';
import { DEPARTMENTS, SEMESTERS, generateBatches, API_BASE_URL } from '../utils/constants';
import Webcam from 'react-webcam';
import '../styles/dashboard.css';

const StudentProfile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showPhotoMenu, setShowPhotoMenu] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const fileInputRef = useRef(null);
    const webcamRef = useRef(null);
    const menuRef = useRef(null);

    const [formData, setFormData] = useState({
        department: '',
        year: '',
        batch: '',
        phone: '',
    });

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowPhotoMenu(false);
            }
        };
        if (showPhotoMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPhotoMenu]);

    useEffect(() => {
        fetchStudent();
    }, []);

    const fetchStudent = async () => {
        try {
            setLoading(true);
            const data = await studentService.getStudent(user.id);
            setStudent(data);
            setFormData({
                department: data.department || '',
                year: data.year || '',
                batch: data.batch || '',
                phone: data.phone || '',
            });
        } catch (err) {
            setError('Failed to load profile');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'department' || name === 'year') {
                updated.batch = '';
            }
            return updated;
        });
    };

    const availableBatches = generateBatches(formData.year || 0, formData.department);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            await studentService.updateStudent(student.id, {
                department: formData.department || null,
                year: formData.year ? parseInt(formData.year) : null,
                batch: formData.batch || null,
                phone: formData.phone || null,
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError('Failed to update profile');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // Handle photo upload from file
    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadPhoto(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Upload photo (shared by file upload and webcam capture)
    const uploadPhoto = async (file) => {
        setUploading(true);
        setError(null);
        try {
            await studentService.uploadStudentFace(student.id, file);
            await fetchStudent();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to upload photo. Make sure a face is clearly visible.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    // Webcam capture
    const capturePhoto = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) setCapturedImage(imageSrc);
    }, [webcamRef]);

    const uploadCapturedPhoto = async () => {
        if (!capturedImage) return;
        const fetchRes = await fetch(capturedImage);
        const blob = await fetchRes.blob();
        const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });
        await uploadPhoto(file);
        setShowCamera(false);
        setCapturedImage(null);
    };

    const faceImageUrl = student?.face_image
        ? `${API_BASE_URL}/uploads/faces/${student.face_image}?t=${Date.now()}`
        : null;

    const initials = (user.full_name || user.username || '?')
        .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    if (loading) return (
        <div className="dashboard">
            <Navbar />
            <div className="dashboard-container" style={{ textAlign: 'center', marginTop: '4rem' }}>
                <div className="spinner"></div>
                <p>Loading profile...</p>
            </div>
        </div>
    );

    return (
        <div className="dashboard">
            <Navbar />
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <button className="btn btn-outline" onClick={() => navigate('/student/dashboard')} style={{ marginBottom: '1rem' }}>
                        <FaArrowLeft /> Back to Dashboard
                    </button>
                    <h1 className="dashboard-title">Profile Settings</h1>
                    <p className="dashboard-subtitle">View and update your profile information</p>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success"><FaSave /> Profile updated successfully!</div>}

                {/* Webcam Capture Modal */}
                {showCamera && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        background: 'rgba(0,0,0,0.7)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', padding: '1rem'
                    }} onClick={() => { setShowCamera(false); setCapturedImage(null); }}>
                        <div style={{
                            background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                            padding: '2rem', maxWidth: '500px', width: '100%',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center'
                        }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0 }}><FaCamera /> Take a Photo</h3>
                                <button onClick={() => { setShowCamera(false); setCapturedImage(null); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--gray-500)' }}>
                                    <FaTimes />
                                </button>
                            </div>
                            <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                Look directly at the camera in a well-lit area
                            </p>
                            <div style={{
                                borderRadius: 'var(--radius-md)', overflow: 'hidden',
                                marginBottom: '1rem', background: '#000',
                                minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {!capturedImage ? (
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        videoConstraints={{ width: 480, height: 480, facingMode: 'user' }}
                                        style={{ width: '100%', height: 'auto', display: 'block' }}
                                    />
                                ) : (
                                    <img src={capturedImage} alt="Captured" style={{ width: '100%', height: 'auto', display: 'block' }} />
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                {!capturedImage ? (
                                    <button className="btn btn-primary" onClick={capturePhoto}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem' }}>
                                        <FaCamera /> Capture
                                    </button>
                                ) : (
                                    <>
                                        <button className="btn btn-outline" onClick={() => setCapturedImage(null)} disabled={uploading}>
                                            Retake
                                        </button>
                                        <button className="btn btn-primary" onClick={uploadCapturedPhoto} disabled={uploading}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem' }}>
                                            {uploading ? 'Uploading...' : <><FaUpload /> Use Photo</>}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* --- LEFT SIDE: FORM --- */}
                    <div className="dashboard-section" style={{ flex: '1 1 500px', maxWidth: '700px' }}>
                        {/* Hidden file input */}
                        <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />

                        {/* Profile Photo Area */}
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            marginBottom: '2rem', paddingBottom: '2rem',
                            borderBottom: '1px solid var(--gray-200)'
                        }}>
                            <div ref={menuRef} style={{ position: 'relative', overflow: 'visible' }}>
                                <div
                                    onClick={() => !uploading && setShowPhotoMenu(!showPhotoMenu)}
                                    style={{
                                        width: '120px', height: '120px', borderRadius: '50%',
                                        overflow: 'hidden',
                                        border: '4px solid var(--primary-500)',
                                        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                                        background: faceImageUrl ? 'transparent' : 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        position: 'relative', cursor: 'pointer',
                                        transition: 'transform 0.2s ease'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {faceImageUrl ? (
                                        <img src={faceImageUrl} alt="Profile"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                        />
                                    ) : null}
                                    <div style={{
                                        display: faceImageUrl ? 'none' : 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        width: '100%', height: '100%',
                                        color: 'white', fontSize: '2.5rem', fontWeight: 700
                                    }}>
                                        {uploading ? <div className="spinner" style={{ width: '32px', height: '32px' }}></div> : initials}
                                    </div>
                                    <div className="photo-overlay" style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        height: '36px', background: 'rgba(0,0,0,0.6)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        gap: '0.25rem', color: 'white', fontSize: '0.65rem', fontWeight: 600,
                                        opacity: 0, transition: 'opacity 0.2s ease'
                                    }}>
                                        <FaCamera /> Change
                                    </div>
                                </div>

                                {showPhotoMenu && (
                                    <div style={{
                                        position: 'absolute', top: '130px', left: '50%', transform: 'translateX(-50%)',
                                        background: '#ffffff', borderRadius: '12px',
                                        boxShadow: '0 8px 30px rgba(0,0,0,0.2)', border: '1px solid #e5e7eb',
                                        zIndex: 9999, minWidth: '220px', overflow: 'hidden'
                                    }}>
                                        <button onClick={() => { setShowPhotoMenu(false); fileInputRef.current?.click(); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.85rem 1.25rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.9rem', color: '#374151' }}>
                                            <FaUpload style={{ color: '#6366f1' }} /> Upload from Files
                                        </button>
                                        <button onClick={() => { setShowPhotoMenu(false); setShowCamera(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.85rem 1.25rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.9rem', color: '#374151' }}>
                                            <FaVideo style={{ color: '#16a34a' }} /> Take a Photo
                                        </button>
                                    </div>
                                )}
                            </div>

                            <h3 style={{ margin: '0.75rem 0 0', color: 'var(--gray-900)' }}>{user.full_name || user.username}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem', fontSize: '0.85rem' }}>
                                {student?.has_face_encoding ? (
                                    <span style={{ color: 'var(--success-600)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <FaCheckCircle /> Face Biometrics Active
                                    </span>
                                ) : (
                                    <span style={{ color: 'var(--primary-600)', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }} onClick={() => setShowPhotoMenu(true)}>
                                        <FaCamera /> Setup Biometrics
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Editable Form */}
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', backgroundColor: 'var(--gray-50)', padding: '1.5rem', borderRadius: '16px' }}>
                                <div>
                                    <small style={{ color: 'var(--gray-500)', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700 }}>Full Name</small>
                                    <p style={{ fontWeight: 600, margin: '0.25rem 0' }}>{user.full_name || user.username}</p>
                                </div>
                                <div>
                                    <small style={{ color: 'var(--gray-500)', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700 }}>Student ID</small>
                                    <p style={{ fontWeight: 600, margin: '0.25rem 0' }}>{student?.student_id || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label"><FaBuilding /> Department</label>
                                <select name="department" className="form-select" value={formData.department} onChange={handleChange}>
                                    <option value="">Select Department</option>
                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label"><FaIdCard /> Semester</label>
                                    <select name="year" className="form-select" value={formData.year} onChange={handleChange}>
                                        <option value="">Select Semester</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label"><FaLayerGroup /> Batch / Subgroup</label>
                                    <select name="batch" className="form-select" value={formData.batch} onChange={handleChange} disabled={!formData.department || !formData.year}>
                                        <option value="">{!formData.department || !formData.year ? 'Select Dept & Semester first' : 'Select Batch'}</option>
                                        {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input type="tel" name="phone" className="form-input" placeholder="e.g., 9876543210" value={formData.phone} onChange={handleChange} />
                            </div>

                            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" className="btn btn-primary btn-lg" disabled={saving} style={{ padding: '1rem 2.5rem', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}>
                                    {saving ? 'Saving...' : <><FaSave /> Save Changes</>}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* --- RIGHT SIDE: FUTURISTIC PANEL --- */}
                    <div style={{ flex: '1 1 350px', padding: 'var(--spacing-xl) 0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ 
                                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
                                borderRadius: '24px', 
                                height: '420px', 
                                overflow: 'hidden', 
                                position: 'relative',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <img 
                                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop" 
                                    alt="Futuristic Tech" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                                />
                                <div style={{ 
                                    position: 'absolute', inset: 0, 
                                    background: 'linear-gradient(to bottom, transparent, rgba(15, 23, 42, 0.8))',
                                    padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
                                }}>
                                    <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.5rem' }}>Smart Identity</div>
                                    <p style={{ color: 'white', fontSize: '0.9rem', opacity: 0.8, lineHeight: 1.4 }}>
                                        Your profile is secured with advanced biometric encryption and real-time attendance verification.
                                    </p>
                                </div>
                            </div>

                            {/* Glassmorphism Cards on the same line */}
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ 
                                    flex: 1,
                                    background: 'rgba(255, 255, 255, 0.05)', 
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '20px',
                                    padding: '1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem'
                                }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(74, 222, 128, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
                                        <FaCheckCircle size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Level: Platinum</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Verified</div>
                                    </div>
                                </div>

                                <div style={{ 
                                    flex: 1,
                                    background: 'rgba(99, 102, 241, 0.1)', 
                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                    borderRadius: '20px',
                                    padding: '1.25rem'
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.5rem', color: '#818cf8' }}>COMPLETION</div>
                                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: student?.has_face_encoding ? '100%' : '70%', height: '100%', background: '#6366f1' }}></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.7rem' }}>
                                        <span>{student?.has_face_encoding ? 'Complete' : '70%'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;
