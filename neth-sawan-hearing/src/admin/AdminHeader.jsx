// src/admin/AdminHeader.jsx
import React, { useState } from 'react';
import './admin.css';

const AdminHeader = ({ stats, notifications, onClose }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const statCards = [
    { key: 'totalUsers', label: 'Total Users', icon: '👥', value: stats.totalUsers },
    { key: 'onlineUsers', label: 'Online Now', icon: '🟢', value: stats.onlineUsers },
    { key: 'totalAlerts', label: 'Total Alerts', icon: '🚨', value: stats.totalAlerts },
    { key: 'totalSounds', label: 'Sound Events', icon: '🔊', value: stats.totalSounds },
  ];

  return (
    <header className="admin-header">
      <div className="admin-header-top">
        <h1 className="admin-header-title">
          🛡️ Admin Dashboard
        </h1>
        <div className="admin-header-actions">
          <button 
            className="admin-notif-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔
            {notifications.length > 0 && (
              <span className="admin-notif-badge">{notifications.length}</span>
            )}
          </button>
          <button className="admin-logout-btn" onClick={onClose}>
            🚪
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        {statCards.map((stat) => (
          <div key={stat.key} className="admin-stat-card">
            <div className="admin-stat-icon">{stat.icon}</div>
            <div className="admin-stat-info">
              <span className="admin-stat-value">{stat.value || 0}</span>
              <span className="admin-stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="admin-notif-dropdown">
          <div className="admin-notif-header">
            <span>🔔 Recent Alerts</span>
            <button onClick={() => setShowNotifications(false)}>✕</button>
          </div>
          {notifications.length === 0 ? (
            <p className="admin-notif-empty">No recent alerts</p>
          ) : (
            notifications.map((alert) => (
              <div key={alert.id} className="admin-notif-item">
                <span className="admin-notif-icon">🚨</span>
                <div className="admin-notif-info">
                  <span className="admin-notif-msg">{alert.alertType || 'Emergency'}</span>
                  <span className="admin-notif-time">
                    {alert.timestamp?.toDate?.()?.toLocaleTimeString() || 'Just now'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </header>
  );
};

export default AdminHeader;