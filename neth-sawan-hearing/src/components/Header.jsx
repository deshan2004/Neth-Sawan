// src/components/Header.jsx
import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Header.css';

const Header = ({ 
  isListening, lang, setLang, showToast, user, isGuest,
  roadSafetyActive, setRoadSafetyActive,
  emergencyNotificationsEnabled, onToggleEmergencyNotifications,
  onToggleSidebar, sidebarOpen
}) => {
  const { t } = useLanguage();

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="hamburger-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          {sidebarOpen ? '✕' : '☰'}
        </button>

        <div className="header-brand">
          <span className="brand-name">{t('appName')}</span>
          <span className="brand-tagline">{t('tagline')}</span>
        </div>
      </div>

      <div className="header-right">
        <div className="lang-switcher">
          <button className={`lang-btn ${lang === 'si-LK' ? 'active' : ''}`} onClick={() => { setLang('si-LK'); showToast(t('switchedToSinhala'), 'success'); }}>
            🇱🇰 සිංහල
          </button>
          <button className={`lang-btn ${lang === 'en-US' ? 'active' : ''}`} onClick={() => { setLang('en-US'); showToast(t('switchedToEnglish'), 'success'); }}>
            🇬🇧 English
          </button>
        </div>

        <button 
          className={`emergency-toggle-btn ${emergencyNotificationsEnabled ? 'enabled' : 'disabled'}`}
          onClick={onToggleEmergencyNotifications}
          title={emergencyNotificationsEnabled ? 'Disable emergency alerts' : 'Enable emergency alerts'}
        >
          <span className="emergency-icon">{emergencyNotificationsEnabled ? '🔔' : '🔕'}</span>
          <span className="emergency-text">{emergencyNotificationsEnabled ? t('alertsOn') : t('alertsOff')}</span>
        </button>

        <button 
          className={`road-safety-toggle ${roadSafetyActive ? 'active' : ''}`}
          onClick={() => {
            setRoadSafetyActive(!roadSafetyActive);
            showToast(roadSafetyActive ? t('roadSafeOff') : t('roadSafeOn'), 'info');
          }}
        >
          <span>🚗</span>
          <span>{roadSafetyActive ? t('roadSafeOn') : t('roadSafeOff')}</span>
        </button>

        <div className={`listening-status ${isListening ? 'active' : ''}`}>
          <div className="status-dot"></div>
          <span className="status-text">{isListening ? t('listening') : t('stopped')}</span>
        </div>
        
        <div className="user-badge">
          <span>{isGuest ? '👤' : '👂'}</span>
          <span>
            {isGuest ? t('guest') : (user?.displayName || user?.email?.split('@')[0] || t('user'))}
            {isGuest && <span className="guest-badge-header">{t('guest')}</span>}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;