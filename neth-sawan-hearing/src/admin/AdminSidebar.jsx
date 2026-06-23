// src/admin/AdminSidebar.jsx
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import ProfileEditModal from '../components/ProfileEditModal';
import './admin.css';

const AdminSidebar = ({ activeTab, setActiveTab, isOpen, onClose, user, collapsed }) => {
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || user?.email?.split('@')[0] || 'Admin',
    photoURL: user?.photoURL || null,
    email: user?.email || '',
  });
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Real‑time profile listener…
  useEffect(() => {
    // … (unchanged)
  }, [user]);

  const menuItems = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'users', icon: '👥', label: 'Users' },
    { id: 'alerts', icon: '🚨', label: 'Emergency Alerts' },
    { id: 'sounds', icon: '🔊', label: 'Sound History' },
    { id: 'reports', icon: '📈', label: 'Reports' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  const handleProfileUpdate = (updatedData) => {
    setProfileData(prev => ({ ...prev, ...updatedData }));
  };

  return (
    <>
      <div className={`admin-sidebar ${isOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        {/* Profile Section – hide extra info when collapsed */}
        <div className="admin-profile-section" onClick={() => setShowProfileModal(true)}>
          <div className="admin-profile-glow"></div>
          <div className="admin-profile-avatar-wrapper">
            <div className="admin-avatar">
              {profileData.photoURL ? (
                <img src={profileData.photoURL} alt="Profile" className="admin-profile-img" />
              ) : (
                <div className="admin-avatar-initial">
                  {profileData.displayName?.charAt(0)?.toUpperCase() || 'A'}
                </div>
              )}
              <span className="admin-status-dot status-online"></span>
              <div className="admin-avatar-edit-overlay">
                <span className="admin-edit-icon">✎</span>
              </div>
            </div>
          </div>
          {/* 👇 Hidden when collapsed */}
          {!collapsed && (
            <div className="admin-profile-info">
              <div className="admin-profile-name-row">
                <span className="admin-profile-name">{profileData.displayName}</span>
              </div>
              <span className="admin-profile-status status-online">● Online</span>
              {profileData.email && (
                <span className="admin-profile-email">{profileData.email}</span>
              )}
            </div>
          )}
          {!collapsed && <span className="admin-profile-chevron">›</span>}
        </div>

        <div className="admin-sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth <= 1024) onClose(); // close on mobile after click
              }}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {!collapsed && <span className="admin-nav-label">{item.label}</span>}
            </button>
          ))}
        </div>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" onClick={onClose}>
            <span className="admin-nav-icon">🚪</span>
            {!collapsed && <span className="admin-nav-label">Back to App</span>}
          </button>
          {!collapsed && <div className="admin-version">v3.0 · Admin Panel</div>}
        </div>
      </div>

      <div
        className={`admin-sidebar-backdrop ${isOpen ? 'active' : ''}`}
        onClick={() => window.innerWidth <= 1024 && onClose()}
      />

      {showProfileModal && (
        <ProfileEditModal
          user={user}
          isGuest={false}
          onClose={() => setShowProfileModal(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </>
  );
};

export default AdminSidebar;