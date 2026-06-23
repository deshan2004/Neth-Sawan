// src/components/Header.jsx
import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Header.css';

const Header = ({ 
  isListening, lang, setLang, showToast, user, isGuest,
  roadSafetyActive, setRoadSafetyActive,
  emergencyNotificationsEnabled, onToggleEmergencyNotifications,
  onToggleSidebar, sidebarOpen,
  fallDetectorBlocked, onRequestFallPermission,
  onTestFall,
  onTriggerEmergency,
  // 👇 new props for admin
  isAdmin = false,
  onOpenAdmin
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
        {/* 🔥 SOS BUTTON */}
        <button 
          className="sos-header-btn"
          onClick={onTestFall}
          title="SOS Emergency"
        >
          <span className="sos-icon">🆘</span>
          <span className="sos-text">SOS</span>
        </button>

        {fallDetectorBlocked && (
          <button 
            className="fall-permission-btn"
            onClick={onRequestFallPermission}
            title="Enable fall detection (requires motion sensors)"
          >
            <span>📳 Enable Fall Detection</span>
          </button>
        )}

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
        
        {/* 🔥 ADMIN BUTTON – only for logged‑in admin users */}
        {isAdmin && !isGuest && onOpenAdmin && (
          <button 
            className="admin-header-btn"
            onClick={onOpenAdmin}
            title="Open Admin Panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '40px',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #F5C842, #E8B830)',
              color: '#000',
              boxShadow: '0 2px 12px rgba(245, 200, 66, 0.3)',
              transition: 'all 0.2s',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ fontSize: '1.2rem' }}>🛡️</span>
            <span>Admin</span>
          </button>
        )}

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