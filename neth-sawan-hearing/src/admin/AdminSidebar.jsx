// src/admin/AdminSidebar.jsx
import React from 'react';
import './admin.css';

const AdminSidebar = ({ activeTab, setActiveTab, isOpen, onToggle, onClose }) => {
  const menuItems = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'users', icon: '👥', label: 'Users' },
    { id: 'alerts', icon: '🚨', label: 'Emergency Alerts' },
    { id: 'sounds', icon: '🔊', label: 'Sound History' },
    { id: 'reports', icon: '📈', label: 'Reports' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <>
      <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <span>🛡️</span>
            <span>Admin</span>
          </div>
          <button className="admin-sidebar-toggle" onClick={onToggle}>
            {isOpen ? '◀' : '▶'}
          </button>
        </div>

        <div className="admin-sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" onClick={onClose}>
            <span className="admin-nav-icon">🚪</span>
            <span className="admin-nav-label">Back to App</span>
          </button>
          <div className="admin-version">v3.0 · Admin Panel</div>
        </div>
      </div>

      <div 
        className={`admin-sidebar-backdrop ${isOpen ? 'active' : ''}`}
        onClick={() => window.innerWidth <= 768 && onToggle()}
      />
    </>
  );
};

// 🔥 CRITICAL: Ensure default export
export default AdminSidebar;