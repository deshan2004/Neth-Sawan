// src/admin/AdminHeader.jsx
import React, { useState } from 'react';
import './admin.css';

const AdminHeader = ({ 
  stats, 
  notifications, 
  onClose, 
  onToggleSidebar, 
  sidebarOpen,
  currentTheme,
  onThemeChange 
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

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
          {sidebarOpen ? '✕' : '☰'}
        </button>

        <h1 className="admin-header-title">🛡️ Admin</h1>

        <div className="admin-header-actions">
          <button 
            className="admin-theme-toggle"
            onClick={toggleTheme}
            title={currentTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {currentTheme === 'light' ? '🌙' : '☀️'}
          </button>

          <button 
            className="admin-notif-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔
            {notifications.length > 0 && (
              <span className="admin-notif-badge">{notifications.length}</span>
            )}
          </button>
          <button className="admin-logout-btn" onClick={onClose}>🚪</button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;