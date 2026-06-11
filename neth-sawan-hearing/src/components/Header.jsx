import React from 'react';

const Header = ({ isListening, lang, setLang, showToast, user, isGuest, roadSafetyActive, setRoadSafetyActive, emergencyNotificationsEnabled, onToggleEmergencyNotifications }) => {
  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      background: '#0A0C1A',
      borderBottom: '4px solid #FFFF00',
      flexWrap: 'wrap',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#00FFCC', margin: 0 }}>Neth-Sawan</h1>
        <span style={{ fontSize: '14px', color: '#D0D8FF' }}>Visual Hearing Assistant</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { setLang('si-LK'); showToast('Switched to Sinhala', 'success'); }} style={{ padding: '8px 16px', fontWeight: 'bold', background: lang === 'si-LK' ? '#00CCAA' : '#2A2F55', border: 'none', borderRadius: '40px', color: '#FFF', cursor: 'pointer' }}>
            🇱🇰 සිංහල
          </button>
          <button onClick={() => { setLang('en-US'); showToast('Switched to English', 'success'); }} style={{ padding: '8px 16px', fontWeight: 'bold', background: lang === 'en-US' ? '#00CCAA' : '#2A2F55', border: 'none', borderRadius: '40px', color: '#FFF', cursor: 'pointer' }}>
            🇬🇧 English
          </button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={onToggleEmergencyNotifications} style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderRadius: '48px', fontWeight: 'bold', fontSize: '16px',
          background: emergencyNotificationsEnabled ? '#00CCAA' : '#FF0033', color: '#000', border: 'none', cursor: 'pointer'
        }}>
          <span>{emergencyNotificationsEnabled ? '🔔' : '🔕'}</span>
          <span>{emergencyNotificationsEnabled ? 'Alerts ON' : 'Alerts OFF'}</span>
        </button>

        <button onClick={() => { setRoadSafetyActive(!roadSafetyActive); showToast(roadSafetyActive ? 'Road safety off' : 'Road safety on', 'info'); }} style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderRadius: '48px', fontWeight: 'bold', fontSize: '16px',
          background: roadSafetyActive ? '#FF8800' : '#2A2F55', color: '#FFF', border: 'none', cursor: 'pointer'
        }}>
          <span>🚗</span>
          <span>{roadSafetyActive ? 'Road Safe ON' : 'Road Safe OFF'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 20px', borderRadius: '48px', background: isListening ? '#00CCAA20' : '#2A2F55', border: isListening ? '2px solid #00FFCC' : 'none' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: isListening ? '#00FFCC' : '#888' }}></span>
          <span style={{ fontWeight: 'bold' }}>{isListening ? "🎤 LISTENING" : "⏹ STOPPED"}</span>
        </div>
        
        <div style={{ background: '#1A1E3A', padding: '8px 16px', borderRadius: '48px' }}>
          <span>{isGuest ? '👤 Guest' : `👂 ${user?.displayName || user?.email?.split('@')[0] || 'User'}`}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;