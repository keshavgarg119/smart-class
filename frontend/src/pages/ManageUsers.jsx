import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import { FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import * as userService from '../services/userService';
import '../styles/dashboard.css';

const ManageUsers = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        full_name: '',
        role: 'student',
        password: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await userService.getAllUsers(0, 500);
            setUsers(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
        try {
            await userService.deleteUser(id);
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch (err) {
            alert('Failed to delete user.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const newUser = await userService.createUser(formData);
            setUsers([newUser, ...users]); // Push to top
            setShowForm(false);
            setFormData({ email: '', username: '', full_name: '', role: 'student', password: '' });
        } catch (err) {
            const message = err.response?.data?.detail || 'Failed to create user.';
            alert(message);
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        { key: 'full_name', label: 'Name', sortable: true },
        { key: 'username', label: 'Username', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        {
            key: 'role',
            label: 'Role',
            sortable: true,
            render: (role) => (
                <span className={`badge badge-${role === 'admin' ? 'danger' : role === 'teacher' ? 'warning' : 'success'}`}>
                    {role}
                </span>
            )
        },
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
                            <h1 className="dashboard-title">Manage Users</h1>
                            <p className="dashboard-subtitle">Add, view, and remove system users</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                            <FaPlus /> {showForm ? 'Cancel' : 'Add New User'}
                        </button>
                    </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {showForm && (
                    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Create New User</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Full Name</label>
                                <input required className="form-input" type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Username</label>
                                <input required className="form-input" type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Email</label>
                                <input required className="form-input" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Password</label>
                                <input required className="form-input" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Role</label>
                                <select className="form-select" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="dashboard-section">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                            <p style={{ marginTop: '1rem' }}>Loading users...</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={users}
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

export default ManageUsers;
