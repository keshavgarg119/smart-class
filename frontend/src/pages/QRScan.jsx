import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaQrcode, FaArrowLeft, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../services/api';
import '../styles/dashboard.css';

const QRScan = () => {
    const navigate = useNavigate();
    const scannerRef = useRef(null);
    const scannerDivId = 'html5qrcode-reader';

    const [mode, setMode] = useState('manual'); // 'camera' | 'manual'
    const [token, setToken] = useState('');
    const [geoEnabled, setGeoEnabled] = useState(true);
    const [location, setLocation] = useState(null);
    const [geoError, setGeoError] = useState('');
    const [status, setStatus] = useState(null); // {ok, msg}
    const [loading, setLoading] = useState(false);

    // Get location once on mount if enabled
    useEffect(() => {
        if (!geoEnabled) { setLocation(null); return; }
        if (!navigator.geolocation) {
            setGeoError('Geolocation not supported by your browser');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => setGeoError('Location access denied — proceeding without geolocation')
        );
    }, [geoEnabled]);

    // Camera scanner
    useEffect(() => {
        if (mode !== 'camera') return;

        const scanner = new Html5QrcodeScanner(scannerDivId, {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
        }, false);

        scanner.render(
            (decodedText) => {
                scanner.clear().catch(() => { });
                setToken(decodedText);
                setMode('manual');
            },
            () => { } // ignore decode errors
        );

        scannerRef.current = scanner;
        return () => {
            scanner.clear().catch(() => { });
        };
    }, [mode]);

    const submitToken = async () => {
        if (!token.trim()) return;
        setLoading(true);
        setStatus(null);
        try {
            const payload = { token: token.trim() };
            if (location) {
                payload.lat = location.lat;
                payload.lng = location.lng;
            }
            const res = await api.post('/qr/verify', payload);
            setStatus({ ok: true, msg: res.data.message || 'Attendance marked!' });
            setToken('');
        } catch (e) {
            setStatus({ ok: false, msg: e.response?.data?.detail || 'Failed to verify QR token' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard">
            <Navbar />
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
                        <FaArrowLeft /> Back
                    </button>
                    <h1 className="dashboard-title"><FaQrcode /> Scan QR Attendance</h1>
                    <p className="dashboard-subtitle">Scan your teacher's QR code or enter the token manually to mark attendance</p>
                </div>

                <div className="dashboard-section" style={{ maxWidth: '520px', margin: '0 auto' }}>
                    {/* Mode toggle */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <button
                            className={`btn ${mode === 'camera' ? 'btn-primary' : 'btn-outline'}`}
                            style={{ flex: 1 }}
                            onClick={() => setMode('camera')}
                        >
                            📷 Scan Camera
                        </button>
                        <button
                            className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-outline'}`}
                            style={{ flex: 1 }}
                            onClick={() => { setMode('manual'); if (scannerRef.current) scannerRef.current.clear().catch(() => { }); }}
                        >
                            ⌨️ Enter Token
                        </button>
                    </div>

                    {/* Camera scanner */}
                    {mode === 'camera' && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div id={scannerDivId} style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }} />
                        </div>
                    )}

                    {/* Manual token entry */}
                    {mode === 'manual' && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">QR Token</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                placeholder="Paste the QR token here..."
                                value={token}
                                onChange={e => setToken(e.target.value)}
                                style={{ fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
                            />
                        </div>
                    )}

                    {/* Geolocation toggle */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 1rem', background: 'var(--gray-50)',
                        borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem'
                    }}>
                        <FaMapMarkerAlt style={{ color: location ? '#22c55e' : 'var(--gray-400)' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Location Verification</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                {location ? `📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : geoError || 'Fetching location…'}
                            </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={geoEnabled} onChange={e => setGeoEnabled(e.target.checked)} />
                            Enable
                        </label>
                    </div>

                    {/* Status */}
                    {status && (
                        <div className={`alert ${status.ok ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {status.ok ? <FaCheckCircle /> : <FaTimesCircle />} {status.msg}
                        </div>
                    )}

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={submitToken}
                        disabled={loading || !token.trim()}
                    >
                        {loading ? 'Verifying…' : 'Mark Attendance'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QRScan;
