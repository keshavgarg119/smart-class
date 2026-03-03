import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaArrowLeft, FaUpload, FaDownload, FaFileAlt, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import api from '../services/api';
import '../styles/dashboard.css';

const BulkImport = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected && selected.name.endsWith('.csv')) {
            setFile(selected);
            setError(null);
        } else {
            setError('Please select a CSV file');
            setFile(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const dropped = e.dataTransfer.files[0];
        if (dropped && dropped.name.endsWith('.csv')) {
            setFile(dropped);
            setError(null);
        } else {
            setError('Please drop a CSV file');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError(null);
        setResult(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.post('/bulk/import-students', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Import failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get('/bulk/sample-csv', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'student_import_template.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError('Failed to download template');
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
                    <h1 className="dashboard-title">Bulk Import Students</h1>
                    <p className="dashboard-subtitle">Upload a CSV file to register multiple students at once</p>
                </div>

                {error && <div className="alert alert-danger"><FaExclamationTriangle /> {error}</div>}

                {result && (
                    <div className="alert alert-success">
                        <FaCheckCircle /> {result.message}
                        {result.errors?.length > 0 && (
                            <div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                                <strong>Errors:</strong>
                                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <div className="dashboard-section">
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <button className="btn btn-outline" onClick={handleDownloadTemplate}>
                            <FaDownload /> Download CSV Template
                        </button>
                    </div>

                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: '3px dashed var(--gray-300)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '3rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            background: file ? 'var(--success-50)' : 'var(--gray-50)'
                        }}
                    >
                        <FaFileAlt style={{ fontSize: '3rem', color: file ? 'var(--success-600)' : 'var(--gray-400)', marginBottom: '1rem' }} />
                        {file ? (
                            <div>
                                <p style={{ fontWeight: 600, color: 'var(--success-600)' }}>{file.name}</p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                                    {(file.size / 1024).toFixed(1)} KB — Click or drop to change
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p style={{ fontWeight: 600 }}>Drag & drop your CSV file here</p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>or click to browse</p>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <FaUpload /> {uploading ? 'Importing...' : 'Import Students'}
                        </button>
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                        <strong>CSV Format:</strong>
                        <p style={{ marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                            full_name, email, student_id, department, year, batch, phone
                        </p>
                        <p style={{ marginTop: '0.5rem', color: 'var(--gray-500)' }}>
                            All students will be created with default password: <code>Welcome@123</code>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkImport;
