import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaCalendarAlt, FaBookOpen, FaFilter, FaArrowLeft, FaSearch } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import * as attendanceService from '../services/attendanceService';
import * as studentService from '../services/studentService';
import '../styles/dashboard.css';

const ViewAttendance = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Data state
    const [records, setRecords] = useState([]);
    const [students, setStudents] = useState({}); // Map of id -> student details
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter state
    const [dateFilter, setDateFilter] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });

    const SUBJECTS = [
        'Mathematics',
        'Physics',
        'Chemistry',
        'Computer Science',
        'English',
        'Electronics'
    ];

    useEffect(() => {
        fetchData();
    }, []);

    // Re-fetch when filters change (or we could filter client-side if data is small)
    // For now, let's fetch all and filter client-side to reduce API calls
    // unless date is specified, then we should filter by date on server if possible.
    // The current API supports start_date/end_date.

    useEffect(() => {
        if (!loading) {
            calculateStats();
        }
    }, [records, dateFilter, subjectFilter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // 1. Fetch all students to map IDs to names
            const studentsList = await studentService.getAllStudents(0, 500);
            const studentMap = {};
            studentsList.forEach(s => {
                studentMap[s.id] = s;
            });
            setStudents(studentMap);

            // 2. Fetch attendance records
            // We fetch a larger batch for viewing
            const attData = await attendanceService.getAttendanceRecords({ limit: 500 });

            // Sort by date descending
            attData.sort((a, b) => new Date(b.class_date) - new Date(a.class_date));

            setRecords(attData);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to load attendance data');
            setLoading(false);
        }
    };

    const getFilteredRecords = () => {
        return records.filter(record => {
            // Filter by Date
            if (dateFilter) {
                const recordDate = record.class_date.split('T')[0];
                if (recordDate !== dateFilter) return false;
            }

            // Filter by Subject
            if (subjectFilter) {
                if (record.subject !== subjectFilter) return false;
            }

            return true;
        });
    };

    const calculateStats = () => {
        const filtered = getFilteredRecords();
        const newStats = {
            present: 0,
            absent: 0,
            late: 0,
            total: filtered.length
        };

        filtered.forEach(r => {
            if (r.status === 'present') newStats.present++;
            else if (r.status === 'absent') newStats.absent++;
            else if (r.status === 'late') newStats.late++;
        });

        setStats(newStats);
    };

    const filteredRecords = getFilteredRecords();

    return (
        <div className="dashboard">
            <Navbar />

            <div className="dashboard-container">
                <div className="dashboard-header">
                    <button className="btn btn-outline" onClick={() => navigate('/teacher/dashboard')} style={{ marginBottom: '1rem' }}>
                        <FaArrowLeft /> Back to Dashboard
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 className="dashboard-title">View Attendance</h1>
                            <p className="dashboard-subtitle">Browse and filter attendance records</p>
                        </div>

                        <div className="dashboard-stats" style={{ display: 'flex', gap: '1rem', marginBottom: 0 }}>
                            <div className="stat-card" style={{ padding: '1rem', minWidth: '150px' }}>
                                <div className="stat-title">Present</div>
                                <div className="stat-value" style={{ color: 'var(--success-600)' }}>{stats.present}</div>
                            </div>
                            <div className="stat-card" style={{ padding: '1rem', minWidth: '150px' }}>
                                <div className="stat-title">Absent</div>
                                <div className="stat-value" style={{ color: 'var(--danger-600)' }}>{stats.absent}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <div className="dashboard-section">
                    <div className="filters" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1.5rem',
                        marginBottom: '2rem',
                        padding: '1.5rem',
                        background: 'var(--gray-50)',
                        borderRadius: 'var(--radius-md)'
                    }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FaCalendarAlt /> Filter by Date
                            </label>
                            <input
                                type="date"
                                className="form-input"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FaBookOpen /> Filter by Subject
                            </label>
                            <select
                                className="form-select"
                                value={subjectFilter}
                                onChange={(e) => setSubjectFilter(e.target.value)}
                            >
                                <option value="">All Subjects</option>
                                {SUBJECTS.map(subj => (
                                    <option key={subj} value={subj}>{subj}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'flex-end' }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => { setDateFilter(''); setSubjectFilter(''); }}
                                style={{ width: '100%' }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                            <p style={{ marginTop: '1rem' }}>Loading records...</p>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
                            <FaSearch style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
                            <p>No attendance records found for current filters.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Subject</th>
                                        <th>Student Name</th>
                                        <th>Student ID</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.map(record => {
                                        const student = students[record.student_id];
                                        return (
                                            <tr key={record.id}>
                                                <td>
                                                    {new Date(record.class_date).toLocaleDateString()}
                                                    <span style={{ fontSize: '0.8em', color: 'var(--gray-500)', marginLeft: '0.5rem' }}>
                                                        {new Date(record.class_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>
                                                <td>{record.subject || 'General'}</td>
                                                <td>{student ? student.full_name : 'Unknown Student'}</td>
                                                <td>{student ? student.student_id : record.student_id}</td>
                                                <td>
                                                    <span className={`status-badge ${record.status === 'present' ? 'active' : record.status === 'absent' ? 'pending' : 'completed'}`}
                                                        style={{
                                                            backgroundColor: record.status === 'present' ? 'var(--success-100)' : record.status === 'absent' ? 'var(--danger-100)' : 'var(--warning-100)',
                                                            color: record.status === 'present' ? 'var(--success-700)' : record.status === 'absent' ? 'var(--danger-700)' : 'var(--warning-700)'
                                                        }}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewAttendance;
