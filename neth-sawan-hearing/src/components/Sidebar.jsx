// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
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
    email: user?.email || '',
  });

  // 🔥 Real‑time Firestore listener
  useEffect(() => {
    if (!user || isGuest) return;
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileData(prev => ({
          ...prev,
          displayName: data.displayName || data.name || user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: data.photoURL || user.photoURL || null,
          email: data.email || user.email || '',
        }));
      }
    });
    return () => unsubscribe();
  }, [user, isGuest]);

  // Guest mode: load from localStorage
  useEffect(() => {
    if (isGuest) {
      const saved = localStorage.getItem('neth_sawan_guest_profile');
      if (saved) {
        const guestProfile = JSON.parse(saved);
        setProfileData(prev => ({ ...prev, ...guestProfile }));
      }
    }
  }, [isGuest]);

  const handleProfileUpdate = (updatedData) => {
    setProfileData(prev => ({ ...prev, ...updatedData }));
  };

  const menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'මුල් පිටුව', en: 'Home' },
    { id: 'vision', icon: '👁️', label: 'AI දෘෂ්ටිය', en: 'AI Vision' },
    { id: 'learn', icon: '🤟', label: 'සංඥා ඉගෙන ගන්න', en: 'Learn Signs' },
    { id: 'community', icon: '👥', label: 'ප්‍රජාව', en: 'Community' },
    { id: 'alerts', icon: '🔔', label: 'ඇඟවීම්', en: 'Alerts' },
    { id: 'contacts', icon: '📇', label: 'සම්බන්ධතා', en: 'Contacts' },
    { id: 'emergency', icon: '🆘', label: 'හදිසි අවස්ථා', en: 'SOS' },
    { id: 'roadmonitor', icon: '🛣️', label: 'මාර්ග ආරක්ෂාව', en: 'Road Monitor' },
    { id: 'settings', icon: '♿', label: 'ප්‍රවේශ්‍යතාව', en: 'Accessibility' }
  ];

  return (
    <>
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* ----- HEADER: empty (no close button) ----- */}
        <div className="sidebar-header"></div>

        {/* ----- PROFILE CARD ----- */}
        <div className="profile-section" onClick={() => setShowProfileModal(true)}>
          <div className="profile-glow"></div>
          <div className="profile-avatar-wrapper">
            <div className="avatar">
              {profileData.photoURL ? (
                <img src={profileData.photoURL} alt="Profile" className="profile-img" />
              ) : (
                <div className="avatar-initial">
                  {profileData.displayName?.charAt(0)?.toUpperCase() || '👤'}
                </div>
              )}
              <span className={`status-dot ${isGuest ? 'status-offline' : 'status-online'}`}></span>
              <div className="avatar-edit-overlay">
                <span className="edit-icon">✎</span>
              </div>
            </div>
          </div>
          <div className="profile-info">
            <div className="profile-name-row">
              <span className="profile-name">{profileData.displayName}</span>
              {isGuest && <span className="guest-badge">Guest</span>}
            </div>
            <span className={`profile-status ${isGuest ? 'status-offline' : 'status-online'}`}>
              {isGuest ? '📁 Local Data' : '🟢 Online'}
            </span>
            {!isGuest && profileData.email && (
              <span className="profile-email">{profileData.email}</span>
            )}
          </div>
          <span className="profile-chevron">›</span>
        </div>

        {/* ----- NAVIGATION ----- */}
        <nav className="nav-links">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                // Close sidebar on mobile after navigation
                if (window.innerWidth <= 1024) onClose();
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              <span className="nav-label-en">{item.en}</span>
            </button>
          ))}
        </nav>

        {/* ----- FOOTER ----- */}
        <div className="sidebar-footer">
          <button className="help-btn-sidebar" onClick={onShowInstructions}>
            ❓ How It Works
          </button>
          <button className="logout-btn-sidebar" onClick={onLogout}>
            🚪 Sign Out
          </button>
          <div className="version">v3.0 · Deaf Accessibility</div>
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