import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaArrowLeft, FaChartLine } from 'react-icons/fa';
import * as attendanceService from '../services/attendanceService';
import * as studentService from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

const AttendanceTrends = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) fetchTrends();
    }, [user]);

    const fetchTrends = async () => {
        try {
            setLoading(true);
            let studentData;
            try {
                studentData = await studentService.getStudent(user.id);
            } catch (err) {
                if (err.response?.status === 404) {
                    throw new Error("Student profile is pending creation.");
                }
                throw err;
            }
            if (studentData && studentData.id) {
                const data = await attendanceService.getStudentStats(studentData.id);
                setStats(data);
            }
        } catch (err) {
            console.error("Failed to load trends:", err);
        } finally {
            setLoading(false);
        }
    };

    const getAttendanceStatus = (percentage) => {
        if (percentage >= 90) return 'success';
        if (percentage >= 75) return 'warning';
        return 'danger';
    };

    const subjects = stats?.subjects || [];

    return (
        <div className="dashboard">
            <Navbar />
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <button className="btn btn-outline" onClick={() => navigate('/student/dashboard')} style={{ marginBottom: '1rem' }}>
                        <FaArrowLeft /> Back to Dashboard
                    </button>
                    <div>
                        <h1 className="dashboard-title">Attendance Trends</h1>
                        <p className="dashboard-subtitle">Visual breakdown of your academic standing</p>
                    </div>
                </div>

                <div className="dashboard-section">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                            <p style={{ marginTop: '1rem' }}>Analyzing trends...</p>
                        </div>
                    ) : subjects.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
                            <FaChartLine style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
                            <p>Not enough data to graph trends.</p>
                        </div>
                    ) : (
                        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
                            {subjects.map((item, idx) => {
                                const pct = item.percentage ?? 0;
                                const statusClass = getAttendanceStatus(pct);

                                // Mock graph bars based on historical data could go here.
                                // We will draw a stylish large progress chart for each subject.
                                return (
                                    <div key={idx} style={{ padding: '2rem', background: 'var(--white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{item.subject}</h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '2rem', fontWeight: 700, color: `var(--${statusClass}-600)` }}>
                                                {pct.toFixed(1)}%
                                            </span>
                                            <span style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                                                {item.present} / {item.total} classes attended
                                            </span>
                                        </div>
                                        <div className="progress-bar" style={{ height: '12px', borderRadius: '12px', marginBottom: '1.5rem' }}>
                                            <div
                                                className={`progress-fill progress-${statusClass}`}
                                                style={{ width: `${pct}%`, borderRadius: '12px' }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {/* Simulate recent sparse attendance visualization */}
                                            {Array.from({ length: Math.min(10, item.total) }).map((_, i) => (
                                                <div key={i} style={{
                                                    flex: 1,
                                                    height: '40px',
                                                    borderRadius: '4px',
                                                    backgroundColor: i < (pct / 100) * Math.min(10, item.total) ? `var(--${statusClass}-400)` : 'var(--danger-100)',
                                                }} />
                                            ))}
                                        </div>
                                        <div style={{ textAlign: 'center', marginTop: '0.5rem', color: 'var(--gray-500)', fontSize: '0.8rem' }}>Recent Class History (simulated)</div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceTrends;
