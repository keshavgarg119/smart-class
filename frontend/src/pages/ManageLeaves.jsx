import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/dashboard.css';

const ManageLeaves = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');

    useEffect(() => {
        fetchLeaves();
    }, [filter]);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const params = filter ? { status_filter: filter } : {};
            const res = await api.get('/leaves/', { params });
            setLeaves(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (leaveId, status) => {
        try {
            await api.put(`/leaves/${leaveId}/review`, {
                status,
                reviewed_by: user?.full_name || user?.username
            });
            fetchLeaves();
        } catch (e) {
            console.error(e);
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
                    <h1 className="dashboard-title">Manage Leave Requests</h1>
                    <p className="dashboard-subtitle">Review and manage student leave applications</p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {['pending', 'approved', 'rejected', ''].map(f => (
                        <button
                            key={f}
                            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setFilter(f)}
                        >
                            {f || 'All'}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                    </div>
                ) : leaves.length === 0 ? (
                    <p style={{ color: 'var(--gray-500)', padding: '2rem', textAlign: 'center' }}>No leave requests found.</p>
                ) : (
                    <div className="dashboard-section">
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map(l => (
                                        <tr key={l.id}>
                                            <td style={{ fontWeight: 600 }}>{l.student_name}</td>
                                            <td>{l.start_date}</td>
                                            <td>{l.end_date}</td>
                                            <td style={{ maxWidth: '300px' }}>{l.reason}</td>
                                            <td><span className={getStatusBadge(l.status)}>{l.status}</span></td>
                                            <td>
                                                {l.status === 'pending' ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button className="btn btn-sm btn-success" onClick={() => handleReview(l.id, 'approved')}>
                                                            <FaCheck /> Approve
                                                        </button>
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleReview(l.id, 'rejected')}>
                                                            <FaTimes /> Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                                                        {l.reviewed_by ? `by ${l.reviewed_by}` : 'Reviewed'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageLeaves;
