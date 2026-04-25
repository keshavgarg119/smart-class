import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaGraduationCap, FaBars, FaTimes, FaUser, FaSignOutAlt, FaCog, FaMoon, FaSun } from 'react-icons/fa';
import { ROUTES, API_BASE_URL } from '../utils/constants';
import * as studentService from '../services/studentService';
import '../styles/navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin, isTeacher, isStudent, isParent } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [studentPhoto, setStudentPhoto] = useState(null);

  useEffect(() => {
    if (isStudent && user?.id) {
      studentService.getStudent(user.id).then(data => {
        if (data?.face_image) {
          setStudentPhoto(`${API_BASE_URL}/uploads/faces/${data.face_image}`);
        }
      }).catch(() => {});
    }
  }, [isStudent, user]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const getNavLinks = () => {
    if (isAdmin) {
      return [
        { path: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard' },
        { path: ROUTES.MANAGE_USERS, label: 'Users' },
        { path: ROUTES.MANAGE_CLASSES, label: 'Classes' },
        { path: ROUTES.SYSTEM_REPORTS, label: 'Reports' },
        { path: '/admin/bulk-import', label: 'Bulk Import' }
      ];
    } else if (isTeacher) {
      return [
        { path: ROUTES.TEACHER_DASHBOARD, label: 'Dashboard' },
        { path: ROUTES.MARK_ATTENDANCE, label: 'Mark Attendance' },
        { path: ROUTES.VIEW_ATTENDANCE, label: 'View Attendance' },
        { path: ROUTES.CLASS_ANALYTICS, label: 'Analytics' },
        { path: '/teacher/leaves', label: 'Leaves' },
        { path: '/teacher/eligibility', label: 'Eligibility' },
        { path: '/teacher/qr-attendance', label: 'QR Attend.' },
        { path: '/timetable', label: 'Timetable' }
      ];
    } else if (isStudent) {
      return [
        { path: ROUTES.STUDENT_DASHBOARD, label: 'Dashboard' },
        { path: ROUTES.ATTENDANCE_HISTORY, label: 'History' },
        { path: ROUTES.ATTENDANCE_TRENDS, label: 'Trends' },
        { path: '/student/leave', label: 'Apply Leave' },
        { path: '/student/scan-qr', label: 'Scan QR' },
        { path: '/timetable', label: 'Timetable' }
      ];
    } else if (isParent) {
      return [
        { path: '/parent/dashboard', label: 'Dashboard' },
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <FaGraduationCap className="navbar-icon" />
          <span>Smart Attendance</span>
        </Link>

        <button
          className="navbar-mobile-toggle"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          {showMobileMenu ? <FaTimes /> : <FaBars />}
        </button>

        <ul className={`navbar-menu ${showMobileMenu ? 'show' : ''}`}>
          {navLinks.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`navbar-link ${location.pathname === link.path ? 'active' : ''}`}
                onClick={() => setShowMobileMenu(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}

          <li className="navbar-theme-toggle">
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                fontSize: '1.1rem',
                transition: 'all 0.3s ease'
              }}
            >
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>
          </li>

          <li className="navbar-profile">
            <button
              className="navbar-profile-button"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="navbar-avatar">
                {studentPhoto ? (
                  <img src={studentPhoto} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  (user?.full_name || user?.username || '?').charAt(0).toUpperCase()
                )}
              </div>
              <span className="navbar-user-name">{user?.full_name || user?.username}</span>
            </button>

            <div className={`navbar-dropdown ${showDropdown ? 'show' : ''}`}>
              <div 
                className="navbar-dropdown-item"
                onClick={() => { if(isStudent) { setShowDropdown(false); navigate('/student/profile'); } }}
              >
                <FaUser />
                <div>
                  <div style={{ fontWeight: 600 }}>{user?.full_name || user?.username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'capitalize' }}>
                    {user?.role}
                  </div>
                </div>
              </div>

              <div className="navbar-dropdown-divider" />

              {isStudent && (
                <div 
                  className="navbar-dropdown-item" 
                  onClick={() => { setShowDropdown(false); navigate('/student/profile'); }}
                >
                  <FaCog />
                  <span>Profile Settings</span>
                </div>
              )}

              <div
                className="navbar-dropdown-item"
                onClick={handleLogout}
                style={{ color: 'var(--danger-600)' }}
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
