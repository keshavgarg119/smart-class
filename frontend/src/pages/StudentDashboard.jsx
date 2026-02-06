import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { FaCheckCircle, FaTimesCircle, FaClock, FaChartLine } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        overallAttendance: 85.5,
        totalClasses: 120,
        present: 102,
        absent: 18,
        recentRecords: [
            { id: 1, subject: 'Data Structures', date: '2026-02-06', status: 'present' },
            { id: 2, subject: 'Web Development', date: '2026-02-06', status: 'present' },
            { id: 3, subject: 'Database Systems', date: '2026-02-05', status: 'absent' },
            { id: 4, subject: 'Computer Networks', date: '2026-02-05', status: 'present' },
            { id: 5, subject: 'Operating Systems', date: '2026-02-04', status: 'present' }
        ],
        subjectWise: [
            { subject: 'Data Structures', percentage: 92, status: 'good' },
            { subject: 'Web Development', percentage: 88, status: 'good' },
            { subject: 'Database Systems', percentage: 78, status: 'warning' },
            { subject: 'Computer Networks', percentage: 85, status: 'good' },
            { subject: 'Operating Systems', percentage: 82, status: 'good' }
        ]
    });

    const getAttendanceStatus = (percentage) => {
        if (percentage >= 90) return 'good';
        if (percentage >= 75) return 'warning';
        return 'danger';
    };

    return (
        <div className="dashboard">
            <Navbar />

            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Welcome back, {user?.name}!</h1>
                        <p className="dashboard-subtitle">Track your attendance and academic progress</p>
                    </div>
                </div>

                <div className="dashboard-stats grid grid-cols-4">
                    <StatCard
                        title="Overall Attendance"
                        value={`${stats.overallAttendance}%`}
                        icon={FaChartLine}
                        iconColor={getAttendanceStatus(stats.overallAttendance)}
                        trend={stats.overallAttendance >= 75 ? 'up' : 'down'}
                        trendValue={stats.overallAttendance >= 75 ? 'Above minimum' : 'Below minimum'}
                    />
                    <StatCard
                        title="Total Classes"
                        value={stats.totalClasses}
                        icon={FaClock}
                        iconColor="primary"
                        description="This semester"
                    />
                    <StatCard
                        title="Present"
                        value={stats.present}
                        icon={FaCheckCircle}
                        iconColor="success"
                        description={`${((stats.present / stats.totalClasses) * 100).toFixed(1)}% of classes`}
                    />
                    <StatCard
                        title="Absent"
                        value={stats.absent}
                        icon={FaTimesCircle}
                        iconColor="danger"
                        description={`${((stats.absent / stats.totalClasses) * 100).toFixed(1)}% of classes`}
                    />
                </div>

                <div className="dashboard-content-grid">
                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Subject-wise Attendance</h2>
                        </div>
                        <div className="subject-list">
                            {stats.subjectWise.map((subject, index) => (
                                <div key={index} className="subject-card">
                                    <div className="subject-info">
                                        <h3 className="subject-name">{subject.subject}</h3>
                                        <span className={`badge badge-${subject.status}`}>
                                            {subject.percentage}%
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className={`progress-fill progress-${subject.status}`}
                                            style={{ width: `${subject.percentage}%` }}
                                        />
                                    </div>
                                    <div className="subject-status-text">
                                        {subject.percentage >= 75
                                            ? '✓ Good standing'
                                            : '⚠ Below minimum requirement'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Recent Attendance</h2>
                        </div>
                        <div className="recent-list">
                            {stats.recentRecords.map((record) => (
                                <div key={record.id} className="recent-item">
                                    <div className="recent-icon-wrapper">
                                        {record.status === 'present' ? (
                                            <FaCheckCircle className="recent-icon success" />
                                        ) : (
                                            <FaTimesCircle className="recent-icon danger" />
                                        )}
                                    </div>
                                    <div className="recent-details">
                                        <div className="recent-subject">{record.subject}</div>
                                        <div className="recent-date">{new Date(record.date).toLocaleDateString()}</div>
                                    </div>
                                    <span className={`badge badge-${record.status === 'present' ? 'success' : 'danger'}`}>
                                        {record.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {stats.overallAttendance < 75 && (
                    <div className="alert alert-warning">
                        <strong>⚠ Attendance Alert:</strong> Your attendance is below the minimum requirement of 75%.
                        Please improve your attendance to avoid academic penalties.
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
