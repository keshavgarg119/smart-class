import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import { FaUsers, FaChalkboardTeacher, FaChartBar, FaUserCheck, FaPlus, FaFileAlt, FaUsersCog } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/constants';
import '../styles/dashboard.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats] = useState({
        totalStudents: 1245,
        totalTeachers: 58,
        totalClasses: 125,
        averageAttendance: 87.3,
        recentActivities: [
            { id: 1, type: 'user', message: 'New student registered: John Doe', time: '5 min ago' },
            { id: 2, type: 'attendance', message: 'Attendance marked for CS101', time: '12 min ago' },
            { id: 3, type: 'report', message: 'Monthly report generated', time: '1 hour ago' },
            { id: 4, type: 'user', message: 'Teacher Sarah updated class schedule', time: '2 hours ago' }
        ]
    });

    const [recentUsers] = useState([
        { id: 1, name: 'Alice Johnson', role: 'Student', department: 'Computer Science', status: 'active' },
        { id: 2, name: 'Bob Smith', role: 'Teacher', department: 'Information Technology', status: 'active' },
        { id: 3, name: 'Carol White', role: 'Student', department: 'Electronics', status: 'inactive' },
        { id: 4, name: 'David Brown', role: 'Student', department: 'Computer Science', status: 'active' },
        { id: 5, name: 'Emma Davis', role: 'Teacher', department: 'Mechanical', status: 'active' }
    ]);

    const columns = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'role', label: 'Role', sortable: true },
        { key: 'department', label: 'Department', sortable: true },
        {
            key: 'status',
            label: 'Status',
            render: (value) => (
                <span className={`badge badge-${value === 'active' ? 'success' : 'gray'}`}>
                    {value}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-sm btn-primary">Edit</button>
                    <button className="btn btn-sm btn-danger">Delete</button>
                </div>
            )
        }
    ];

    const quickActions = [
        {
            title: 'Manage Users',
            description: 'Add or edit students and teachers',
            icon: FaUsersCog,
            onClick: () => navigate(ROUTES.MANAGE_USERS)
        },
        {
            title: 'Manage Classes',
            description: 'Set up classes and subjects',
            icon: FaChalkboardTeacher,
            onClick: () => navigate(ROUTES.MANAGE_CLASSES)
        },
        {
            title: 'View Reports',
            description: 'Generate attendance reports',
            icon: FaFileAlt,
            onClick: () => navigate(ROUTES.SYSTEM_REPORTS)
        },
        {
            title: 'Add New User',
            description: 'Register a new student or teacher',
            icon: FaPlus,
            onClick: () => alert('Add User functionality')
        }
    ];

    return (
        <div className="dashboard">
            <Navbar />

            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Admin Dashboard</h1>
                        <p className="dashboard-subtitle">Manage your institution's attendance system</p>
                    </div>
                </div>

                <div className="dashboard-stats grid grid-cols-4">
                    <StatCard
                        title="Total Students"
                        value={stats.totalStudents}
                        icon={FaUsers}
                        iconColor="primary"
                        trend="up"
                        trendValue="+12 this month"
                    />
                    <StatCard
                        title="Total Teachers"
                        value={stats.totalTeachers}
                        icon={FaChalkboardTeacher}
                        iconColor="success"
                        description="Active faculty"
                    />
                    <StatCard
                        title="Total Classes"
                        value={stats.totalClasses}
                        icon={FaChartBar}
                        iconColor="warning"
                        description="Active this semester"
                    />
                    <StatCard
                        title="Avg. Attendance"
                        value={`${stats.averageAttendance}%`}
                        icon={FaUserCheck}
                        iconColor="success"
                        trend="up"
                        trendValue="+2.5% from last month"
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
                            <h2>Recent Activity</h2>
                        </div>
                        <div className="recent-list">
                            {stats.recentActivities.map((activity) => (
                                <div key={activity.id} className="recent-item">
                                    <div className="recent-icon-wrapper">
                                        <FaUserCheck className="recent-icon success" />
                                    </div>
                                    <div className="recent-details">
                                        <div className="recent-subject">{activity.message}</div>
                                        <div className="recent-date">{activity.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Recent Users</h2>
                        </div>
                        <DataTable
                            columns={columns}
                            data={recentUsers}
                            searchable={false}
                            pagination={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
