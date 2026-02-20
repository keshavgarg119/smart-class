import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import { FaUsers, FaChalkboardTeacher, FaChartBar, FaUserCheck, FaPlus, FaFileAlt, FaUsersCog, FaTrash, FaEdit } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import * as studentService from '../services/studentService';
import * as attendanceService from '../services/attendanceService';
import '../styles/dashboard.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalAttendance: 0,
        presentToday: 0,
        avgAttendance: 0,
    });
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [studentsData, allRecords] = await Promise.all([
                studentService.getAllStudents(0, 200),
                attendanceService.getAttendanceRecords({ limit: 200 }),
            ]);

            // Calculate today's present count
            const today = new Date().toISOString().split('T')[0];
            const todayPresent = allRecords.filter(r =>
                r.class_date?.startsWith(today) && r.status === 'present'
            ).length;

            // Average attendance across all records
            const presentTotal = allRecords.filter(r => r.status === 'present').length;
            const avgPct = allRecords.length > 0
                ? ((presentTotal / allRecords.length) * 100).toFixed(1)
                : 0;

            setStats({
                totalStudents: studentsData.length,
                totalAttendance: allRecords.length,
                presentToday: todayPresent,
                avgAttendance: avgPct,
            });
            setStudents(studentsData);
        } catch (err) {
            setError('Failed to load dashboard data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStudent = async (studentId) => {
        if (!window.confirm('Are you sure you want to delete this student?')) return;
        try {
            await studentService.deleteStudent(studentId);
            setStudents(prev => prev.filter(s => s.id !== studentId));
        } catch {
            alert('Failed to delete student.');
        }
    };

    const columns = [
        { key: 'full_name', label: 'Name', sortable: true },
        { key: 'student_id', label: 'Student ID', sortable: true },
        { key: 'department', label: 'Department', sortable: true },
        {
            key: 'year',
            label: 'Year',
            render: (value) => `Year ${value || '—'}`
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteStudent(row.id)}>
                        <FaTrash /> Delete
                    </button>
                </div>
            )
        }
    ];

    const quickActions = [
        { title: 'Manage Users', description: 'Add or edit students and teachers', icon: FaUsersCog, onClick: () => alert('Coming soon!') },
        { title: 'Manage Classes', description: 'Set up classes and subjects', icon: FaChalkboardTeacher, onClick: () => alert('Coming soon!') },
        { title: 'View Reports', description: 'Generate attendance reports', icon: FaFileAlt, onClick: () => alert('Coming soon!') },
        { title: 'Add New User', description: 'Register a new student or teacher', icon: FaPlus, onClick: () => alert('Coming soon!') },
    ];

    return (
        <div className="dashboard">
            <Navbar />

            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Admin Dashboard</h1>
                        <p className="dashboard-subtitle">
                            Welcome, {user?.full_name || user?.username} — manage your institution's attendance system
                        </p>
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
                            <StatCard title="Total Students" value={stats.totalStudents} icon={FaUsers} iconColor="primary" />
                            <StatCard title="Total Attendance Records" value={stats.totalAttendance} icon={FaChartBar} iconColor="warning" />
                            <StatCard title="Present Today" value={stats.presentToday} icon={FaUserCheck} iconColor="success" description="Marked today" />
                            <StatCard title="Avg. Attendance" value={`${stats.avgAttendance}%`} icon={FaChalkboardTeacher} iconColor="success" trend="up" trendValue="Overall" />
                        </div>

                        <div className="section-header" style={{ marginTop: 'var(--spacing-xl)' }}>
                            <h2>Quick Actions</h2>
                        </div>
                        <div className="quick-actions">
                            {quickActions.map((action, index) => (
                                <div key={index} className="quick-action-card" onClick={action.onClick}>
                                    <div className="quick-action-icon"><action.icon /></div>
                                    <h3 className="quick-action-title">{action.title}</h3>
                                    <p className="quick-action-description">{action.description}</p>
                                </div>
                            ))}
                        </div>

                        <div className="dashboard-section" style={{ marginTop: 'var(--spacing-xl)' }}>
                            <div className="section-header">
                                <h2>Registered Students</h2>
                            </div>
                            {students.length === 0 ? (
                                <p style={{ color: 'var(--gray-500)', padding: '1rem' }}>No students registered yet.</p>
                            ) : (
                                <DataTable
                                    columns={columns}
                                    data={students}
                                    searchable={true}
                                    pagination={true}
                                    itemsPerPage={8}
                                />
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
