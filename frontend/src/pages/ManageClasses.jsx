import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import { FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import * as classService from '../services/classService';
import '../styles/dashboard.css';

const ManageClasses = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        department: '',
        year: ''
    });

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const data = await classService.getAllClasses(0, 500);
            setClasses(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load classes.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this class? This cannot be undone.')) return;
        try {
            await classService.deleteClass(id);
            setClasses(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            alert('Failed to delete class.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                year: parseInt(formData.year) || 1
            };
            const newClass = await classService.createClass(payload);
            setClasses([newClass, ...classes]);
            setShowForm(false);
            setFormData({ name: '', department: '', year: '' });
        } catch (err) {
            const message = err.response?.data?.detail || 'Failed to create class.';
            alert(message);
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        { key: 'name', label: 'Subject Name', sortable: true },
        { key: 'department', label: 'Department', sortable: true },
        { key: 'year', label: 'Year', sortable: true },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(row.id)}>
                    <FaTrash /> Delete
                </button>
            )
        }
    ];

    return (
        <div className="dashboard">
            <Navbar />
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <button className="btn btn-outline" onClick={() => navigate('/admin/dashboard')} style={{ marginBottom: '1rem' }}>
                        <FaArrowLeft /> Back to Dashboard
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 className="dashboard-title">Manage Classes</h1>
                            <p className="dashboard-subtitle">Add, view, and remove subjects/classes</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                            <FaPlus /> {showForm ? 'Cancel' : 'Add New Class'}
                        </button>
                    </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {showForm && (
                    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Create New Class</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Subject Name</label>
                                <input required placeholder="e.g. Data Structures" className="form-input" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Department</label>
                                <input required placeholder="e.g. Computer Science" className="form-input" type="text" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Year/Semester</label>
                                <input required className="form-input" type="number" min="1" max="4" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} />
                            </div>

                            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create Class'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="dashboard-section">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                            <p style={{ marginTop: '1rem' }}>Loading classes...</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={classes}
                            searchable={true}
                            pagination={true}
                            itemsPerPage={10}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageClasses;
