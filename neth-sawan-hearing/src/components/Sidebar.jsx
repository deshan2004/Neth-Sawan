// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import ProfileEditModal from './ProfileEditModal';
import './Sidebar.css';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  onClose, 
  isOpen, 
  user, 
  isGuest, 
  onLogout,
  onShowInstructions 
}) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: isGuest ? 'Guest User' : (user?.displayName || user?.email?.split('@')[0] || 'User'),
    photoURL: null,
  });

  // Load guest profile from localStorage
  useEffect(() => {
    if (isGuest) {
      const saved = localStorage.getItem('neth_sawan_guest_profile');
      if (saved) {
        const guestProfile = JSON.parse(saved);
        setProfileData(prev => ({ ...prev, ...guestProfile }));
      }
    }
  }, [isGuest]);

  // Also listen for auth changes to update profile data when user logs in/out
  useEffect(() => {
    if (user && !isGuest) {
      setProfileData(prev => ({
        ...prev,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || null,
      }));
    }
  }, [user, isGuest]);

  const handleProfileUpdate = (updatedData) => {
    setProfileData(prev => ({ ...prev, ...updatedData }));
  };

  const menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'Home', sinhala: 'මුල් පිටුව' },
    { id: 'vision', icon: '👁️', label: 'AI Vision', sinhala: 'AI දෘෂ්ටිය' },
    { id: 'learn', icon: '🤟', label: 'Learn Signs', sinhala: 'සංඥා ඉගෙන ගන්න' },
    { id: 'community', icon: '👥', label: 'Community', sinhala: 'ප්‍රජාව' },
    { id: 'alerts', icon: '🔔', label: 'Alerts', sinhala: 'ඇඟවීම්' },
    { id: 'contacts', icon: '📇', label: 'Contacts', sinhala: 'සම්බන්ධතා' },
    { id: 'emergency', icon: '🆘', label: 'SOS', sinhala: 'හදිසි අවස්ථා' },
    { id: 'roadmonitor', icon: '🛣️', label: 'Road Monitor', sinhala: 'මාර්ග ආරක්ෂාව' },
    { id: 'settings', icon: '♿', label: 'Accessibility', sinhala: 'ප්‍රවේශ්‍යතාව' }
  ];

  return (
    <>
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-mini">
            <span>👂</span>
            <span>Neth-Sawan</span>
          </div>
          <button className="close-sidebar" onClick={onClose}>✕</button>
        </div>
        
        {/* 👇 Enhanced Profile Section */}
        <div className="profile-section" onClick={() => setShowProfileModal(true)}>
          <div className="profile-bg"></div>
          <div className="profile-avatar-wrapper">
            <div className="avatar">
              {profileData.photoURL ? (
                <img src={profileData.photoURL} alt="Profile" className="profile-img" />
              ) : (
                <div className="avatar-initial">
                  {profileData.displayName?.charAt(0)?.toUpperCase() || '👤'}
                </div>
              )}
              <div className="avatar-edit-icon">✎</div>
            </div>
          </div>
          <h3 className="profile-name">{profileData.displayName}</h3>
          <p className="profile-status">
            {isGuest ? '👤 Guest Mode · Local Data' : '✅ Logged In'}
          </p>
          {isGuest && <span className="guest-badge">Local Data Only</span>}
          <div className="accessibility-badge">
            <span>♿ Accessibility Ready</span>
          </div>
        </div>

        <nav className="nav-links">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth <= 1024) onClose();
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.sinhala}</span>
              <span className="nav-label-en">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button 
            className="help-btn-sidebar" 
            onClick={onShowInstructions}
            title="How to use Neth-Sawan"
          >
            ❓ How It Works
          </button>

          <button className="logout-btn-sidebar" onClick={onLogout}>
            🚪 Sign Out
          </button>
          <div className="version">Neth-Sawan v3.0 - Deaf Accessibility Edition</div>
        </div>
      </aside>

      {showProfileModal && (
        <ProfileEditModal
          user={user}
          isGuest={isGuest}
          onClose={() => setShowProfileModal(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </>
  );
};

export default Sidebar;