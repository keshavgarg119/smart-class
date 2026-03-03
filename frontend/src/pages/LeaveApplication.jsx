import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaArrowLeft, FaPaperPlane } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import * as studentService from '../services/studentService';
import '../styles/dashboard.css';

const LeaveApplication = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [studentId, setStudentId] = useState('');
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ start_date: '', end_date: '', reason: '' });
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchStudentAndLeaves();
    }, []);

    const fetchStudentAndLeaves = async () => {
        try {
            const student = await studentService.getStudent(user.id);
            const sid = student.id;
            setStudentId(sid);
            const res = await api.get('/leaves/', { params: { student_id: sid } });
            setLeaves(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/leaves/', {
                student_id: studentId,
                student_name: user.full_name || user.username,
                ...formData
            });
            setSuccess('Leave application submitted!');
            setFormData({ start_date: '', end_date: '', reason: '' });
            setTimeout(() => setSuccess(''), 3000);
            fetchStudentAndLeaves();
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const map = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };
        return `badge ${map[status] || 'badge-gray'}`;
    };

    return (
        <div className="dashboard">
            <Navbar />
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
                        <FaArrowLeft /> Back
                    </button>
                    <h1 className="dashboard-title">Leave Application</h1>
                    <p className="dashboard-subtitle">Apply for leave and track your requests</p>
                </div>

                {success && <div className="alert alert-success">{success}</div>}

                <div className="dashboard-content-grid">
                    <div className="dashboard-section">
                        <div className="section-header"><h2>Apply for Leave</h2></div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input type="date" className="form-input" required value={formData.start_date}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date</label>
                                    <input type="date" className="form-input" required value={formData.end_date}
                                        onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reason</label>
                                <textarea className="form-input" rows={3} required placeholder="Explain your reason for leave..."
                                    value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                <FaPaperPlane /> {submitting ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </form>
                    </div>

                    <div className="dashboard-section">
                        <div className="section-header"><h2>My Leave Requests</h2></div>
                        {leaves.length === 0 ? (
                            <p style={{ color: 'var(--gray-500)' }}>No leave requests yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {leaves.map(l => (
                                    <div key={l.id} style={{
                                        padding: '1rem',
                                        background: 'var(--gray-50)',
                                        borderRadius: 'var(--radius-md)',
                                        borderLeft: `4px solid ${l.status === 'approved' ? 'var(--success-500)' : l.status === 'rejected' ? 'var(--danger-500)' : 'var(--warning-500)'}`
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <strong>{l.start_date} → {l.end_date}</strong>
                                            <span className={getStatusBadge(l.status)}>{l.status}</span>
                                        </div>
                                        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>{l.reason}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaveApplication;
