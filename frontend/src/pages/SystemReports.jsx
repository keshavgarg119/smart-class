import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { FaDownload, FaChartPie, FaFilePdf, FaFileCsv } from 'react-icons/fa';
import * as attendanceService from '../services/attendanceService';
import '../styles/dashboard.css';

const SystemReports = () => {
    const [stats, setStats] = useState({ present: 0, absent: 0, total: 0 });
    const [loading, setLoading] = useState(false);
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        fetchGlobalStats();
    }, [dateFilter]);

    const fetchGlobalStats = async () => {
        try {
            setLoading(true);
            // In a real system you'd have an admin-level stats endpoint. 
            // We'll approximate by fetching the records for the selected date.
            const records = await attendanceService.getAttendanceRecords({
                startDate: dateFilter,
                endDate: dateFilter,
                limit: 1000
            });

            let present = 0, absent = 0;
            records.forEach(r => {
                if (r.status === 'present') present++;
                else if (r.status === 'absent') absent++;
            });

            setStats({
                present,
                absent,
                total: present + absent
            });
        } catch (err) {
            console.error("Failed to load reports:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            await attendanceService.exportAttendanceCSV({ startDate: dateFilter, endDate: dateFilter });
        } catch (err) {
            alert("Export failed");
        }
    };

    const handleExportPDF = async () => {
        try {
            await attendanceService.exportAttendancePDF({ startDate: dateFilter, endDate: dateFilter });
        } catch (err) {
            alert("Export failed");
        }
    };

    const attendanceRate = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0;

    return (
        <div className="dashboard">
            <Navbar />
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">System Reports</h1>
                        <p className="dashboard-subtitle">Generate and download institutional attendance data</p>
                    </div>
                </div>

                <div className="dashboard-section" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--white)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ margin: 0, flex: 1 }}>
                            <label className="form-label">Filter by Date (Optional)</label>
                            <input type="date" className="form-input" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
                        </div>
                        <button className="btn btn-outline" onClick={() => setDateFilter('')} style={{ height: '42px' }}>Clear Filter</button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading report data...</div>
                ) : (
                    <>
                        <div className="dashboard-stats grid grid-cols-3" style={{ marginBottom: '2rem' }}>
                            <StatCard title="Total Records" value={stats.total} icon={FaChartPie} iconColor="primary" description="Matching filter" />
                            <StatCard title="Present Count" value={stats.present} icon={FaDownload} iconColor="success" description="Marked present" />
                            <StatCard title="Overall Attendance Rate" value={`${attendanceRate}%`} icon={FaChartPie} iconColor={attendanceRate >= 75 ? 'success' : 'warning'} />
                        </div>

                        <div className="dashboard-section" style={{ padding: '2rem', background: 'var(--white)', borderRadius: 'var(--radius-lg)' }}>
                            <h2 style={{ marginBottom: '1.5rem' }}>Download Global Reports</h2>
                            <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
                                Download full institutional attendance reports for all students. Data will be filtered by the date selected above.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-primary" onClick={handleExportCSV} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <FaFileCsv /> Export to CSV
                                </button>
                                <button className="btn btn-danger" onClick={handleExportPDF} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: '#e74c3c' }}>
                                    <FaFilePdf /> Export to PDF
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SystemReports;
