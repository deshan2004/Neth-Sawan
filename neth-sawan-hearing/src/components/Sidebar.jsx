// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
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
  const { t, language } = useLanguage(); // also get language to conditionally show
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: isGuest ? t('guest') : (user?.displayName || user?.email?.split('@')[0] || t('user')),
    photoURL: null,
    email: user?.email || '',
  });

  // Real‑time Firestore listener
  useEffect(() => {
    if (!user || isGuest) return;
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileData(prev => ({
          ...prev,
          displayName: data.displayName || data.name || user.displayName || user.email?.split('@')[0] || t('user'),
          photoURL: data.photoURL || user.photoURL || null,
          email: data.email || user.email || '',
        }));
      }
    });
    return () => unsubscribe();
  }, [user, isGuest, t]);

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

  // 👇 Updated menu items – only id and icon; labels come from translations
  const menuItems = [
    { id: 'dashboard', icon: '🏠' },
    { id: 'roadmonitor', icon: '🛣️' },
    { id: 'vision', icon: '👁️' },
    { id: 'inperson', icon: '📸' },
     { id: 'emergency', icon: '🆘' },
    { id: 'community', icon: '👥' },
    { id: 'alerts', icon: '🔔' },
    { id: 'contacts', icon: '📇' },
     { id: 'learn', icon: '🤟' },
    { id: 'settings', icon: '♿' }
  ];

  const statusText = isGuest ? t('localData') : t('online');
  const statusClass = isGuest ? 'status-offline' : 'status-online';

  return (
    <>
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-header-spacer"></span>
          <button className="close-sidebar" onClick={onClose} aria-label="Close sidebar">
            ✕
          </button>
        </div>

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
              <span className={`status-dot ${statusClass}`}></span>
              <div className="avatar-edit-overlay">
                <span className="edit-icon">✎</span>
              </div>
            </div>
          </div>
          <div className="profile-info">
            <div className="profile-name-row">
              <span className="profile-name">{profileData.displayName}</span>
              {isGuest && <span className="guest-badge">{t('guest')}</span>}
            </div>
            <span className={`profile-status ${statusClass}`}>
              {statusText}
            </span>
            {!isGuest && profileData.email && (
              <span className="profile-email">{profileData.email}</span>
            )}
          </div>
          <span className="profile-chevron">›</span>
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
              {/* Only one label – translated via t() */}
              <span className="nav-label">{t(item.id)}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="help-btn-sidebar" onClick={onShowInstructions}>
            ❓ {t('howItWorks')}
          </button>
          <button className="logout-btn-sidebar" onClick={onLogout}>
            🚪 {t('signOut')}
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