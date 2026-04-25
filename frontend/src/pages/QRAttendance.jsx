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
    const [activeSeconds, setActiveSeconds] = useState(0);
    const refreshIntervalRef = useRef(null);
    const sessionTimerRef = useRef(null);
    const [teacherLocation, setTeacherLocation] = useState(null);
    const [geoStatus, setGeoStatus] = useState('fetching');

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

    // Rolling QR Logic
    const startRollingQR = async () => {
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
            
            // Initial generation
            const res = await api.post('/qr/generate', payload);
            setSession(res.data);
            setActiveSeconds(0);

            // Start 10s rotation
            refreshIntervalRef.current = setInterval(async () => {
                try {
                    const rotateRes = await api.post('/qr/generate', payload);
                    setSession(rotateRes.data);
                } catch (e) {
                    console.error("Rotation failed", e);
                }
            }, 10000);

            // Start session timer (to show how long it's been active)
            sessionTimerRef.current = setInterval(() => {
                setActiveSeconds(prev => prev + 1);
            }, 1000);

        } catch (e) {
            setError(e.response?.data?.detail || 'Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    const stopSession = async () => {
        try {
            await api.post('/qr/close', { subject: subject.trim() });
            clearInterval(refreshIntervalRef.current);
            clearInterval(sessionTimerRef.current);
            setSession(null);
            setActiveSeconds(0);
        } catch (e) {
            setError('Failed to close session');
        }
    };

    const formatTime = (totalSeconds) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    return (
        <div className="dashboard">
            <Navbar />
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
                        <FaArrowLeft /> Back
                    </button>
                    <h1 className="dashboard-title"><FaQrcode /> Rolling QR Attendance</h1>
                    <p className="dashboard-subtitle">QR code rotates every 10 seconds for maximum security</p>
                </div>

                {/* Generate form */}
                {!session && (
                    <div className="dashboard-section" style={{ maxWidth: '480px', margin: '0 auto' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Start New Session</h2>

                        <div style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Subject *</label>
                            <input
                                className="form-input"
                                placeholder="e.g. Data Structures"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && startRollingQR()}
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
                            {geoStatus === 'ok' && <span style={{ color: '#16a34a' }}><FaCheckCircle /> Location acquired (25m radius active)</span>}
                            {geoStatus === 'denied' && <span style={{ color: '#ea580c' }}>⚠ Location denied (Location check disabled)</span>}
                        </div>

                        {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={startRollingQR} disabled={loading}>
                            {loading ? 'Starting...' : <><FaQrcode style={{ marginRight: '0.5rem' }} />Start Rolling QR</>}
                        </button>
                    </div>
                )}

                {/* Active QR session */}
                {session && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>

                        {/* Status / Timer */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            padding: '1rem 2rem',
                            background: 'var(--success-50, #f0fdf4)',
                            border: '2px solid #22c55e',
                            borderRadius: '16px', fontWeight: 700, fontSize: '1.1rem',
                            color: '#16a34a',
                            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.1)'
                        }}>
                            <div className="pulse-dot" style={{ width: '12px', height: '12px', background: '#22c55e', borderRadius: '50%' }}></div>
                            LIVE SESSION: {formatTime(activeSeconds)}
                        </div>

                        {/* Rotating indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                            <FaSync className="spin" /> Next QR code in 10s...
                        </div>

                        {/* QR Image */}
                        <div className="dashboard-section" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', maxWidth: '500px', width: '100%' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Subject</div>
                                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--gray-900)' }}>
                                    {session.subject} {session.class_id ? `(${session.class_id})` : ''}
                                </div>
                            </div>

                            <div style={{ 
                                padding: '1rem', 
                                background: 'white', 
                                borderRadius: '12px', 
                                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                                border: '1px solid var(--gray-100)'
                            }}>
                                <img
                                    src={`data:image/png;base64,${session.qr_image_base64}`}
                                    alt="QR Code"
                                    style={{ width: 280, height: 280, borderRadius: '4px', imageRendering: 'pixelated' }}
                                />
                            </div>

                            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', textAlign: 'center', maxWidth: '300px' }}>
                                Students must scan this code within 10 seconds before it rotates.
                            </p>

                            <button
                                className="btn btn-danger"
                                style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}
                                onClick={stopSession}
                            >
                                <FaClock style={{ marginRight: '0.5rem' }} /> Stop Session & Close Attendance
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRAttendance;
