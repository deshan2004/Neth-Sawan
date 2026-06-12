import React from 'react';
import './Header.css';

const Header = ({
  isListening,
  lang,
  setLang,
  showToast,
  user,
  isGuest,
  roadSafetyActive,
  setRoadSafetyActive,
  emergencyNotificationsEnabled,
  onToggleEmergencyNotifications
}) => {
  return (
    <header className="app-header">
      {/* Left section: Logo + Tagline + Language Switcher */}
      <div className="logo-section">
        <h1 className="logo-text">Neth-Sawan</h1>
        <span className="tagline">Visual Hearing Assistant</span>
        <div className="lang-switcher">
          <button
            className={`lang-btn ${lang === 'si-LK' ? 'active' : ''}`}
            onClick={() => {
              setLang('si-LK');
              showToast('Switched to Sinhala', 'success');
            }}
          >
            🇱🇰 සිංහල
          </button>
          <button
            className={`lang-btn ${lang === 'en-US' ? 'active' : ''}`}
            onClick={() => {
              setLang('en-US');
              showToast('Switched to English', 'success');
            }}
          >
            🇬🇧 English
          </button>
        </div>
      </div>

      {/* Right section: Buttons + Status + User */}
      <div className="header-right">
        {/* Emergency notifications toggle */}
        <button
          className={`emergency-toggle ${emergencyNotificationsEnabled ? 'enabled' : 'disabled'}`}
          onClick={onToggleEmergencyNotifications}
          title={emergencyNotificationsEnabled ? 'Disable emergency alerts' : 'Enable emergency alerts'}
        >
          <span>{emergencyNotificationsEnabled ? '🔔' : '🔕'}</span>
          <span>{emergencyNotificationsEnabled ? 'Alerts ON' : 'Alerts OFF'}</span>
        </button>

        {/* Road safety toggle */}
        <button
          className={`road-safety-toggle ${roadSafetyActive ? 'active' : ''}`}
          onClick={() => {
            setRoadSafetyActive(!roadSafetyActive);
            showToast(
              roadSafetyActive ? 'Road safety monitoring off' : 'Road safety monitoring on – listening for vehicles',
              'info'
            );
          }}
          title={roadSafetyActive ? 'Disable road safety' : 'Enable road safety (detects horns, sirens, engines)'}
        >
          <span>🚗</span>
          <span>{roadSafetyActive ? 'Road Safe ON' : 'Road Safe OFF'}</span>
        </button>

        {/* Listening status */}
        <div className={`listening-status ${isListening ? 'active' : ''}`}>
          <div className="status-dot"></div>
          <span className="status-text">{isListening ? '🎤 LISTENING' : '⏹ STOPPED'}</span>
        </div>

        {/* User badge */}
        <div className="user-badge">
          <span>{isGuest ? '👤' : '👂'}</span>
          <span>
            {isGuest
              ? 'Guest'
              : user?.displayName || user?.email?.split('@')[0] || 'User'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;