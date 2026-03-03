import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
    FaUserGraduate, FaArrowLeft, FaCalendarCheck, FaExclamationTriangle,
    FaChartBar, FaTimesCircle
} from 'react-icons/fa';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import api from '../services/api';
import '../styles/dashboard.css';

const ParentDashboard = () => {
    const navigate = useNavigate();

    const [students, setStudents] = useState([]);
    const [selected, setSelected] = useState(null);  // selected student_id
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/parent/my-students');
                setStudents(res.data.students || []);
                if (res.data.students?.length > 0) {
                    setSelected(res.data.students[0].student_id);
                } else {
                    setLoading(false);
                }
            } catch (e) {
                setError('Failed to load linked students');
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (!selected) return;
        setLoading(true);
        api.get(`/parent/attendance/${selected}`)
            .then(res => { setData(res.data); setLoading(false); })
            .catch(() => { setError('Failed to load attendance data'); setLoading(false); });
    }, [selected]);

    const overallColor = data
        ? data.overall_percentage >= 75 ? '#22c55e'
            : data.overall_percentage >= 60 ? '#f97316' : '#ef4444'
        : '#6366f1';

    return (
        <div className="dashboard">
            <Navbar />
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
                        <FaArrowLeft /> Back
                    </button>
                    <h1 className="dashboard-title"><FaUserGraduate /> Parent Dashboard</h1>
                    <p className="dashboard-subtitle">Monitor your child's attendance and academic standing</p>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {/* Student selector if multiple */}
                {students.length > 1 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Select Student</label>
                        <select className="form-input" value={selected || ''} onChange={e => setSelected(e.target.value)}>
                            {students.map(s => (
                                <option key={s.student_id} value={s.student_id}>{s.full_name} ({s.roll_number})</option>
                            ))}
                        </select>
                    </div>
                )}

                {students.length === 0 && !loading && !error && (
                    <div className="dashboard-section" style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
                        <FaUserGraduate style={{ fontSize: '3rem', marginBottom: '1rem' }} />
                        <p>No linked students found. Please check your roll number in your profile settings.</p>
                    </div>
                )}

                {loading && (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                        <p style={{ marginTop: '1rem' }}>Loading attendance data…</p>
                    </div>
                )}

                {!loading && data && (
                    <>
                        {/* Student Info Card */}
                        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                            <div className="stat-card">
                                <div className="stat-icon"><FaUserGraduate /></div>
                                <div className="stat-content">
                                    <div className="stat-value">{data.student.full_name || '—'}</div>
                                    <div className="stat-label">Roll: {data.student.roll_number}</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ color: overallColor }}><FaCalendarCheck /></div>
                                <div className="stat-content">
                                    <div className="stat-value" style={{ color: overallColor }}>
                                        {data.overall_percentage}%
                                    </div>
                                    <div className="stat-label">Overall Attendance</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon"><FaChartBar /></div>
                                <div className="stat-content">
                                    <div className="stat-value">{data.total_present}/{data.total_classes}</div>
                                    <div className="stat-label">Classes Attended</div>
                                </div>
                            </div>
                            {data.overall_percentage < 75 && (
                                <div className="stat-card" style={{ border: '2px solid #ef4444' }}>
                                    <div className="stat-icon" style={{ color: '#ef4444' }}><FaExclamationTriangle /></div>
                                    <div className="stat-content">
                                        <div className="stat-value" style={{ color: '#ef4444', fontSize: '0.95rem' }}>At Risk</div>
                                        <div className="stat-label">Below 75% threshold</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Subject-wise bar chart */}
                        {data.subject_breakdown.length > 0 && (
                            <div className="dashboard-section" style={{ marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                                    <FaChartBar style={{ marginRight: '0.5rem' }} />Subject-wise Attendance
                                </h2>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={data.subject_breakdown} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                                        <XAxis
                                            dataKey="subject"
                                            tick={{ fontSize: 11 }}
                                            angle={-30}
                                            textAnchor="end"
                                            interval={0}
                                        />
                                        <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                                        <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} />
                                        <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                                            {data.subject_breakdown.map((s, i) => (
                                                <Cell key={i} fill={s.percentage >= 75 ? '#22c55e' : s.percentage >= 60 ? '#f97316' : '#ef4444'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                {/* 75% threshold legend */}
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>
                                    <span style={{ color: '#22c55e' }}>■ ≥75% (Good)</span>
                                    <span style={{ color: '#f97316' }}>■ 60-75% (Warning)</span>
                                    <span style={{ color: '#ef4444' }}>■ &lt;60% (Critical)</span>
                                </div>
                            </div>
                        )}

                        {/* Recent Absences */}
                        {data.recent_absences.length > 0 && (
                            <div className="dashboard-section">
                                <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                                    <FaTimesCircle style={{ marginRight: '0.5rem', color: '#ef4444' }} />Recent Absences
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {data.recent_absences.map((a, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '0.6rem 1rem', background: 'var(--gray-50)',
                                            borderRadius: 'var(--radius-sm)', fontSize: '0.85rem'
                                        }}>
                                            <span style={{ fontWeight: 600 }}>{a.subject}</span>
                                            <span style={{ color: 'var(--gray-500)' }}>{a.date}</span>
                                            <span style={{
                                                padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)',
                                                background: a.status === 'absent' ? '#fef2f2' : '#fff7ed',
                                                color: a.status === 'absent' ? '#dc2626' : '#ea580c',
                                                fontWeight: 600, fontSize: '0.75rem', textTransform: 'capitalize'
                                            }}>
                                                {a.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ParentDashboard;
