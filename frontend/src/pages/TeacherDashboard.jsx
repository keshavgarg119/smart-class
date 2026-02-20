import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { FaUsers, FaCalendarCheck, FaChartLine, FaExclamationTriangle, FaCamera, FaEye, FaChartBar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import * as attendanceService from '../services/attendanceService';
import * as studentService from '../services/studentService';
import '../styles/dashboard.css';

const TeacherDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalStudents: 0,
        classesToday: 0,
        attendanceMarked: 0,
        defaulters: 0,
    });
    const [recentRecords, setRecentRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch students and recent attendance
            const [students, records] = await Promise.all([
                studentService.getAllStudents(0, 200),
                attendanceService.getAttendanceRecords({ limit: 50 }),
            ]);

            // Calculate today's stats
            const today = new Date().toISOString().split('T')[0];
            const todayRecords = records.filter(r =>
                r.class_date && r.class_date.startsWith(today)
            );

            // Count defaulters — simplified: students with low attendance
            const defaulters = 0; // would need per-student stats

            setStats({
                totalStudents: students.length,
                classesToday: todayRecords.length > 0 ? 1 : 0,
                attendanceMarked: todayRecords.length,
                defaulters,
            });
            setRecentRecords(records.slice(0, 8));
        } catch (err) {
            setError('Failed to load dashboard data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        {
            title: 'Mark Attendance',
            description: 'Use face recognition to mark attendance',
            icon: FaCamera,
            color: 'primary',
            onClick: () => navigate('/teacher/mark-attendance')
        },
        {
            title: 'View Attendance',
            description: 'Check past attendance records',
            icon: FaEye,
            color: 'success',
            onClick: () => navigate('/teacher/view-attendance')
        },
        {
            title: 'Class Analytics',
            description: 'View detailed analytics and trends',
            icon: FaChartBar,
            color: 'warning',
            onClick: () => alert('Analytics coming soon!')
        }
    ];

    return (
        <div className="dashboard">
            <Navbar />

            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">
                            Welcome, {user?.full_name || user?.username}!
                        </h1>
                        <p className="dashboard-subtitle">Manage your classes and track attendance</p>
                    </div>
                    <button className="btn btn-outline" onClick={fetchData}>↻ Refresh</button>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                        <p style={{ marginTop: '1rem', color: 'var(--gray-500)' }}>Loading dashboard…</p>
                    </div>
                ) : (
                    <>
                        <div className="dashboard-stats grid grid-cols-4">
                            <StatCard title="Total Students" value={stats.totalStudents} icon={FaUsers} iconColor="primary" description="Registered in system" />
                            <StatCard title="Classes Today" value={stats.classesToday} icon={FaCalendarCheck} iconColor="success" description={`${stats.attendanceMarked} records marked`} />
                            <StatCard title="Attendance Marked" value={stats.attendanceMarked} icon={FaChartLine} iconColor="warning" trend="up" trendValue="Today" />
                            <StatCard title="Defaulters" value={stats.defaulters} icon={FaExclamationTriangle} iconColor="danger" description="Below 75% attendance" />
                        </div>

                        <div className="section-header" style={{ marginTop: 'var(--spacing-xl)' }}>
                            <h2>Quick Actions</h2>
                        </div>
                        <div className="quick-actions">
                            {quickActions.map((action, index) => (
                                <div key={index} className="quick-action-card" onClick={action.onClick}>
                                    <div className="quick-action-icon">
                                        <action.icon />
                                    </div>
                                    <h3 className="quick-action-title">{action.title}</h3>
                                    <p className="quick-action-description">{action.description}</p>
                                </div>
                            ))}
                        </div>

                        <div className="dashboard-section" style={{ marginTop: 'var(--spacing-xl)' }}>
                            <div className="section-header">
                                <h2>Recent Attendance Records</h2>
                            </div>
                            {recentRecords.length === 0 ? (
                                <p style={{ color: 'var(--gray-500)', padding: '1rem' }}>No attendance records yet.</p>
                            ) : (
                                <div className="subject-list">
                                    {recentRecords.map((record) => {
                                        const pct = record.confidence_score ?? 100;
                                        return (
                                            <div key={record.id} className="subject-card">
                                                <div className="subject-info">
                                                    <div>
                                                        <h3 className="subject-name">{record.subject || 'General'}</h3>
                                                        <div className="subject-status-text">
                                                            Student ID: {record.student_id} •{' '}
                                                            {new Date(record.class_date).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <span className={`badge badge-${record.status === 'present' ? 'success' : 'danger'}`}>
                                                        {record.status}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;
