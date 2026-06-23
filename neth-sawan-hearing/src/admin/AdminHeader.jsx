// src/admin/AdminHeader.jsx
import React, { useState, useRef, useEffect } from 'react';
import './admin.css';

const AdminHeader = ({
  stats,
  notifications,
  onClose,
  onToggleSidebar,
  sidebarOpen,
  currentTheme,
  onThemeChange,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'default' : 'light';
    onThemeChange(newTheme);
  };

  return (
    <header className="admin-header">
      <div className="admin-header-top">
        <button
          className="admin-hamburger-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? '✕' : '≡'}
        </button>

        <div className="admin-header-brand">
          <span className="admin-brand-icon">👂</span>
          <span className="admin-brand-text">Neth‑Sawan</span>
          <span className="admin-brand-badge">Admin</span>
        </div>

        <div className="admin-header-actions">
          <button
            className="admin-theme-toggle"
            onClick={toggleTheme}
            title={currentTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {currentTheme === 'light' ? '🌙' : '☀️'}
          </button>

          <div style={{ position: 'relative' }}>
            <button
              className="admin-notif-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              🔔
              {notifications.length > 0 && (
                <span className="admin-notif-badge">{notifications.length}</span>
              )}
            </button>

            {showNotifications && (
              <div className="admin-notif-dropdown" ref={dropdownRef}>
                <div className="admin-notif-header">
                  <span>Recent Alerts</span>
                  <button onClick={() => setShowNotifications(false)}>✕</button>
                </div>
                <ul>
                  {notifications.slice(0, 5).map((alert) => (
                    <li key={alert.id}>
                      <span>{alert.alertType || 'Alert'}</span>
                      <span>
                        {alert.timestamp?.toDate?.()?.toLocaleTimeString() || 'Just now'}
                      </span>
                    </li>
                  ))}
                  {notifications.length === 0 && <li>No new alerts</li>}
                </ul>
              </div>
            )}
          </div>

          <button className="admin-logout-btn" onClick={onClose}>
            🚪
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;