import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import { FaArrowLeft, FaCalendarAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import * as attendanceService from '../services/attendanceService';
import * as studentService from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

const AttendanceHistory = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user?.id) fetchHistory();
    }, [user]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            let studentData;
            try {
                studentData = await studentService.getStudent(user.id);
            } catch (err) {
                // Ignore failure if it gets auto-resolved or let the backend auto-create logic handle it
                if (err.response?.status === 404) {
                    throw new Error("Student profile is pending creation.");
                }
                throw err;
            }

            if (studentData && studentData.id) {
                const data = await attendanceService.getAttendanceRecords({ studentId: studentData.id, limit: 1000 });
                data.sort((a, b) => new Date(b.class_date) - new Date(a.class_date));
                setRecords(data);
            }
        } catch (err) {
            console.error("Failed to load history:", err);
            setError("Failed to load attendance history.");
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            key: 'class_date',
            label: 'Date',
            sortable: true,
            render: (val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
        },
        {
            key: 'class_time',
            label: 'Time',
            render: (_, row) => new Date(row.class_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        { key: 'subject', label: 'Subject', sortable: true },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (status) => (
                <span className={`status-badge ${status === 'present' ? 'active' : status === 'absent' ? 'pending' : 'completed'}`}
                    style={{
                        backgroundColor: status === 'present' ? 'var(--success-100)' : status === 'absent' ? 'var(--danger-100)' : 'var(--warning-100)',
                        color: status === 'present' ? 'var(--success-700)' : status === 'absent' ? 'var(--danger-700)' : 'var(--warning-700)'
                    }}>
                    {status === 'present' ? <><FaCheckCircle style={{ marginRight: '4px' }} /> Present</> : <><FaTimesCircle style={{ marginRight: '4px' }} /> Absent</>}
                </span>
            )
        },
        { key: 'marked_by', label: 'Marked By' },
    ];

    return (
        <div className="dashboard">
            <Navbar />
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <button className="btn btn-outline" onClick={() => navigate('/student/dashboard')} style={{ marginBottom: '1rem' }}>
                        <FaArrowLeft /> Back to Dashboard
                    </button>
                    <div>
                        <h1 className="dashboard-title">Attendance History</h1>
                        <p className="dashboard-subtitle">A detailed log of all your previous classes</p>
                    </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <div className="dashboard-section">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                            <p style={{ marginTop: '1rem' }}>Loading history...</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={records}
                            searchable={true}
                            pagination={true}
                            itemsPerPage={12}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceHistory;
