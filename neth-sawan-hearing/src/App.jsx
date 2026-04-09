import React, { useState, useEffect, useCallback } from 'react';
import { useSpeech } from './hooks/useSpeech';
import { useVolume } from './hooks/useVolume';
import { useNotifications } from './hooks/useNotifications';
import Header from './components/Header';
import TranscriptBox from './components/TranscriptBox';
import VisualAlert from './components/VisualAlert';
import SignLanguageBox from './components/SignLanguageBox';
import SoundHistory from './components/SoundHistory';
import HapticFeedback from './components/HapticFeedback';
import SoundVisualizer from './components/SoundVisualizer';
import RelativesManager from './components/RelativesManager';
import NotificationCenter from './components/NotificationCenter';
import AiVisionPanel from './components/AiVisionPanel';
import Emergencycontactmodal from './components/Emergencycontactmodal';
import './App.css';

function App() {
  const [theme, setTheme] = useState('dark');
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState('normal');
  const [emergencyMsg, setEmergencyMsg] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [toastMessage, setToastMessage] = useState({ show: false, message: '', type: '' });
  const [sidebarVisible, setSidebarVisible] = useState(window.innerWidth > 1024);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [soundThreshold, setSoundThreshold] = useState(0.15);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [currentEmergencyData, setCurrentEmergencyData] = useState(null);

  const {
    transcript, isListening, startListening, stopListening,
    clearTranscript, setLang, lang, error: speechError
  } = useSpeech('si-LK');

  const { isLoud, volume, soundType, soundHistory, audioError } = useVolume(soundThreshold);

  const {
    relatives, addRelative, removeRelative, updateRelative,
    notifyRelatives, notificationQueue, markAsRead, clearNotifications,
    openWhatsApp, openSMS, makeCall, autoSendStatus, requestPermission
  } = useNotifications();

  const emergencyOptions = [
    { text: '🆘 මට උදව් කරන්න', sign: 'Help', sinhala: 'මට උදව් කරන්න', english: 'Help me' },
    { text: '👂 මට ඇසෙන්නේ නැත', sign: 'Cannot hear', sinhala: 'මට ඇසෙන්නේ නැත', english: 'I cannot hear' },
    { text: '🚔 පොලිසිය අමතන්න', sign: 'Call police', sinhala: 'පොලිසිය අමතන්න', english: 'Call police' },
    { text: '🚑 ගිලන් රථය', sign: 'Ambulance', sinhala: 'ගිලන් ථය', english: 'Ambulance' },
    { text: '🔥 ගින්න', sign: 'Fire', sinhala: 'ගින්න', english: 'Fire' },
    { text: '🏠 ගෙදර යන්න', sign: 'Go home', sinhala: 'ගෙදර යන්න', english: 'Go home' },
  ];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.style.fontSize =
      fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px';
  }, [fontSize]);

  useEffect(() => {
    const handleResize = () => setSidebarVisible(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isListening) showToast('සවන් දීම ආරම්භ විය / Listening started', 'success');
  }, [isListening]);

  useEffect(() => {
    if (isLoud && soundType) {
      showToast(`⚠️ ${soundType} detected`, 'warning');
      if (soundType.includes('Alarm') || soundType.includes('Vehicle') || soundType.includes('Loud')) {
        const emergencyData = {
          message: `Emergency sound detected: ${soundType}`,
          soundType,
          volume,
          timestamp: new Date(),
        };
        notifyRelatives(emergencyData);
        setCurrentEmergencyData(emergencyData);
        setShowEmergencyModal(true);
      }
    }
  }, [isLoud, soundType, volume, notifyRelatives]);

  const showToast = (message, type = 'info') => {
    setToastMessage({ show: true, message, type });
    setTimeout(() => setToastMessage({ show: false, message: '', type: '' }), 3000);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    showToast(`${next === 'dark' ? 'Dark' : 'Light'} theme activated`, 'success');
  };

  const handleEmergency = async (msg) => {
    setEmergencyMsg(msg);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        lang === 'si-LK' ? msg : emergencyOptions.find(o => o.text === msg)?.english || msg
      );
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
    const emergencyData = {
      message: msg,
      soundType: 'Emergency Button Pressed',
      volume: 1,
      timestamp: new Date(),
    };
    await notifyRelatives(emergencyData);
    setCurrentEmergencyData(emergencyData);
    setShowEmergencyModal(true);
  };

  const shareEmergency = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Neth-Sawan Emergency Alert',
          text: emergencyMsg,
          url: window.location.href,
        });
        showToast('Shared successfully', 'success');
      } catch { }
    } else {
      navigator.clipboard.writeText(emergencyMsg);
      showToast('Copied to clipboard', 'success');
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      requestPermission();
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-layout">
            <div className="left-panel">
              <TranscriptBox
                transcript={transcript}
                isListening={isListening}
                startListening={startListening}
                stopListening={stopListening}
                clearTranscript={clearTranscript}
                error={speechError}
              />
              <div className="card emergency-section">
                <div className="card-head">
                  <div className="card-title">
                    <span className="card-title-icon icon-red">🚨</span>
                    හදිසි පණිවිඩ / Emergency Messages
                  </div>
                  <div className="emergency-badge">24/7 Active</div>
                </div>
                <div className="enhanced-emergency-grid">
                  {emergencyOptions.map((item, i) => (
                    <button
                      key={i}
                      className="enhanced-emergency-btn"
                      onClick={() => handleEmergency(item.text)}
                    >
                      <div className="emergency-btn-content">
                        <span className="emergency-btn-icon">{item.text.charAt(0)}</span>
                        <div className="emergency-btn-text">
                          <span className="emergency-main-text">{item.text}</span>
                          <span className="emergency-sub-text">
                            {lang === 'si-LK' ? item.sinhala : item.english}
                          </span>
                        </div>
                        <span className="emergency-btn-arrow">→</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="emergency-quick-actions">
                  <button className="quick-action police" onClick={() => window.location.href = 'tel:119'}>
                    <span className="action-icon">🚔</span>
                    <div className="action-info">
                      <span className="action-title">Police</span>
                      <span className="action-number">119</span>
                    </div>
                  </button>
                  <button className="quick-action ambulance" onClick={() => window.location.href = 'tel:110'}>
                    <span className="action-icon">🚑</span>
                    <div className="action-info">
                      <span className="action-title">Ambulance</span>
                      <span className="action-number">110</span>
                    </div>
                  </button>
                  <button className="quick-action fire" onClick={() => window.location.href = 'tel:112'}>
                    <span className="action-icon">🔥</span>
                    <div className="action-info">
                      <span className="action-title">Fire</span>
                      <span className="action-number">112</span>
                    </div>
                  </button>
                </div>
              </div>
              <SoundHistory soundHistory={soundHistory} />
            </div>

            <div className="right-panel">
              <VisualAlert
                isLoud={isLoud}
                volume={volume}
                soundType={soundType}
                soundHistory={soundHistory}
                threshold={soundThreshold}
                onThresholdChange={setSoundThreshold}
              />
              <SoundVisualizer volume={volume} isLoud={isLoud} soundType={soundType} />
              <SignLanguageBox transcript={transcript} />
            </div>
          </div>
        );

      case 'vision':
        return (
          <div className="dashboard-layout" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="left-panel">
              <AIVisionPanel lang={lang} showToast={showToast} />
            </div>
            <div className="right-panel">
              <div className="card">
                <div className="card-head">
                  <div className="card-title">
                    <span className="card-title-icon icon-violet">ℹ️</span>
                    AI Vision Guide
                  </div>
                </div>
                <div className="vision-guide-list">
                  {[
                    { icon: '🔍', title: 'Describe', desc: 'AI describes everything in the image' },
                    { icon: '📝', title: 'Read Text', desc: 'Extracts all text from the image' },
                    { icon: '💵', title: 'Currency', desc: 'Identifies currency notes and coins' },
                    { icon: '📦', title: 'Objects', desc: 'Lists all objects in the image' },
                    { icon: '⚠️', title: 'Safety', desc: 'Identifies safety warnings and hazards' },
                  ].map((item, i) => (
                    <div key={i} className="vision-guide-item">
                      <span className="guide-icon">{item.icon}</span>
                      <div>
                        <div className="guide-title">{item.title}</div>
                        <div className="guide-desc">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="dashboard-layout">
            <div className="left-panel">
              <SoundHistory soundHistory={soundHistory} />
              <NotificationCenter
                queue={notificationQueue}
                onMarkRead={markAsRead}
                onClear={clearNotifications}
              />
            </div>
            <div className="right-panel">
              <SoundVisualizer volume={volume} isLoud={isLoud} soundType={soundType} />
              <VisualAlert
                isLoud={isLoud} volume={volume} soundType={soundType}
                soundHistory={soundHistory} threshold={soundThreshold}
                onThresholdChange={setSoundThreshold}
              />
            </div>
          </div>
        );

      case 'emergency':
        return (
          <div className="dashboard-layout">
            <div className="left-panel">
              <div className="card emergency-section">
                <div className="card-head">
                  <div className="card-title">
                    <span className="card-title-icon icon-red">🚨</span>
                    Emergency Response
                  </div>
                </div>
                <div className="enhanced-emergency-grid">
                  {emergencyOptions.map((item, i) => (
                    <button key={i} className="enhanced-emergency-btn"
                      onClick={() => handleEmergency(item.text)}>
                      <div className="emergency-btn-content">
                        <span className="emergency-btn-icon">{item.text.charAt(0)}</span>
                        <div className="emergency-btn-text">
                          <span className="emergency-main-text">{item.text}</span>
                          <span className="emergency-sub-text">{item.english}</span>
                        </div>
                        <span className="emergency-btn-arrow">→</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="emergency-quick-actions">
                  <button className="quick-action police" onClick={() => window.location.href = 'tel:119'}>
                    <span className="action-icon">🚔</span>
                    <div className="action-info">
                      <span className="action-title">Police</span>
                      <span className="action-number">119</span>
                    </div>
                  </button>
                  <button className="quick-action ambulance" onClick={() => window.location.href = 'tel:110'}>
                    <span className="action-icon">🚑</span>
                    <div className="action-info">
                      <span className="action-title">Ambulance</span>
                      <span className="action-number">110</span>
                    </div>
                  </button>
                  <button className="quick-action fire" onClick={() => window.location.href = 'tel:112'}>
                    <span className="action-icon">🔥</span>
                    <div className="action-info">
                      <span className="action-title">Fire</span>
                      <span className="action-number">112</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            <div className="right-panel">
              <VisualAlert
                isLoud={isLoud} volume={volume} soundType={soundType}
                soundHistory={soundHistory} threshold={soundThreshold}
                onThresholdChange={setSoundThreshold}
              />
            </div>
          </div>
        );

      case 'contacts':
        return (
          <div className="dashboard-layout">
            <div className="left-panel">
              <RelativesManager
                relatives={relatives}
                onAdd={addRelative}
                onRemove={removeRelative}
                onUpdate={updateRelative}
                onTest={(relative) => {
                  notifyRelatives({
                    message: `Test notification for ${relative.name}`,
                    soundType: 'Test',
                    volume: 0.5,
                    timestamp: new Date(),
                  });
                  showToast(`Test alert sent to ${relative.name}`, 'success');
                }}
                autoSendStatus={autoSendStatus}
              />
            </div>
            <div className="right-panel">
              <NotificationCenter
                queue={notificationQueue}
                onMarkRead={markAsRead}
                onClear={clearNotifications}
              />
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="dashboard-layout" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="left-panel">
              <div className="card">
                <div className="card-head">
                  <div className="card-title">
                    <span className="card-title-icon icon-teal">🎨</span>
                    Appearance
                  </div>
                </div>
                <div className="settings-list">
                  {[
                    {
                      label: 'Theme', sinhala: 'තේමාව',
                      action: toggleTheme,
                      value: theme === 'dark' ? '🌙 Dark' : '☀️ Light'
                    },
                    {
                      label: 'High Contrast', sinhala: 'ඉහළ ප්‍රතිවිරෝධතාව',
                      action: () => { setHighContrast(!highContrast); showToast(highContrast ? 'Normal contrast' : 'High contrast on', 'success'); },
                      value: highContrast ? '✅ On' : '⬜ Off'
                    },
                    {
                      label: 'Font Size', sinhala: 'අකුරු ප්‍රමාණය',
                      action: () => {
                        const sizes = ['small', 'normal', 'large'];
                        const next = sizes[(sizes.indexOf(fontSize) + 1) % 3];
                        setFontSize(next);
                        showToast(`Font: ${next}`, 'info');
                      },
                      value: fontSize === 'small' ? 'A Small' : fontSize === 'large' ? 'A Large' : 'A Normal'
                    },
                  ].map((item, i) => (
                    <div key={i} className="settings-item">
                      <div>
                        <div className="settings-label">{item.sinhala}</div>
                        <div className="settings-sub">{item.label}</div>
                      </div>
                      <button onClick={item.action} className="settings-btn">
                        {item.value}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-head">
                  <div className="card-title">
                    <span className="card-title-icon icon-amber">🎤</span>
                    Audio Settings
                  </div>
                </div>
                <div className="setting-item">
                  <label>Sound Sensitivity: {Math.round(soundThreshold * 100)}%</label>
                  <input
                    type="range" min="0.05" max="0.3" step="0.01"
                    value={soundThreshold}
                    onChange={(e) => setSoundThreshold(parseFloat(e.target.value))}
                    className="slider"
                  />
                  <div className="slider-marks">
                    <span>Low</span><span>Normal</span><span>High</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="right-panel">
              <div className="card">
                <div className="card-head">
                  <div className="card-title">
                    <span className="card-title-icon icon-teal">ℹ️</span>
                    About Neth-Sawan
                  </div>
                </div>
                <div className="about-list">
                  {[
                    { label: 'Version', value: 'v2.0.0' },
                    { label: 'Build', value: 'AI-Enhanced Release' },
                    { label: 'For', value: 'Hearing Impaired Community' },
                    { label: 'Languages', value: 'Sinhala & English' },
                  ].map((item, i) => (
                    <div key={i} className="about-item">
                      <span className="about-label">{item.label}</span>
                      <span className="about-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`app-wrapper ${isLoud ? 'danger-bg' : ''}`}>
      <HapticFeedback isLoud={isLoud} volume={volume} soundType={soundType} />

      <div className="accessibility-toolbar">
        <button onClick={toggleTheme} data-tooltip={theme === 'dark' ? 'Light Theme' : 'Dark Theme'}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button onClick={() => { setHighContrast(!highContrast); }} data-tooltip="High Contrast">
          👁️
        </button>
        <button onClick={() => setFontSize(s => s === 'normal' ? 'large' : s === 'large' ? 'small' : 'normal')}
          data-tooltip="Font Size">
          A+
        </button>
        <button onClick={() => setShowTutorial(true)} data-tooltip="Help Guide">
          ?
        </button>
      </div>

      <aside className={`app-sidebar ${sidebarVisible ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="close-sidebar" onClick={() => setSidebarVisible(false)}>✖</button>
        </div>
        <div className="profile-section">
          <div className="avatar">👤</div>
          <h3>Neth-Sawan</h3>
          <p>ශ්‍රවණ සහායක</p>
        </div>
        <nav className="nav-links">
          {[
             { id: 'dashboard', icon: '🏠', label: 'Dashboard', sinhala: 'මුල් පිටුව' },
        { id: 'vision', icon: '👁️', label: 'AI Vision', sinhala: 'AI දෘෂ්ටිය' },
        { id: 'history', icon: '📋', label: 'History', sinhala: 'ඉතිහාසය' },
        { id: 'emergency', icon: '🆘', label: 'Emergency', sinhala: 'හදිසි අවස්ථා' },
        { id: 'contacts', icon: '📇', label: 'Contacts', sinhala: 'සම්බන්ධතා' },
        { id: 'settings', icon: '⚙️', label: 'Settings', sinhala: 'සැකසුම්' }
          ].map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth <= 1024) setSidebarVisible(false);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              <span className="nav-label-en">{item.en}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="version">v2.0.0</div>
          <div className="build">NextGen Minds</div>
        </div>
      </aside>

      {!sidebarVisible && (
        <button className="mobile-menu-btn" onClick={() => setSidebarVisible(true)}>☰</button>
      )}

      <div className={`content-area ${sidebarVisible ? 'sidebar-open' : ''}`}>
        <header className="app-header">
          <div className="logo-section">
            <h2 className="logo-text">Neth-Sawan</h2>
            <span className="tagline">Hearing Assistant · ශ්‍රවණ සහායක</span>
            <div className="lang-switcher">
              <button className={lang === 'si-LK' ? 'active' : ''}
                onClick={() => { setLang('si-LK'); showToast('සිංහල', 'success'); }}>
                🇱🇰 සිංහල
              </button>
              <button className={lang === 'en-US' ? 'active' : ''}
                onClick={() => { setLang('en-US'); showToast('English', 'success'); }}>
                🇬🇧 English
              </button>
            </div>
          </div>
          <div className={`status-indicator ${isListening ? 'listening' : ''}`}>
            <span className="dot"></span>
            <span>{isListening ? 'සවන් දෙමින් / Listening...' : 'නවත්වා ඇත / Paused'}</span>
            {isListening && (
              <div className="listening-wave">
                <span></span><span></span><span></span>
              </div>
            )}
          </div>
        </header>

        <main>{renderContent()}</main>

        <button className="help-button" onClick={() => setShowTutorial(true)}>?</button>
      </div>

      {/* Floating Emergency SOS Button */}
      <button 
        className="floating-emergency-btn"
        onClick={() => {
          const msg = "🆘 HELP - I need immediate assistance!";
          handleEmergency(msg);
        }}
      >
        <div className="emergency-btn-inner">
          <span className="emergency-btn-text">SOS</span>
          <span className="emergency-btn-pulse"></span>
        </div>
      </button>

      {emergencyMsg && (
        <div className="emergency-overlay" onClick={() => setEmergencyMsg('')}>
          <div className="emergency-content" onClick={e => e.stopPropagation()}>
            <div className="emergency-header">
              <span className="emergency-siren">🚨</span>
              <h1>{emergencyMsg}</h1>
            </div>
            <p className="emergency-description">
              {lang === 'si-LK'
                ? 'ඔබගේ හදිසි පණිවිඩය යවා ඇත. ඔබගේ ඥාතීන්ට දැනුම් දෙනු ලැබේ.'
                : 'Emergency message sent. Your contacts have been notified.'}
            </p>
            <div className="emergency-actions">
              <button className="emergency-share-btn" onClick={shareEmergency}>📤 Share</button>
              <button className="emergency-close-btn" onClick={() => setEmergencyMsg('')}>✖ Close</button>
            </div>
          </div>
        </div>
      )}

      {showEmergencyModal && currentEmergencyData && (
        <EmergencyContactModal
          emergencyData={currentEmergencyData}
          relatives={relatives}
          onWhatsApp={openWhatsApp}
          onSMS={openSMS}
          onCall={makeCall}
          onClose={() => {
            setShowEmergencyModal(false);
            setCurrentEmergencyData(null);
          }}
          autoSendStatus={autoSendStatus}
        />
      )}

      {showTutorial && (
        <div className="tutorial-overlay" onClick={() => setShowTutorial(false)}>
          <div className="tutorial-content" onClick={e => e.stopPropagation()}>
            <h2>🎓 Neth-Sawan Guide</h2>
            <div className="tutorial-sections">
              {[
                { title: '👂 Speech to Text', items: ['🎤 Click Start Listening and speak', '🔊 Loud sounds trigger red alerts', '⠿ Enable Braille display', '📊 Monitor sound levels'] },
                { title: '🤖 AI Vision', items: ['📷 Upload or take a photo', '🔍 Identify objects, text, currency', '🔊 AI reads results aloud', '📋 Supports Sri Lankan Rupees'] },
                { title: '✋ Sign Language', items: ['🔤 Speak letters A-Z to see signs', '🎓 Learning Mode to practice', '👆 Click any letter to learn'] },
                { title: '🚨 Emergency', items: ['📢 One-click emergency messages', '📞 Quick dial Police 119 / Ambulance 110', '👥 Add contacts in Contacts tab', '🔔 Auto-notify on loud sounds'] },
              ].map((section, i) => (
                <div className="tutorial-section" key={i}>
                  <h3>{section.title}</h3>
                  <ul>{section.items.map((item, j) => <li key={j}>{item}</li>)}</ul>
                </div>
              ))}
            </div>
            <div className="tutorial-tips">
              <h3>💡 Tips</h3>
              <ul>
                <li>✅ Grant microphone permission for speech recognition</li>
                <li>✅ Add emergency contacts in Contacts tab</li>
                <li>✅ Enable Auto-Send for automatic WhatsApp alerts</li>
                <li>✅ Use High Contrast mode for better visibility</li>
              </ul>
            </div>
            <button className="close-tutorial" onClick={() => setShowTutorial(false)}>✖ Close</button>
          </div>
        </div>
      )}

      {toastMessage.show && (
        <div className={`toast-message ${toastMessage.type}`}>
          {toastMessage.type === 'success' && '✅ '}
          {toastMessage.type === 'warning' && '⚠️ '}
          {toastMessage.type === 'error' && '❌ '}
          {toastMessage.type === 'info' && 'ℹ️ '}
          {toastMessage.message}
        </div>
      )}

      {isListening && (
        <div className="listening-indicator">
          <div className="listening-wave-anim">
            <span/><span/><span/><span/>
          </div>
          <span>සවන් දෙමින් / Listening...</span>
        </div>
      )}
    </div>
  );
}

export default App;