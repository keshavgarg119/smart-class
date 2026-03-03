import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaQrcode, FaArrowLeft, FaClock, FaCheckCircle, FaSync } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/dashboard.css';

const QRAttendance = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [subject, setSubject] = useState('');
    const [classId, setClassId] = useState('');
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef(null);
    const [teacherLocation, setTeacherLocation] = useState(null);
    const [geoStatus, setGeoStatus] = useState('fetching'); // 'fetching' | 'ok' | 'denied'

    // Capture teacher GPS on mount
    useEffect(() => {
        if (!navigator.geolocation) { setGeoStatus('denied'); return; }
        navigator.geolocation.getCurrentPosition(
            pos => {
                setTeacherLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGeoStatus('ok');
            },
            () => setGeoStatus('denied')
        );
    }, []);

    // Countdown timer
    useEffect(() => {
        if (!session) return;
        const expiresAt = new Date(session.expires_at).getTime();

        const tick = () => {
            const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
            setTimeLeft(remaining);
            if (remaining <= 0) {
                clearInterval(timerRef.current);
                setSession(null);
            }
        };
        tick();
        timerRef.current = setInterval(tick, 1000);
        return () => clearInterval(timerRef.current);
    }, [session]);

    const generateQR = async () => {
        if (!subject.trim()) {
            setError('Please enter a subject name');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const payload = { subject: subject.trim(), class_id: classId || null };
            if (teacherLocation) {
                payload.lat = teacherLocation.lat;
                payload.lng = teacherLocation.lng;
            }
            const res = await api.post('/qr/generate', payload);
            setSession(res.data);
        } catch (e) {
            setError(e.response?.data?.detail || 'Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const pct = session ? (timeLeft / 300) * 100 : 0;

    return (
        <div className="dashboard">
            <Navbar />
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
                        <FaArrowLeft /> Back
                    </button>
                    <h1 className="dashboard-title"><FaQrcode /> QR Code Attendance</h1>
                    <p className="dashboard-subtitle">Generate a 5-minute QR code for students to scan and mark attendance</p>
                </div>

                {/* Generate form */}
                {!session && (
                    <div className="dashboard-section" style={{ maxWidth: '480px', margin: '0 auto' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>New QR Session</h2>

                        <div style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Subject *</label>
                            <input
                                className="form-input"
                                placeholder="e.g. Data Structures"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && generateQR()}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">Class / Section (optional)</label>
                            <input
                                className="form-input"
                                placeholder="e.g. CS-3A"
                                value={classId}
                                onChange={e => setClassId(e.target.value)}
                            />
                        </div>

                        {/* Geo Status Indicator */}
                        <div style={{ marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {geoStatus === 'fetching' && <span style={{ color: 'var(--gray-500)' }}><FaSync className="spin" /> Acquiring GPS location...</span>}
                            {geoStatus === 'ok' && <span style={{ color: '#16a34a' }}><FaCheckCircle /> Location acquired (50m radius active)</span>}
                            {geoStatus === 'denied' && <span style={{ color: '#ea580c' }}>⚠ Location denied (Location check disabled)</span>}
                        </div>

                        {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={generateQR} disabled={loading}>
                            {loading ? 'Generating…' : <><FaQrcode style={{ marginRight: '0.5rem' }} />Generate QR Code</>}
                        </button>
                    </div>
                )}

                {/* Active QR session */}
                {session && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>

                        {/* Timer */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.75rem 1.5rem',
                            background: timeLeft > 60 ? 'var(--success-50, #f0fdf4)' : '#fef2f2',
                            border: `2px solid ${timeLeft > 60 ? '#22c55e' : '#ef4444'}`,
                            borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '1.1rem',
                            color: timeLeft > 60 ? '#16a34a' : '#dc2626',
                            transition: 'all 0.3s ease'
                        }}>
                            <FaClock />
                            {minutes}:{String(seconds).padStart(2, '0')} remaining
                        </div>

                        {/* Progress bar */}
                        <div style={{ width: '100%', maxWidth: '400px', height: '6px', background: 'var(--gray-200)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${pct}%`, height: '100%',
                                background: pct > 20 ? '#22c55e' : '#ef4444',
                                transition: 'width 1s linear, background 0.3s ease'
                            }} />
                        </div>

                        {/* QR Image */}
                        <div className="dashboard-section" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--gray-700)' }}>
                                📚 {session.subject} {session.class_id ? `— ${session.class_id}` : ''}
                            </div>
                            <img
                                src={`data:image/png;base64,${session.qr_image_base64}`}
                                alt="QR Code for attendance"
                                style={{ width: 240, height: 240, borderRadius: '8px', imageRendering: 'pixelated' }}
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', textAlign: 'center' }}>
                                Show this QR code to students. They can also enter the token manually.
                            </p>
                            {/* Token text for fallback */}
                            <div style={{
                                width: '100%', background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
                                borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem',
                                fontFamily: 'monospace', fontSize: '0.65rem', wordBreak: 'break-all',
                                color: 'var(--gray-600)'
                            }}>
                                <strong>Token (manual entry):</strong><br />{session.token}
                            </div>
                        </div>

                        <button
                            className="btn btn-outline"
                            onClick={() => { setSession(null); clearInterval(timerRef.current); }}
                        >
                            <FaSync style={{ marginRight: '0.5rem' }} /> Generate New QR
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRAttendance;
