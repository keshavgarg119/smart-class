import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { FaUsers, FaCalendarCheck, FaChartLine, FaExclamationTriangle, FaCamera, FaEye, FaChartBar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/constants';
import '../styles/dashboard.css';

const TeacherDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats] = useState({
        totalStudents: 145,
        classesToday: 3,
        attendanceMarked: 2,
        defaulters: 8,
        todaySchedule: [
            { id: 1, subject: 'Data Structures', time: '09:00 AM - 10:00 AM', room: 'Lab 301', status: 'completed' },
            { id: 2, subject: 'Web Development', time: '11:00 AM - 12:00 PM', room: 'Room 205', status: 'completed' },
            { id: 3, subject: 'Database Systems', time: '02:00 PM - 03:00 PM', room: 'Room 108', status: 'upcoming' }
        ],
        recentAttendance: [
            { id: 1, class: 'Data Structures - Section A', date: '2026-02-06', present: 42, absent: 3, percentage: 93 },
            { id: 2, class: 'Web Development - Section B', date: '2026-02-06', present: 38, absent: 7, percentage: 84 },
            { id: 3, class: 'Database Systems - Section A', date: '2026-02-05', present: 40, absent: 5, percentage: 89 },
            { id: 4, class: 'Data Structures - Section B', date: '2026-02-05', present: 35, absent: 10, percentage: 78 }
        ]
    });

    const quickActions = [
        {
            title: 'Mark Attendance',
            description: 'Use face recognition to mark attendance',
            icon: FaCamera,
            onClick: () => navigate(ROUTES.MARK_ATTENDANCE),
            color: 'primary'
        },
        {
            title: 'View Attendance',
            description: 'Check past attendance records',
            icon: FaEye,
            onClick: () => navigate(ROUTES.VIEW_ATTENDANCE),
            color: 'success'
        },
        {
            title: 'Class Analytics',
            description: 'View detailed analytics and trends',
            icon: FaChartBar,
            onClick: () => navigate(ROUTES.CLASS_ANALYTICS),
            color: 'warning'
        }
    ];

    return (
        <div className="dashboard">
            <Navbar />

            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Welcome, {user?.name}!</h1>
                        <p className="dashboard-subtitle">Manage your classes and track attendance</p>
                    </div>
                </div>

                <div className="dashboard-stats grid grid-cols-4">
                    <StatCard
                        title="Total Students"
                        value={stats.totalStudents}
                        icon={FaUsers}
                        iconColor="primary"
                        description="Across all classes"
                    />
                    <StatCard
                        title="Classes Today"
                        value={stats.classesToday}
                        icon={FaCalendarCheck}
                        iconColor="success"
                        description={`${stats.attendanceMarked} attendance marked`}
                    />
                    <StatCard
                        title="Attendance Marked"
                        value={stats.attendanceMarked}
                        icon={FaChartLine}
                        iconColor="warning"
                        trend="up"
                        trendValue="On schedule"
                    />
                    <StatCard
                        title="Defaulters"
                        value={stats.defaulters}
                        icon={FaExclamationTriangle}
                        iconColor="danger"
                        description="Below 75% attendance"
                    />
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

                <div className="dashboard-content-grid">
                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Today's Schedule</h2>
                        </div>
                        <div className="subject-list">
                            {stats.todaySchedule.map((schedule) => (
                                <div key={schedule.id} className="subject-card">
                                    <div className="subject-info">
                                        <div>
                                            <h3 className="subject-name">{schedule.subject}</h3>
                                            <div className="subject-status-text">{schedule.time} • {schedule.room}</div>
                                        </div>
                                        <span className={`badge badge-${schedule.status === 'completed' ? 'success' : 'primary'}`}>
                                            {schedule.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Recent Attendance</h2>
                        </div>
                        <div className="subject-list">
                            {stats.recentAttendance.map((record) => (
                                <div key={record.id} className="subject-card">
                                    <div className="subject-info">
                                        <h3 className="subject-name">{record.class}</h3>
                                        <span className={`badge badge-${record.percentage >= 85 ? 'success' : 'warning'}`}>
                                            {record.percentage}%
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className={`progress-fill progress-${record.percentage >= 85 ? 'success' : 'warning'}`}
                                            style={{ width: `${record.percentage}%` }}
                                        />
                                    </div>
                                    <div className="subject-status-text">
                                        Present: {record.present} • Absent: {record.absent} • {record.date}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
