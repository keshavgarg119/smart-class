import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaArrowLeft, FaChartBar, FaChartPie } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import * as attendanceService from '../services/attendanceService';
import * as studentService from '../services/studentService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import '../styles/dashboard.css';

const CHART_COLORS = ['#6366f1', '#22c55e', '#f97316', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'];

const ClassAnalytics = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [subjectData, setSubjectData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [trendData, setTrendData] = useState([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const records = await attendanceService.getAttendanceRecords({ limit: 1000 });
            const students = await studentService.getAllStudents(0, 500);

            // Subject-wise attendance
            const subjectMap = {};
            records.forEach(r => {
                const subj = r.subject || 'General';
                if (!subjectMap[subj]) subjectMap[subj] = { subject: subj, present: 0, absent: 0, late: 0, total: 0 };
                subjectMap[subj][r.status] = (subjectMap[subj][r.status] || 0) + 1;
                subjectMap[subj].total++;
            });
            const subjectArr = Object.values(subjectMap).map(s => ({
                ...s,
                percentage: s.total ? Math.round((s.present / s.total) * 100) : 0
            }));
            setSubjectData(subjectArr);

            // Overall status distribution
            let present = 0, absent = 0, late = 0;
            records.forEach(r => {
                if (r.status === 'present') present++;
                else if (r.status === 'absent') absent++;
                else if (r.status === 'late') late++;
            });
            setStatusData([
                { name: 'Present', value: present, fill: '#22c55e' },
                { name: 'Absent', value: absent, fill: '#ef4444' },
                { name: 'Late', value: late, fill: '#f97316' },
            ]);

            // Daily trend (last 14 days)
            const dayMap = {};
            records.forEach(r => {
                const day = r.class_date?.split('T')[0];
                if (day) {
                    if (!dayMap[day]) dayMap[day] = { date: day, present: 0, absent: 0, total: 0 };
                    if (r.status === 'present') dayMap[day].present++;
                    else dayMap[day].absent++;
                    dayMap[day].total++;
                }
            });
            const sorted = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
            setTrendData(sorted.map(d => ({
                ...d,
                date: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                rate: d.total ? Math.round((d.present / d.total) * 100) : 0
            })));

        } catch (err) {
            setError('Failed to load analytics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard">
            <Navbar />
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
                        <FaArrowLeft /> Back to Dashboard
                    </button>
                    <h1 className="dashboard-title"><FaChartBar /> Class Analytics</h1>
                    <p className="dashboard-subtitle">Visual insights into attendance patterns</p>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                        <p style={{ marginTop: '1rem' }}>Loading analytics...</p>
                    </div>
                ) : (
                    <>
                        {/* Row 1: Bar Chart + Pie Chart */}
                        <div className="dashboard-content-grid" style={{ marginTop: '1rem' }}>
                            <div className="dashboard-section">
                                <div className="section-header">
                                    <h2>Subject-wise Attendance Rate</h2>
                                </div>
                                {subjectData.length === 0 ? (
                                    <p style={{ color: 'var(--gray-500)', textAlign: 'center' }}>No data available</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={subjectData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                                            <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                                            <YAxis unit="%" />
                                            <Tooltip formatter={(v) => `${v}%`} />
                                            <Legend />
                                            <Bar dataKey="percentage" name="Attendance %" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            <div className="dashboard-section">
                                <div className="section-header">
                                    <h2><FaChartPie /> Overall Status Distribution</h2>
                                </div>
                                {statusData.every(d => d.value === 0) ? (
                                    <p style={{ color: 'var(--gray-500)', textAlign: 'center' }}>No data available</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={statusData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {statusData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Row 2: Trend Line Chart */}
                        <div className="dashboard-section" style={{ marginTop: '2rem' }}>
                            <div className="section-header">
                                <h2>Attendance Trend (Last 14 Days)</h2>
                            </div>
                            {trendData.length === 0 ? (
                                <p style={{ color: 'var(--gray-500)', textAlign: 'center' }}>No trend data available</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                        <YAxis unit="%" domain={[0, 100]} />
                                        <Tooltip formatter={(v) => `${v}%`} />
                                        <Legend />
                                        <Line type="monotone" dataKey="rate" name="Attendance Rate" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Row 3: Detailed Subject Table */}
                        <div className="dashboard-section" style={{ marginTop: '2rem' }}>
                            <div className="section-header">
                                <h2>Subject Breakdown</h2>
                            </div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th>Total</th>
                                            <th>Present</th>
                                            <th>Absent</th>
                                            <th>Late</th>
                                            <th>Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subjectData.map(s => (
                                            <tr key={s.subject}>
                                                <td style={{ fontWeight: 600 }}>{s.subject}</td>
                                                <td>{s.total}</td>
                                                <td style={{ color: 'var(--success-600)' }}>{s.present}</td>
                                                <td style={{ color: 'var(--danger-600)' }}>{s.absent}</td>
                                                <td style={{ color: 'var(--warning-600)' }}>{s.late || 0}</td>
                                                <td>
                                                    <span className={`badge ${s.percentage >= 75 ? 'badge-success' : 'badge-danger'}`}>
                                                        {s.percentage}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ClassAnalytics;
