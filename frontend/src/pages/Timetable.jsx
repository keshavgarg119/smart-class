import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaArrowLeft, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import * as studentService from '../services/studentService';
import api from '../services/api';
import '../styles/dashboard.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const TYPE_COLORS = {
    'Lecture': '#6366f1',
    'Practical': '#22c55e',
    'Tutorial': '#f97316',
    'Lab': '#06b6d4'
};

const SUBJECT_COLORS = [
    '#6366f1', '#22c55e', '#f97316', '#06b6d4', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f43f5e', '#eab308', '#3b82f6',
    '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9'
];

const Timetable = () => {
    const { user, isStudent } = useAuth();
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [batch, setBatch] = useState('');
    const [error, setError] = useState('');

    // For students: auto-load batch from profile
    useEffect(() => {
        if (isStudent && user?.id) {
            studentService.getStudent(user.id).then(s => {
                if (s?.batch) {
                    setBatch(s.batch);
                }
            }).catch(console.error);
        }
    }, [isStudent, user]);

    // Fetch timetable when batch changes
    useEffect(() => {
        if (batch) {
            fetchTimetable(batch);
        } else {
            setLoading(false);
        }
    }, [batch]);

    const fetchTimetable = async (subgroup) => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/timetable/acm/${subgroup}`);
            setSchedule(res.data);
        } catch (e) {
            if (e.response?.status === 404) {
                setError(`Subgroup "${subgroup}" not found. Please check your batch in profile settings.`);
            } else {
                setError('Failed to load timetable');
            }
            setSchedule(null);
        } finally {
            setLoading(false);
        }
    };

    // Collect all unique time slots across all days and sort them
    const timeSlots = useMemo(() => {
        if (!schedule) return [];
        const allTimes = new Set();
        DAYS.forEach(day => {
            if (schedule[day]) {
                Object.keys(schedule[day]).forEach(t => allTimes.add(t));
            }
        });

        // Parse time for sorting: "08:00 AM" -> minutes from midnight
        const parseTime = (t) => {
            const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
            if (!match) return 0;
            let hours = parseInt(match[1]);
            const mins = parseInt(match[2]);
            const ampm = match[3].toUpperCase();
            if (ampm === 'PM' && hours !== 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            return hours * 60 + mins;
        };

        return [...allTimes].sort((a, b) => parseTime(a) - parseTime(b));
    }, [schedule]);

    // Color map per subject
    const subjectColors = useMemo(() => {
        if (!schedule) return {};
        const subjects = new Set();
        DAYS.forEach(day => {
            if (schedule[day]) {
                Object.values(schedule[day]).forEach(([, , subject]) => {
                    if (subject) subjects.add(subject);
                });
            }
        });
        const map = {};
        [...subjects].forEach((s, i) => {
            map[s] = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
        });
        return map;
    }, [schedule]);

    return (
        <div className="dashboard">
            <Navbar />
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
                        <FaArrowLeft /> Back
                    </button>
                    <h1 className="dashboard-title"><FaCalendarAlt /> Weekly Timetable</h1>
                    <p className="dashboard-subtitle">
                        {isStudent ? 'Your weekly class schedule from Thapar University' : 'View timetable by subgroup'}
                    </p>
                </div>

                {/* Batch info / manual entry */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem',
                    flexWrap: 'wrap'
                }}>
                    <div style={{
                        padding: '0.75rem 1.5rem', background: 'var(--primary-600)', color: 'white',
                        borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.95rem'
                    }}>
                        Subgroup: {batch || '—'}
                    </div>
                    {!isStudent && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                                className="form-input"
                                placeholder="Enter subgroup (e.g. 3C33)"
                                value={batch}
                                onChange={e => setBatch(e.target.value.toUpperCase())}
                                style={{ width: '200px' }}
                            />
                        </div>
                    )}
                </div>

                {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

                {/* Timetable Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                        <p style={{ marginTop: '1rem' }}>Loading timetable...</p>
                    </div>
                ) : !schedule ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
                        <FaClock style={{ fontSize: '3rem', marginBottom: '1rem' }} />
                        <p>{batch ? 'No timetable found for this subgroup' : 'Enter your subgroup to view the timetable'}</p>
                    </div>
                ) : (
                    <div className="dashboard-section" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                <thead>
                                    <tr>
                                        <th style={{
                                            padding: '0.75rem 0.5rem', background: 'var(--primary-600)', color: 'white',
                                            fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase',
                                            position: 'sticky', left: 0, zIndex: 2, minWidth: '85px',
                                            textAlign: 'center'
                                        }}>
                                            Time
                                        </th>
                                        {DAYS.map(day => (
                                            <th key={day} style={{
                                                padding: '0.75rem 0.5rem', background: 'var(--primary-600)', color: 'white',
                                                fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase',
                                                textAlign: 'center', minWidth: '150px'
                                            }}>
                                                {day}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {timeSlots.map((slot, si) => (
                                        <tr key={slot}>
                                            <td style={{
                                                padding: '0.4rem 0.5rem', fontWeight: 600, fontSize: '0.75rem',
                                                color: 'var(--gray-600)', borderBottom: '1px solid var(--gray-200)',
                                                background: si % 2 === 0 ? 'var(--gray-50)' : 'transparent',
                                                position: 'sticky', left: 0, zIndex: 1,
                                                whiteSpace: 'nowrap', textAlign: 'center'
                                            }}>
                                                {slot}
                                            </td>
                                            {DAYS.map(day => {
                                                const entry = schedule[day]?.[slot];
                                                return (
                                                    <td key={day} style={{
                                                        padding: '0.2rem', borderBottom: '1px solid var(--gray-200)',
                                                        background: si % 2 === 0 ? 'var(--gray-50)' : 'transparent',
                                                        verticalAlign: 'top'
                                                    }}>
                                                        {entry ? (() => {
                                                            const [code, room, subject, type] = entry;
                                                            const color = subjectColors[subject] || '#6366f1';
                                                            return (
                                                                <div style={{
                                                                    background: color,
                                                                    color: 'white',
                                                                    borderRadius: '6px',
                                                                    padding: '0.4rem 0.5rem',
                                                                    fontSize: '0.75rem',
                                                                    minHeight: '55px',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    justifyContent: 'center',
                                                                    position: 'relative',
                                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                                                    transition: 'transform 0.15s ease',
                                                                    cursor: 'default'
                                                                }}
                                                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                                                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                                >
                                                                    <div style={{ fontWeight: 700, fontSize: '0.78rem', lineHeight: 1.2, marginBottom: '2px' }}>
                                                                        {subject}
                                                                    </div>
                                                                    {code && (
                                                                        <div style={{ opacity: 0.85, fontSize: '0.68rem' }}>{code}</div>
                                                                    )}
                                                                    {room && (
                                                                        <div style={{ opacity: 0.8, fontSize: '0.65rem' }}>📍 {room}</div>
                                                                    )}
                                                                    {type && type !== 'Lecture' && (
                                                                        <span style={{
                                                                            position: 'absolute', top: '3px', right: '4px',
                                                                            fontSize: '0.55rem',
                                                                            background: TYPE_COLORS[type] || 'rgba(0,0,0,0.25)',
                                                                            padding: '1px 5px', borderRadius: '3px',
                                                                            textTransform: 'uppercase', fontWeight: 700
                                                                        }}>
                                                                            {type}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })() : null}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Legend */}
                {schedule && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--gray-600)' }}>
                            Subject Legend
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {Object.entries(subjectColors).map(([subject, color]) => (
                                <div key={subject} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem',
                                    padding: '0.25rem 0.5rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)'
                                }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: color, flexShrink: 0 }} />
                                    <span>{subject}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                            <span>🟪 Lecture</span>
                            <span style={{ color: '#22c55e' }}>■ Practical</span>
                            <span style={{ color: '#f97316' }}>■ Tutorial</span>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--gray-400)', textAlign: 'center' }}>
                    Timetable data sourced from ACM Thapar — 2025-2026 EVEN Semester
                </div>
            </div>
        </div>
    );
};

export default Timetable;
