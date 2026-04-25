import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaUserCheck, FaUserTimes, FaClock, FaCheck, FaArrowLeft, FaSave } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import * as studentService from '../services/studentService';
import * as attendanceService from '../services/attendanceService';
import FaceAttendance from '../components/FaceAttendance';
import { DEPARTMENTS, generateBatches } from '../utils/constants';
import '../styles/dashboard.css';

const MarkAttendance = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [subject, setSubject] = useState('');
    const [attendanceData, setAttendanceData] = useState({}); // { studentId: status }

    // Tabs
    const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'face'

    // Filters
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');

    const SUBJECTS = [
        'Mathematics',
        'Physics',
        'Chemistry',
        'Computer Science',
        'English',
        'Electronics'
    ];

    const SEMESTERS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

    // Dynamic batch list from selected semester + department
    const semMap = { '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5, '6th': 6, '7th': 7, '8th': 8 };
    const availableBatches = generateBatches(semMap[selectedSemester] || 0, selectedDept);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            // Fetch all students for now (pagination could be added later)
            const data = await studentService.getAllStudents(0, 100);
            setStudents(data);

            // Initialize all students as PRESENT by default
            const initialAttendance = {};
            data.forEach(student => {
                initialAttendance[student.id] = 'present';
            });
            setAttendanceData(initialAttendance);

            setLoading(false);
        } catch (err) {
            setError('Failed to load students');
            setLoading(false);
            console.error(err);
        }
    };

    const getFilteredStudents = () => {
        return students.filter(student => {
            if (selectedDept && student.department !== selectedDept) return false;
            if (selectedSemester) {
                const semMap = { '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5, '6th': 6, '7th': 7, '8th': 8 };
                const yearNum = semMap[selectedSemester];
                if (yearNum && student.year != yearNum) return false;
            }
            if (selectedBatch && student.batch !== selectedBatch) return false;
            return true;
        });
    };

    const filteredStudents = getFilteredStudents();

    const handleMarkAll = (status) => {
        const newAttendance = { ...attendanceData };
        filteredStudents.forEach(student => {
            newAttendance[student.id] = status;
        });
        setAttendanceData(newAttendance);
    };

    const handleStatusChange = (studentId, status) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!subject) {
            setError('Please select a subject');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            // Process filtered students only
            const promises = filteredStudents.map(student => {
                const status = attendanceData[student.id];
                return attendanceService.markAttendance({
                    student_id: student.id,
                    subject: subject,
                    status: status,
                    marked_by: user.id || 1, // Fallback if user.id is missing
                    remarks: 'Manual entry'
                });
            });

            await Promise.all(promises);

            setSuccess(true);
            setSubmitting(false);

            // Redirect after delay
            setTimeout(() => {
                navigate('/teacher/dashboard');
            }, 2000);

        } catch (err) {
            setError('Failed to submit attendance. Please try again.');
            setSubmitting(false);
            console.error(err);
        }
    };

    if (loading) return (
        <div className="dashboard">
            <Navbar />
            <div className="dashboard-container" style={{ textAlign: 'center', marginTop: '4rem' }}>
                <div className="spinner"></div>
                <p>Loading students...</p>
            </div>
        </div>
    );

    return (
        <div className="dashboard">
            <Navbar />

            <div className="dashboard-container">
                <div className="dashboard-header">
                    <button className="btn btn-outline" onClick={() => navigate('/teacher/dashboard')} style={{ marginBottom: '1rem' }}>
                        <FaArrowLeft /> Back to Dashboard
                    </button>
                    <h1 className="dashboard-title">Mark Attendance</h1>
                    <p className="dashboard-subtitle">Manually record attendance for your class</p>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {success && (
                    <div className="alert alert-success">
                        <FaCheck /> Attendance submitted successfully!
                    </div>
                )}

                <div className="dashboard-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
                    <button
                        className={`btn ${activeTab === 'manual' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setActiveTab('manual')}
                    >
                        Manual Entry
                    </button>
                    <button
                        className={`btn ${activeTab === 'face' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setActiveTab('face')}
                    >
                        Face Recognition AI
                    </button>
                </div>

                <div className="dashboard-section">
                    {/* Common Subject Selector */}
                    <div className="form-group" style={{ maxWidth: '400px', marginBottom: '2rem' }}>
                        <label className="form-label">Select Subject</label>
                        <select
                            className="form-select"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                            disabled={submitting || success}
                        >
                            <option value="">-- Choose Subject --</option>
                            {SUBJECTS.map(subj => (
                                <option key={subj} value={subj}>{subj}</option>
                            ))}
                        </select>
                    </div>

                    {/* Shared Filters for both tabs */}
                    <div className="filters-container" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        backgroundColor: 'var(--gray-50)',
                        borderRadius: 'var(--radius-md)'
                    }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Department</label>
                            <select
                                className="form-select"
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                                disabled={submitting || success}
                            >
                                <option value="">All Departments</option>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Semester</label>
                            <select
                                className="form-select"
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                disabled={submitting || success}
                            >
                                <option value="">All Semesters</option>
                                {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Batch / Subgroup</label>
                            <select
                                className="form-select"
                                value={selectedBatch}
                                onChange={(e) => setSelectedBatch(e.target.value)}
                                disabled={submitting || success || !selectedDept || !selectedSemester}
                            >
                                <option value="">{!selectedDept || !selectedSemester ? 'Select Dept & Semester first' : 'All Batches'}</option>
                                {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>

                    {activeTab === 'manual' ? (
                        <form onSubmit={handleSubmit}>

                            {/* Bulk Actions */}
                            <div className="bulk-actions" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline"
                                    onClick={() => handleMarkAll('present')}
                                    disabled={submitting || success || filteredStudents.length === 0}
                                    style={{ color: 'var(--success-600)', borderColor: 'var(--success-200)' }}
                                >
                                    <FaCheck /> Mark All Present
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline"
                                    onClick={() => handleMarkAll('absent')}
                                    disabled={submitting || success || filteredStudents.length === 0}
                                    style={{ color: 'var(--danger-600)', borderColor: 'var(--danger-200)' }}
                                >
                                    <FaUserTimes /> Mark All Absent
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline"
                                    onClick={() => handleMarkAll('late')}
                                    disabled={submitting || success || filteredStudents.length === 0}
                                    style={{ color: 'var(--warning-600)', borderColor: 'var(--warning-200)' }}
                                >
                                    <FaClock /> Mark All Late
                                </button>
                            </div>

                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Student ID</th>
                                            <th>Name</th>
                                            <th>Department</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                                                    No students found for the selected filters.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredStudents.map(student => (
                                                <tr key={student.id}>
                                                    <td>{student.student_id}</td>
                                                    <td>{student.full_name || 'N/A'}</td>
                                                    <td>{student.department || 'N/A'}</td>
                                                    <td>
                                                        <div className="status-options" style={{ display: 'flex', gap: '1rem' }}>
                                                            <label className={`status-option ${attendanceData[student.id] === 'present' ? 'selected-present' : ''}`} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                                <input
                                                                    type="radio"
                                                                    name={`status-${student.id}`}
                                                                    checked={attendanceData[student.id] === 'present'}
                                                                    onChange={() => handleStatusChange(student.id, 'present')}
                                                                    disabled={submitting || success}
                                                                    style={{ marginRight: '0.5rem' }}
                                                                />
                                                                <span style={{ color: 'var(--success-600)', fontWeight: 'bold' }}>Present</span>
                                                            </label>

                                                            <label className={`status-option ${attendanceData[student.id] === 'absent' ? 'selected-absent' : ''}`} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                                <input
                                                                    type="radio"
                                                                    name={`status-${student.id}`}
                                                                    checked={attendanceData[student.id] === 'absent'}
                                                                    onChange={() => handleStatusChange(student.id, 'absent')}
                                                                    disabled={submitting || success}
                                                                    style={{ marginRight: '0.5rem' }}
                                                                />
                                                                <span style={{ color: 'var(--danger-600)', fontWeight: 'bold' }}>Absent</span>
                                                            </label>

                                                            <label className={`status-option ${attendanceData[student.id] === 'late' ? 'selected-late' : ''}`} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                                <input
                                                                    type="radio"
                                                                    name={`status-${student.id}`}
                                                                    checked={attendanceData[student.id] === 'late'}
                                                                    onChange={() => handleStatusChange(student.id, 'late')}
                                                                    disabled={submitting || success}
                                                                    style={{ marginRight: '0.5rem' }}
                                                                />
                                                                <span style={{ color: 'var(--warning-600)', fontWeight: 'bold' }}>Late</span>
                                                            </label>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="form-actions" style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    disabled={submitting || success || filteredStudents.length === 0}
                                    style={{ 
                                        padding: '1rem 3rem', 
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
                                    }}
                                >
                                    {submitting ? 'Submitting...' : <><FaSave /> Save Attendance</>}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="face-recognition-tab">
                            <FaceAttendance
                                subject={subject}
                                department={selectedDept}
                                semester={selectedSemester}
                                batch={selectedBatch}
                                onAttendanceMarked={(res) => {
                                    setSuccess(true);
                                    setTimeout(() => setSuccess(false), 3000);
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarkAttendance;
