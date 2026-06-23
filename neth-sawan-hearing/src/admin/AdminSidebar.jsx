// src/admin/AdminSidebar.jsx
import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import ProfileEditModal from '../components/ProfileEditModal';
import './admin.css';

const AdminSidebar = ({
  activeTab,
  setActiveTab,
  isOpen,
  onCloseSidebar,
  onBackToApp,
  user,
  collapsed,
}) => {
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || user?.email?.split('@')[0] || 'Admin',
    photoURL: user?.photoURL || null,
    email: user?.email || '',
  });
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileData((prev) => ({
          ...prev,
          displayName: data.displayName || data.name || user.displayName || user.email?.split('@')[0] || 'Admin',
          photoURL: data.photoURL || user.photoURL || null,
          email: data.email || user.email || '',
        }));
      }
    });
    return () => unsubscribe();
  }, [user]);

  const menuItems = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'users', icon: '👥', label: 'Users' },
    { id: 'alerts', icon: '🚨', label: 'Emergency Alerts' },
    { id: 'sounds', icon: '🔊', label: 'Sound History' },
    { id: 'reports', icon: '📈', label: 'Reports' },
    { id: 'audit', icon: '📋', label: 'Audit Log' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  const handleProfileUpdate = (updatedData) => {
    setProfileData((prev) => ({ ...prev, ...updatedData }));
  };

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (window.innerWidth <= 1024) {
      onCloseSidebar();
    }
  };

  return (
    <>
      <div className={`admin-sidebar ${isOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        {/* ─── Sidebar Header – Logo removed, only close button ─── */}
        <div className="admin-sidebar-header">
          <span className="admin-sidebar-header-spacer"></span>
          <button
            className="admin-close-sidebar-btn"
            onClick={onCloseSidebar}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* ─── Profile Section (unchanged) ─── */}
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

        {/* ─── Navigation ─── */}
        <div className="admin-sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {!collapsed && <span className="admin-nav-label">{item.label}</span>}
            </button>
          ))}
        </div>

        {/* ─── Footer ─── */}
        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" onClick={onBackToApp}>
            <span className="admin-nav-icon">🚪</span>
            {!collapsed && <span className="admin-nav-label">Back to App</span>}
          </button>
          {!collapsed && <div className="admin-version">v3.0 · Admin Panel</div>}
        </div>
      </div>

      {/* ─── Mobile Backdrop ─── */}
      <div
        className={`admin-sidebar-backdrop ${isOpen ? 'active' : ''}`}
        onClick={() => window.innerWidth <= 1024 && onCloseSidebar()}
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