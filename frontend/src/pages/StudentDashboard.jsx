import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { FaCheckCircle, FaTimesCircle, FaClock, FaChartLine, FaUserCog, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import * as attendanceService from '../services/attendanceService';
import * as studentService from '../services/studentService';
import FaceRegistration from '../components/FaceRegistration';
import AttendanceHeatmap from '../components/AttendanceHeatmap';
import api from '../services/api';
import '../styles/dashboard.css';

const StudentDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [records, setRecords] = useState([]);
    const [hasFaceEncoding, setHasFaceEncoding] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [heatmapData, setHeatmapData] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [todaySchedule, setTodaySchedule] = useState([]);

    useEffect(() => {
        if (user?.id) fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const studentData = await studentService.getStudent(user.id);
            const studentId = studentData.id;

            const [statsData, recordsData] = await Promise.all([
                attendanceService.getStudentStats(studentId),
                attendanceService.getAttendanceRecords({ studentId: studentId, limit: 10 }),
            ]);
            setStats(statsData);
            setRecords(recordsData);
            setHasFaceEncoding(studentData?.has_face_encoding ?? false);

            // Fetch heatmap, prediction, and timetable
            try {
                const [heatRes, predRes, timetableRes] = await Promise.all([
                    api.get(`/attendance/student/${studentId}/heatmap`),
                    api.get(`/attendance/student/${studentId}/prediction`),
                    api.get(`/timetable/?department=${studentData.department}&semester=${studentData.year}&batch=${studentData.batch || ''}`)
                ]);
                setHeatmapData(heatRes.data);
                setPrediction(predRes.data);

                // Filter timetable for today
                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const todayName = days[new Date().getDay()];
                const todaysClasses = timetableRes.data
                    .filter(c => c.day === todayName)
                    .sort((a, b) => a.time_slot.localeCompare(b.time_slot));

                setTodaySchedule(todaysClasses);
            } catch (e) {
                console.warn('Additional data unavailable', e);
            }
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
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline" onClick={() => navigate('/student/profile')}><FaUserCog /> Profile</button>
                        <button className="btn btn-outline" onClick={fetchData}>↻ Refresh</button>
                    </div>
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
                ) : !hasFaceEncoding ? (
                    <div style={{ padding: '2rem 0' }}>
                        <FaceRegistration
                            studentId={user.id}
                            onComplete={() => setHasFaceEncoding(true)}
                        />
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

                        {/* Today's Schedule Widget */}
                        <div className="dashboard-section" style={{ marginBottom: '1.5rem' }}>
                            <div className="section-header">
                                <h2>Today's Schedule</h2>
                            </div>
                            {todaySchedule.length === 0 ? (
                                <p style={{ color: 'var(--gray-500)', padding: '1rem', fontStyle: 'italic' }}>
                                    No classes scheduled for today. Enjoy your day!
                                </p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                    {todaySchedule.map(cls => (
                                        <div key={cls.id} style={{
                                            background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
                                            borderRadius: 'var(--radius-md)', padding: '1rem',
                                            display: 'flex', flexDirection: 'column', gap: '0.5rem'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{cls.time_slot}</span>
                                                <span className="badge badge-primary">{cls.type}</span>
                                            </div>
                                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{cls.subject}</h3>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{cls.room}</span>
                                                <span>Prof. {cls.teacher}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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

                        {/* Prediction Card */}
                        {prediction && prediction.current > 0 && (
                            <div className="dashboard-section" style={{ marginTop: '1.5rem' }}>
                                <div className="section-header">
                                    <h2>Attendance Prediction</h2>
                                </div>
                                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>Current</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: prediction.current >= 75 ? 'var(--success-600)' : 'var(--danger-600)' }}>
                                            {prediction.current}%
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '1.5rem', color: 'var(--gray-400)' }}>→</div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>Predicted</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: prediction.predicted >= 75 ? 'var(--success-600)' : 'var(--danger-600)' }}>
                                            {prediction.predicted}%
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: prediction.trend === 'improving' ? 'var(--success-600)' : 'var(--danger-600)' }}>
                                        {prediction.trend === 'improving' ? <FaArrowUp /> : <FaArrowDown />}
                                        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{prediction.trend}</span>
                                    </div>
                                    {prediction.at_risk && (
                                        <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>AT RISK</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Heatmap */}
                        <div className="dashboard-section" style={{ marginTop: '1.5rem' }}>
                            <div className="section-header">
                                <h2>Attendance Heatmap (6 Months)</h2>
                            </div>
                            <AttendanceHeatmap data={heatmapData} />
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
