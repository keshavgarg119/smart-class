import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as attendanceService from '../services/attendanceService';
import { FaCamera, FaSpinner, FaCheckCircle, FaExclamationCircle, FaVideo } from 'react-icons/fa';

const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
};

const FaceAttendance = ({ subject, onAttendanceMarked }) => {
    const webcamRef = useRef(null);
    const [status, setStatus] = useState('idle'); // idle, capturing, recognizing, success, error
    const [message, setMessage] = useState('');
    const [details, setDetails] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');

    useEffect(() => {
        const getDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                setDevices(videoDevices);
                if (videoDevices.length > 0) {
                    setSelectedDeviceId(videoDevices[0].deviceId);
                }
            } catch (err) {
                console.error("Error accessing media devices.", err);
            }
        };
        getDevices();
    }, []);

    const dataURItoBlob = (dataURI) => {
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    };

    const captureAndSend = useCallback(async () => {
        if (!subject) {
            setStatus('error');
            setMessage('Please select a subject first');
            return;
        }

        setStatus('capturing');
        setMessage('Capturing image...');

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            setStatus('error');
            setMessage('Failed to access webcam. Please ensure it is connected and permitted.');
            return;
        }

        try {
            setStatus('recognizing');
            setMessage('Recognizing face...');

            // Convert Base64 to Blob to File
            const blob = dataURItoBlob(imageSrc);
            const file = new File([blob], "face_capture.jpg", { type: "image/jpeg" });

            // Call API
            // Assuming marked_by is not passed and handled by backend token or default 1 for now
            const response = await attendanceService.markAttendanceByFace(file, subject, null);

            setStatus('success');
            setMessage(response.message || 'Attendance marked successfully!');
            setDetails(response);

            if (onAttendanceMarked) {
                // Wait briefly then reset and notify parent
                setTimeout(() => {
                    onAttendanceMarked(response);
                    setStatus('idle');
                    setDetails(null);
                }, 3000);
            }

        } catch (error) {
            console.error("Face attendance error:", error);
            setStatus('error');
            setMessage(error.response?.data?.detail || 'Face not recognized or an error occurred.');

            // Auto reset error after 4 seconds
            setTimeout(() => {
                setStatus('idle');
            }, 4000);
        }
    }, [webcamRef, subject, onAttendanceMarked]);

    return (
        <div className="face-attendance-container" style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--gray-800)' }}>AI Face Recognition</h3>

            {devices.length > 1 && (
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                    <FaVideo color="var(--gray-600)" />
                    <select
                        value={selectedDeviceId}
                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-300)' }}
                    >
                        {devices.map((device, key) => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Camera ${key + 1}`}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="webcam-wrapper" style={{
                margin: '0 auto 1.5rem',
                maxWidth: '640px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '4px solid var(--primary-100)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <Webcam
                    audio={false}
                    height={480}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width={640}
                    videoConstraints={{
                        ...videoConstraints,
                        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
                    }}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                />
            </div>

            <div className="status-container" style={{ minHeight: '60px', marginBottom: '1rem' }}>
                {status === 'idle' && (
                    <p style={{ color: 'var(--gray-600)' }}>Position the student's face in the camera frame and click Capture.</p>
                )}

                {(status === 'capturing' || status === 'recognizing') && (
                    <div style={{ color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                        <FaSpinner className="spin-animation" /> {message}
                    </div>
                )}

                {status === 'success' && (
                    <div style={{ color: 'var(--success-600)', backgroundColor: 'var(--success-50)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--success-200)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            <FaCheckCircle /> {message}
                        </div>
                        {details && (
                            <div style={{ fontSize: '0.9rem' }}>
                                Matching Confidence: {(details.confidence * 100).toFixed(1)}% <br />
                                Student recognized and marked present.
                            </div>
                        )}
                    </div>
                )}

                {status === 'error' && (
                    <div style={{ color: 'var(--danger-600)', backgroundColor: 'var(--danger-50)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--danger-200)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                            <FaExclamationCircle /> {message}
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={captureAndSend}
                disabled={status !== 'idle' && status !== 'error'}
                className="btn btn-primary"
                style={{ fontSize: '1.1rem', padding: '0.75rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <FaCamera /> Capture & Mark Attendance
            </button>

            <style jsx="true">{`
                .spin-animation {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default FaceAttendance;
