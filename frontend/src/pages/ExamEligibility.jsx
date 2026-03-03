import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaArrowLeft, FaGraduationCap, FaCheckCircle, FaTimesCircle, FaFileExport } from 'react-icons/fa';
import api from '../services/api';
import '../styles/dashboard.css';

const ExamEligibility = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subject, setSubject] = useState('');
    const [threshold, setThreshold] = useState(75);

    const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English', 'Electronics'];

    useEffect(() => {
        fetchEligibility();
    }, [subject, threshold]);

    const fetchEligibility = async () => {
        try {
            setLoading(true);
            const params = { threshold };
            if (subject) params.subject = subject;
            const res = await api.get('/attendance/eligibility', { params });
            setStudents(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const eligible = students.filter(s => s.eligible);
    const ineligible = students.filter(s => !s.eligible);

    return (
        <div className="dashboard">
            <Navbar />
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
                        <FaArrowLeft /> Back
                    </button>
                    <h1 className="dashboard-title"><FaGraduationCap /> Exam Eligibility</h1>
                    <p className="dashboard-subtitle">Students with attendance below {threshold}% are ineligible</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <select className="form-select" style={{ maxWidth: '200px' }} value={subject} onChange={e => setSubject(e.target.value)}>
                        <option value="">All Subjects</option>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label className="form-label" style={{ margin: 0 }}>Threshold: </label>
                        <input type="number" className="form-input" style={{ width: '80px' }} value={threshold} onChange={e => setThreshold(Number(e.target.value))} min={0} max={100} />
                        <span>%</span>
                    </div>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="stat-card" style={{ textAlign: 'center' }}>
                        <div className="stat-title">Total Students</div>
                        <div className="stat-value">{students.length}</div>
                    </div>
                    <div className="stat-card" style={{ textAlign: 'center', borderLeft: '4px solid var(--success-500)' }}>
                        <div className="stat-title">Eligible</div>
                        <div className="stat-value" style={{ color: 'var(--success-600)' }}>{eligible.length}</div>
                    </div>
                    <div className="stat-card" style={{ textAlign: 'center', borderLeft: '4px solid var(--danger-500)' }}>
                        <div className="stat-title">Not Eligible</div>
                        <div className="stat-value" style={{ color: 'var(--danger-600)' }}>{ineligible.length}</div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                    </div>
                ) : (
                    <div className="dashboard-section">
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Student ID</th>
                                        <th>Name</th>
                                        <th>Department</th>
                                        <th>Batch</th>
                                        <th>Classes</th>
                                        <th>Present</th>
                                        <th>%</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((s, i) => (
                                        <tr key={i}>
                                            <td style={{ fontFamily: 'var(--font-mono)' }}>{s.student_id}</td>
                                            <td style={{ fontWeight: 600 }}>{s.name}</td>
                                            <td>{s.department}</td>
                                            <td>{s.batch || '—'}</td>
                                            <td>{s.total_classes}</td>
                                            <td>{s.present}</td>
                                            <td>
                                                <span className={`badge ${s.percentage >= threshold ? 'badge-success' : 'badge-danger'}`}>
                                                    {s.percentage}%
                                                </span>
                                            </td>
                                            <td>
                                                {s.eligible ? (
                                                    <span style={{ color: 'var(--success-600)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <FaCheckCircle /> Eligible
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--danger-600)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <FaTimesCircle /> Not Eligible
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

export default ExamEligibility;
