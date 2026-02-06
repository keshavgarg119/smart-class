import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaGraduationCap, FaBars, FaTimes, FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { ROUTES } from '../utils/constants';
import '../styles/navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin, isTeacher, isStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
        { path: ROUTES.SYSTEM_REPORTS, label: 'Reports' }
      ];
    } else if (isTeacher) {
      return [
        { path: ROUTES.TEACHER_DASHBOARD, label: 'Dashboard' },
        { path: ROUTES.MARK_ATTENDANCE, label: 'Mark Attendance' },
        { path: ROUTES.VIEW_ATTENDANCE, label: 'View Attendance' },
        { path: ROUTES.CLASS_ANALYTICS, label: 'Analytics' }
      ];
    } else if (isStudent) {
      return [
        { path: ROUTES.STUDENT_DASHBOARD, label: 'Dashboard' },
        { path: ROUTES.ATTENDANCE_HISTORY, label: 'History' },
        { path: ROUTES.ATTENDANCE_TRENDS, label: 'Trends' }
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

          <li className="navbar-profile">
            <button
              className="navbar-profile-button"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="navbar-avatar">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span>{user?.name}</span>
            </button>

            <div className={`navbar-dropdown ${showDropdown ? 'show' : ''}`}>
              <div className="navbar-dropdown-item">
                <FaUser />
                <div>
                  <div style={{ fontWeight: 600 }}>{user?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                    {user?.role}
                  </div>
                </div>
              </div>

              <div className="navbar-dropdown-divider" />

              <div className="navbar-dropdown-item">
                <FaCog />
                <span>Settings</span>
              </div>

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
