import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { FaCheckCircle, FaTimesCircle, FaClock, FaChartLine } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import * as attendanceService from '../services/attendanceService';
import '../styles/dashboard.css';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user?.id) fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [statsData, recordsData] = await Promise.all([
                attendanceService.getStudentStats(user.id),
                attendanceService.getAttendanceRecords({ studentId: user.id, limit: 10 }),
            ]);
            setStats(statsData);
            setRecords(recordsData);
        } catch (err) {
            setError('Failed to load attendance data. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getAttendanceStatus = (percentage) => {
        if (percentage >= 90) return 'success';
        if (percentage >= 75) return 'warning';
        return 'danger';
    };

    const overallPct = stats?.percentage ?? 0;
    const totalClasses = stats?.total_classes ?? 0;
    const present = stats?.present ?? 0;
    const absent = stats?.absent ?? 0;
    const subjects = stats?.subjects ?? [];

    return (
        <div className="dashboard">
            <Navbar />

            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">
                            Welcome back, {user?.full_name || user?.username}!
                        </h1>
                        <p className="dashboard-subtitle">Track your attendance and academic progress</p>
                    </div>
                    <button className="btn btn-outline" onClick={fetchData}>↻ Refresh</button>
                </div>

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="loading-wrapper" style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                        <p style={{ marginTop: '1rem', color: 'var(--gray-500)' }}>Loading your data…</p>
                    </div>
                ) : (
                    <>
                        <div className="dashboard-stats grid grid-cols-4">
                            <StatCard
                                title="Overall Attendance"
                                value={`${overallPct.toFixed(1)}%`}
                                icon={FaChartLine}
                                iconColor={getAttendanceStatus(overallPct)}
                                trend={overallPct >= 75 ? 'up' : 'down'}
                                trendValue={overallPct >= 75 ? 'Above minimum' : 'Below minimum'}
                            />
                            <StatCard
                                title="Total Classes"
                                value={totalClasses}
                                icon={FaClock}
                                iconColor="primary"
                                description="This semester"
                            />
                            <StatCard
                                title="Present"
                                value={present}
                                icon={FaCheckCircle}
                                iconColor="success"
                                description={totalClasses ? `${((present / totalClasses) * 100).toFixed(1)}% of classes` : '—'}
                            />
                            <StatCard
                                title="Absent"
                                value={absent}
                                icon={FaTimesCircle}
                                iconColor="danger"
                                description={totalClasses ? `${((absent / totalClasses) * 100).toFixed(1)}% of classes` : '—'}
                            />
                        </div>

                        <div className="dashboard-content-grid">
                            {/* Subject-wise breakdown */}
                            <div className="dashboard-section">
                                <div className="section-header">
                                    <h2>Subject-wise Attendance</h2>
                                </div>
                                {subjects.length === 0 ? (
                                    <p style={{ color: 'var(--gray-500)', padding: '1rem' }}>
                                        No subject data available yet.
                                    </p>
                                ) : (
                                    <div className="subject-list">
                                        {subjects.map((subject, index) => {
                                            const pct = subject.percentage ?? 0;
                                            const statusClass = getAttendanceStatus(pct);
                                            return (
                                                <div key={index} className="subject-card">
                                                    <div className="subject-info">
                                                        <h3 className="subject-name">{subject.subject}</h3>
                                                        <span className={`badge badge-${statusClass}`}>{pct.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="progress-bar">
                                                        <div
                                                            className={`progress-fill progress-${statusClass}`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <div className="subject-status-text">
                                                        {pct >= 75 ? '✓ Good standing' : '⚠ Below minimum requirement'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Recent records */}
                            <div className="dashboard-section">
                                <div className="section-header">
                                    <h2>Recent Attendance</h2>
                                </div>
                                {records.length === 0 ? (
                                    <p style={{ color: 'var(--gray-500)', padding: '1rem' }}>
                                        No attendance records found.
                                    </p>
                                ) : (
                                    <div className="recent-list">
                                        {records.map((record) => (
                                            <div key={record.id} className="recent-item">
                                                <div className="recent-icon-wrapper">
                                                    {record.status === 'present' ? (
                                                        <FaCheckCircle className="recent-icon success" style={{ color: 'var(--success-600)' }} />
                                                    ) : (
                                                        <FaTimesCircle className="recent-icon danger" style={{ color: 'var(--danger-600)' }} />
                                                    )}
                                                </div>
                                                <div className="recent-details">
                                                    <div className="recent-subject">{record.subject || 'General'}</div>
                                                    <div className="recent-date">
                                                        {new Date(record.class_date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <span className={`badge badge-${record.status === 'present' ? 'success' : 'danger'}`}>
                                                    {record.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {overallPct < 75 && totalClasses > 0 && (
                            <div className="alert alert-warning">
                                <strong>⚠ Attendance Alert:</strong> Your attendance is below the minimum 75% requirement.
                                Please improve your attendance to avoid academic penalties.
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
