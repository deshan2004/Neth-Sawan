// src/components/Header.jsx
import React from 'react';
import './Header.css';

const Header = ({ 
  isListening, lang, setLang, showToast, user, isGuest,
  roadSafetyActive, setRoadSafetyActive,
  emergencyNotificationsEnabled, onToggleEmergencyNotifications
}) => {
  return (
    <header className="app-header">
      <div className="logo-section">
        <h1 className="logo-text">Neth-Sawan</h1>
        <span className="tagline">Visual Hearing Assistant</span>
        <div className="lang-switcher">
          <button 
            className={`lang-btn ${lang === 'si-LK' ? 'active' : ''}`} 
            onClick={() => { setLang('si-LK'); showToast('Switched to Sinhala', 'success'); }}
          >
            🇱🇰 සිංහල
          </button>
          <button 
            className={`lang-btn ${lang === 'en-US' ? 'active' : ''}`} 
            onClick={() => { setLang('en-US'); showToast('Switched to English', 'success'); }}
          >
            🇬🇧 English
          </button>
        </div>
      </div>
      <div className="header-right">
        {/* Emergency Toggle – with stopPropagation */}
        <button 
          className={`emergency-toggle-btn ${emergencyNotificationsEnabled ? 'enabled' : 'disabled'}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleEmergencyNotifications();
          }}
          title={emergencyNotificationsEnabled ? 'Disable emergency alerts' : 'Enable emergency alerts'}
        >
          <span className="emergency-icon">{emergencyNotificationsEnabled ? '🔔' : '🔕'}</span>
          <span className="emergency-text">{emergencyNotificationsEnabled ? 'Alerts ON' : 'Alerts OFF'}</span>
        </button>

        {/* Road Safety Toggle – with stopPropagation */}
        <button 
          className={`road-safety-toggle ${roadSafetyActive ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setRoadSafetyActive(!roadSafetyActive);
            showToast(roadSafetyActive ? 'Road safety off' : 'Road safety on', 'info');
          }}
        >
          <span>🚗</span>
          <span>{roadSafetyActive ? 'Road Safe ON' : 'Road Safe OFF'}</span>
        </button>

        <div className={`listening-status ${isListening ? 'active' : ''}`}>
          <div className="status-dot"></div>
          <span className="status-text">{isListening ? '🎤 LISTENING' : '⏹ STOPPED'}</span>
        </div>
        
        <div className="user-badge">
          <span>{isGuest ? '👤' : '👂'}</span>
          <span>{isGuest ? 'Guest' : (user?.displayName || user?.email?.split('@')[0] || 'User')}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;