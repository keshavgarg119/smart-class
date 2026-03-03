import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { FaCamera, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import * as studentService from '../services/studentService';

const FaceRegistration = ({ studentId, onComplete }) => {
    const webcamRef = useRef(null);
    const [imgSrc, setImgSrc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const videoConstraints = {
        width: 720,
        height: 720,
        facingMode: "user"
    };

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImgSrc(imageSrc);
        setError('');
    }, [webcamRef, setImgSrc]);

    const retake = () => {
        setImgSrc(null);
        setError('');
        setSuccess('');
    };

    const submitFace = async () => {
        if (!imgSrc) return;

        try {
            setLoading(true);
            setError('');

            // Convert base64 to blob to file
            const fetchRes = await fetch(imgSrc);
            const blob = await fetchRes.blob();
            const file = new File([blob], "face.jpg", { type: "image/jpeg" });

            await studentService.uploadStudentFace(studentId, file);

            setSuccess("Face registered successfully!");
            setTimeout(() => {
                if (onComplete) onComplete();
            }, 2000);

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to register face. Please ensure your face is clearly visible.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="face-registration-container" style={{
            background: 'var(--white)',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            maxWidth: '600px',
            margin: '0 auto',
            textAlign: 'center'
        }}>
            <h2 style={{ marginBottom: '0.5rem', color: 'var(--gray-900)' }}>Face Registration Required</h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
                Before you can mark attendance, you need to register your face in the system.
                Please ensure you are in a well-lit area and looking directly at the camera.
            </p>

            {error && (
                <div className="alert alert-danger" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <FaExclamationCircle /> {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <FaCheckCircle /> {success}
                </div>
            )}

            <div className="camera-viewport" style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                marginBottom: '1.5rem',
                backgroundColor: '#000',
                position: 'relative',
                minHeight: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {!imgSrc ? (
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                ) : (
                    <img src={imgSrc} alt="Captured face" style={{ width: '100%', height: 'auto', display: 'block' }} />
                )}
            </div>

            <div className="controls" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                {!imgSrc ? (
                    <button
                        className="btn btn-primary"
                        onClick={capture}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}
                    >
                        <FaCamera /> Capture Photo
                    </button>
                ) : (
                    <>
                        <button
                            className="btn btn-outline"
                            onClick={retake}
                            disabled={loading || success}
                        >
                            Retake
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={submitFace}
                            disabled={loading || success}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}
                        >
                            {loading ? (
                                <>Uploading...</>
                            ) : success ? (
                                <><FaCheckCircle /> Registered!</>
                            ) : (
                                <>Submit Photo</>
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default FaceRegistration;
