import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TranscriptBox from './components/TranscriptBox';
import VisualAlert from './components/VisualAlert';
import SignLanguageBox from './components/SignLanguageBox';
import { SoundHistory } from './components/SoundHistory';
import SoundVisualizer from './components/SoundVisualizer';
import RelativesManager from './components/RelativesManager';
import NotificationCenter from './components/NotificationCenter';
import Aivision from './components/Aivision';
import Auth from './components/Auth';
import SignLanguageTutor from './components/SignLanguageTutor';
import EmergencyFlash from './components/EmergencyFlash';
import AccessibilitySettings from './components/AccessibilitySettings';
import RoadSafetyMonitor from './components/RoadSafetyMonitor';
import FallDetector from "./components/FallDetector";
import BackgroundVideo from './components/BackgroundVideo';
import LandingPage from './components/LandingPage';

// Hooks
import { useSpeech } from './hooks/useSpeech';
import { useVolume } from './hooks/useVolume';
import { useNotifications } from './hooks/useNotifications';

// Context
import { LanguageProvider, useLanguage } from './context/LanguageContext';

import './App.css';

// WhatsApp message helper for fall detection
const buildFallWhatsAppMessage = (contactName, location, userEmail) => {
  const time = new Date().toLocaleString('en-LK', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  let message = `🚨 *URGENT: FALL DETECTED - Neth-Sawan* 🚨\n\n`;
  message += `Dear ${contactName},\n\n`;
  message += `⚠️ *An immediate fall/impact was detected by your loved one's device, and they have not responded to the safety countdown.*\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📢 *ALERT TYPE:* 🛑 AUTOMATIC FALL DETECTION\n`;
  message += `🕒 *TIME:* ${time}\n`;
  message += `👤 *USER:* ${userEmail || 'Neth-Sawan User'}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  if (location) {
    message += `📍 *LAST KNOWN LIVE LOCATION:*\n`;
    message += `https://maps.google.com/?q=${location.lat},${location.lng}\n\n`;
  } else {
    message += `📍 *LOCATION:* Location services were unavailable, please try calling them immediately.\n\n`;
  }
  message += `📝 *MESSAGE:* This is an automated emergency alert. Immediate assistance may be required. Please contact or check on your loved one right away!\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `⚠️ *PLEASE RESPOND IMMEDIATELY* ⚠️\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `_Sent automatically by Neth-Sawan Accessibility Assistant._`;
  return message;
};

// Inner component that uses language context
function AppContent() {
  const { updateLanguageFromTranscript, t } = useLanguage();

  // Auth States
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  
  // UI States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarVisible, setSidebarVisible] = useState(window.innerWidth > 1024);
  const [toastMessage, setToastMessage] = useState({ show: false, message: '', type: '' });
  const [flashEmergency, setFlashEmergency] = useState(false);
  const [emergencyData, setEmergencyData] = useState(null);
  const [roadSafetyActive, setRoadSafetyActive] = useState(false);
  
  // Emergency Notifications Toggle
  const [emergencyNotificationsEnabled, setEmergencyNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('emergency_notifications_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  
  // Accessibility States
  const [currentTheme, setCurrentTheme] = useState('default');
  const [currentFontSize, setCurrentFontSize] = useState(16);

  // Logic Hooks
  const { transcript, isListening, startListening, stopListening, clearTranscript, setLang, lang, error: speechError, browserInfo } = useSpeech();
  const { volume, isLoud, soundType, soundHistory, threshold, setThreshold } = useVolume(0.15);
  const { 
    notificationQueue, markAsRead, clearNotifications, 
    relatives, addRelative, removeRelative, updateRelative,
    autoSendStatus
  } = useNotifications();

  // Guest mode data
  const [guestRelatives, setGuestRelatives] = useState([]);
  const [guestNotifications, setGuestNotifications] = useState([]);
  const [guestSoundHistory, setGuestSoundHistory] = useState([]);

  // Auto-switch UI language based on transcript
  useEffect(() => {
    if (transcript && transcript.trim().length > 0) {
      updateLanguageFromTranscript(transcript);
    }
  }, [transcript, updateLanguageFromTranscript]);

  // Save emergency toggle to localStorage
  useEffect(() => {
    localStorage.setItem('emergency_notifications_enabled', emergencyNotificationsEnabled);
  }, [emergencyNotificationsEnabled]);

  // Apply accessibility settings on load
  useEffect(() => {
    const savedTheme = localStorage.getItem('accessibility_theme');
    const savedFontSize = localStorage.getItem('accessibility_fontSize');
    const savedColorBlindMode = localStorage.getItem('accessibility_colorBlindMode');
    if (savedFontSize) {
      setCurrentFontSize(parseInt(savedFontSize));
      document.documentElement.style.setProperty('--dynamic-font-size', `${savedFontSize}px`);
    }
    if (savedTheme) setCurrentTheme(savedTheme);
    if (savedColorBlindMode && savedColorBlindMode !== 'none') {
      let filter = '';
      switch(savedColorBlindMode) {
        case 'protanopia': filter = 'url(#protanopia)'; break;
        case 'deuteranopia': filter = 'url(#deuteranopia)'; break;
        case 'tritanopia': filter = 'url(#tritanopia)'; break;
        case 'achromatopsia': filter = 'grayscale(100%)'; break;
        default: filter = 'none';
      }
      if (filter) document.body.style.filter = filter;
    }
  }, []);

  // Load guest data
  useEffect(() => {
    if (isGuest) {
      const savedRelatives = localStorage.getItem('neth_sawan_guest_relatives');
      const savedNotifications = localStorage.getItem('neth_sawan_guest_notifications');
      const savedSoundHistory = localStorage.getItem('neth_sawan_guest_sound_history');
      if (savedRelatives) setGuestRelatives(JSON.parse(savedRelatives));
      if (savedNotifications) setGuestNotifications(JSON.parse(savedNotifications));
      if (savedSoundHistory) setGuestSoundHistory(JSON.parse(savedSoundHistory));
    }
  }, [isGuest]);

  // Emergency flash for loud sounds
  useEffect(() => {
    if (isLoud && soundType && !roadSafetyActive && emergencyNotificationsEnabled) {
      setFlashEmergency(true);
      setEmergencyData({ soundType, message: `Emergency: ${soundType}`, timestamp: new Date(), volume });
      if (isGuest) {
        guestAddNotification({
          id: Date.now(),
          type: 'EMERGENCY',
          message: `Emergency: ${soundType}`,
          soundType,
          timestamp: new Date().toISOString(),
          read: false,
          volume
        });
      }
      setTimeout(() => setFlashEmergency(false), 3000);
    }
  }, [isLoud, soundType, roadSafetyActive, emergencyNotificationsEnabled]);

  // Save sound history for guest
  useEffect(() => {
    if (isGuest && soundHistory?.length > 0) {
      setGuestSoundHistory(prev => {
        const updated = [...soundHistory, ...prev].slice(0, 50);
        localStorage.setItem('neth_sawan_guest_sound_history', JSON.stringify(updated));
        return updated;
      });
    }
  }, [soundHistory, isGuest]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsGuest(false);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (message, type = 'info') => {
    setToastMessage({ show: true, message, type });
    setTimeout(() => setToastMessage({ show: false, message: '', type: '' }), 3000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast(t('loggedOut') || "Logged out", "success");
    } catch (err) {
      showToast(t('logoutFailed') || "Logout failed", "error");
    }
  };

  const handleGuestMode = () => {
    setIsGuest(true);
    setUser(null);
    showToast(t('guestModeActivated') || "Guest mode activated", "success");
  };

  const handleSignOutGuest = () => {
    setIsGuest(false);
    showToast(t('guestSignedOut') || "Signed out from guest mode", "info");
  };

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('accessibility_theme', theme);
  };

  const handleFontSizeChange = (size) => {
    setCurrentFontSize(size);
  };

  const toggleEmergencyNotifications = () => {
    const newState = !emergencyNotificationsEnabled;
    setEmergencyNotificationsEnabled(newState);
    showToast(newState ? (t('alertsOn') || 'Emergency notifications enabled') : (t('alertsOff') || 'Emergency notifications disabled'), newState ? 'success' : 'info');
  };

  // Guest handlers
  const guestAddRelative = (data) => {
    const entry = {
      id: Date.now(), name: data.name.trim(), phone: data.phone?.trim() || '', email: data.email?.trim() || '',
      relation: data.relation || '', notifyByWhatsApp: data.notifyByWhatsApp !== false, notifyBySMS: data.notifyBySMS || false,
      notifyByCall: data.notifyByCall || false, notifyByDesktop: data.notifyByDesktop !== false, autoSendWhatsApp: data.autoSendWhatsApp || false,
      createdAt: new Date().toISOString(),
    };
    setGuestRelatives(prev => {
      const updated = [...prev, entry];
      localStorage.setItem('neth_sawan_guest_relatives', JSON.stringify(updated));
      return updated;
    });
    return entry;
  };

  const guestRemoveRelative = (id) => {
    setGuestRelatives(prev => {
      const updated = prev.filter(r => r.id !== id);
      localStorage.setItem('neth_sawan_guest_relatives', JSON.stringify(updated));
      return updated;
    });
  };

  const guestUpdateRelative = (id, updates) => {
    setGuestRelatives(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      localStorage.setItem('neth_sawan_guest_relatives', JSON.stringify(updated));
      return updated;
    });
  };

  const guestAddNotification = (notification) => {
    setGuestNotifications(prev => {
      const updated = [notification, ...prev].slice(0, 50);
      localStorage.setItem('neth_sawan_guest_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const guestMarkAsRead = (id) => {
    setGuestNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const guestClearNotifications = () => {
    setGuestNotifications([]);
    localStorage.setItem('neth_sawan_guest_notifications', JSON.stringify([]));
  };

  const currentRelatives = isGuest ? guestRelatives : relatives;
  const currentNotifications = isGuest ? guestNotifications : notificationQueue;
  const currentSoundHistory = isGuest ? guestSoundHistory : soundHistory;

  // Fall detection handler
  const handleFallEmergency = async () => {
    let currentLocation = null;
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000, enableHighAccuracy: true })
      );
      currentLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch (e) { console.warn("Location error:", e.message); }

    try {
      await addDoc(collection(db, "emergency_alerts"), {
        alertType: "AUTOMATIC_FALL_DETECTION",
        status: "CRITICAL",
        timestamp: serverTimestamp(),
        userId: user ? user.uid : "GUEST_USER",
        location: currentLocation ? `${currentLocation.lat}, ${currentLocation.lng}` : "Location Unavailable"
      });
    } catch (error) { console.error("Firebase error:", error); }

    if (emergencyNotificationsEnabled) {
      setFlashEmergency(true);
      setEmergencyData({ soundType: '🛑 FALL DETECTED', message: 'An automatic fall was detected!', timestamp: new Date(), volume: 1.0 });
      showToast('🚨 AUTOMATIC FALL DETECTED!', 'error');
      if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
      setTimeout(() => setFlashEmergency(false), 8000);
    }

    if (currentRelatives && currentRelatives.length > 0) {
      const userConfirmed = window.confirm("🚨 Fall Detected! Click OK to send emergency WhatsApp alerts to your relatives.");
      if (userConfirmed) {
        currentRelatives.forEach(contact => {
          if (contact.notifyByWhatsApp && contact.phone) {
            const message = buildFallWhatsAppMessage(contact.name, currentLocation, user?.email || 'Guest User');
            let phoneNumber = contact.phone.replace(/[\s\-\(\)\.]/g, '');
            if (phoneNumber.startsWith('0')) phoneNumber = '94' + phoneNumber.slice(1);
            else if (phoneNumber.startsWith('+')) phoneNumber = phoneNumber.replace('+', '');
            else if (!phoneNumber.startsWith('94')) phoneNumber = '94' + phoneNumber;
            window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
          }
        });
      }
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Neth-Sawan Loading...</p>
        <div className="sign-language-loading">🤟</div>
      </div>
    );
  }

  // Show landing page if not logged in and not guest
  if (!user && !isGuest) {
    return <LandingPage onGuestMode={handleGuestMode} />;
  }

  // Main app
  return (
    <div className="app-wrapper" style={{ fontSize: `${currentFontSize}px` }}>
      <BackgroundVideo opacity={0.85} />
      <FallDetector onFallDetected={handleFallEmergency} />

      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="protanopia"><feColorMatrix type="matrix" values="0.567,0.433,0,0,0,0.558,0.442,0,0,0,0,0.242,0.758,0,0,0,0,0,1,0"/></filter>
          <filter id="deuteranopia"><feColorMatrix type="matrix" values="0.625,0.375,0,0,0,0.7,0.3,0,0,0,0,0.3,0.7,0,0,0,0,0,1,0"/></filter>
          <filter id="tritanopia"><feColorMatrix type="matrix" values="0.95,0.05,0,0,0,0,0.433,0.567,0,0,0,0.475,0.525,0,0,0,0,0,1,0"/></filter>
        </defs>
      </svg>

      <EmergencyFlash isVisible={flashEmergency && emergencyNotificationsEnabled} emergencyData={emergencyData} />

      <Sidebar 
        activeTab={activeTab} setActiveTab={setActiveTab} isOpen={sidebarVisible} onClose={() => setSidebarVisible(false)}
        user={user} isGuest={isGuest} onLogout={isGuest ? handleSignOutGuest : handleLogout}
      />

      <div className={`content-area ${sidebarVisible && window.innerWidth > 1024 ? 'sidebar-open' : ''}`}>
        <Header 
          isListening={isListening} lang={lang} setLang={setLang} showToast={showToast} user={user} isGuest={isGuest}
          roadSafetyActive={roadSafetyActive} setRoadSafetyActive={setRoadSafetyActive}
          emergencyNotificationsEnabled={emergencyNotificationsEnabled} onToggleEmergencyNotifications={toggleEmergencyNotifications}
        />

        <main className="main-content">
          {activeTab === 'dashboard' && (
            <>
              <div className="unified-captions-sign-card">
                <div className="card-head">
                  <div className="card-title">
                    <span className="card-title-icon icon-teal">🎤🤟</span>
                    {t('liveCaptionsSign')}
                  </div>
                  {isListening && (
                    <div className="live-badge">
                      <span className="pulse-dot"></span>
                      <span>{t('listening').toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <TranscriptBox 
                  transcript={transcript} 
                  isListening={isListening} 
                  startListening={startListening}
                  stopListening={stopListening} 
                  clearTranscript={clearTranscript} 
                  error={speechError}
                  browserInfo={browserInfo}
                />
                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                  <SignLanguageBox transcript={transcript} />
                </div>
              </div>

              {!emergencyNotificationsEnabled && (
                <div className="notifications-disabled-banner">
                  <span className="banner-icon">🔕</span>
                  <div className="banner-content">
                    <strong>{t('alertsOff')}</strong>
                    <p>{t('noEmergencyAlerts') || "You won't receive visual alerts or emergency flashes."}</p>
                  </div>
                  <button onClick={toggleEmergencyNotifications} className="banner-enable-btn">{t('enableNow') || "Enable Now"}</button>
                </div>
              )}

              <div className="dashboard-primary">
                <VisualAlert 
                  isLoud={isLoud && emergencyNotificationsEnabled} soundType={soundType} volume={volume}
                  threshold={threshold} onThresholdChange={setThreshold} soundHistory={currentSoundHistory}
                />
                <RoadSafetyMonitor 
                  isActive={roadSafetyActive}
                  onAlert={(alert) => {
                    if (emergencyNotificationsEnabled) {
                      showToast(alert.description, 'error');
                      setFlashEmergency(true);
                      setEmergencyData({ soundType: alert.name, message: alert.description, timestamp: new Date(), volume: alert.volume });
                      setTimeout(() => setFlashEmergency(false), 5000);
                      if (isGuest) {
                        guestAddNotification({ id: Date.now(), type: 'ROAD_SAFETY', message: alert.description, soundType: alert.name, timestamp: new Date().toISOString(), read: false });
                      }
                    }
                  }}
                  showToast={showToast}
                />
              </div>

              <div className="dashboard-secondary">
                <SoundVisualizer volume={volume} isLoud={isLoud} soundType={soundType} />
                <SoundHistory soundHistory={currentSoundHistory.slice(0, 5)} />
              </div>
            </>
          )}

          {activeTab === 'vision' && <Aivision showToast={showToast} />}
          {activeTab === 'learn' && <SignLanguageTutor />}
          {activeTab === 'alerts' && <NotificationCenter queue={currentNotifications} onMarkRead={isGuest ? guestMarkAsRead : markAsRead} onClear={isGuest ? guestClearNotifications : clearNotifications} />}
          {activeTab === 'contacts' && <RelativesManager relatives={currentRelatives} onAdd={isGuest ? guestAddRelative : addRelative} onRemove={isGuest ? guestRemoveRelative : removeRelative} onUpdate={isGuest ? guestUpdateRelative : updateRelative} onTest={(rel) => showToast(`Test alert ready for ${rel.name}`, 'info')} autoSendStatus={autoSendStatus} isGuest={isGuest} />}
          
          {activeTab === 'emergency' && (
            <div className="emergency-sos-card">
              <div className="sos-header">
                <h2>🆘 {t('sosCenter')}</h2>
              </div>
              <div className="sos-button-large" onClick={() => {
                if (emergencyNotificationsEnabled) {
                  setFlashEmergency(true);
                  setEmergencyData({ soundType: 'SOS', message: 'Manual SOS Triggered!', timestamp: new Date() });
                  setTimeout(() => setFlashEmergency(false), 8000);
                  showToast('🚨 SOS Activated!', 'error');
                  if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
                }
              }}>
                <span className="sos-icon">🆘</span>
                <span className="sos-text">{t('sos')}</span>
              </div>
              <div className="emergency-numbers">
                <button className="emergency-btn police" onClick={() => window.location.href = 'tel:119'}>👮 {t('police')} (119)</button>
                <button className="emergency-btn ambulance" onClick={() => window.location.href = 'tel:1990'}>🚑 {t('ambulance')} (1990)</button>
              </div>
              <div className="emergency-instructions-box" style={{ marginTop: '20px', textAlign: 'left', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <h4>⚠️ {t('emergencyInstructions')}</h4>
                <ul>
                  <li>{t('redFlashing')}</li>
                  <li>{t('vibration')}</li>
                  <li>{t('contactsNotify')}</li>
                  <li>{t('liveLocation')}</li>
                  <li>{t('notificationToggle') || "🔕 Notification Toggle = Disable alerts when needed (top of screen)"}</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'roadmonitor' && (
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>🛣️ {t('roadSafetyMonitor')}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>{t('dedicatedRoadSafety') || "Full‑screen detection of horns, sirens, engines – with direction & distance hints"}</p>
              </div>
              <RoadSafetyMonitor
                isActive={true}
                onAlert={(alert) => {
                  if (emergencyNotificationsEnabled) {
                    showToast(alert.description, 'error');
                    setFlashEmergency(true);
                    setEmergencyData({ soundType: alert.name, message: alert.description, timestamp: new Date(), volume: alert.volume });
                    setTimeout(() => setFlashEmergency(false), 5000);
                    if (isGuest) {
                      guestAddNotification({ id: Date.now(), type: 'ROAD_SAFETY', message: alert.description, soundType: alert.name, timestamp: new Date().toISOString(), read: false });
                    }
                  }
                }}
                showToast={showToast}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <AccessibilitySettings 
              onThemeChange={handleThemeChange}
              onFontSizeChange={handleFontSizeChange}
              currentTheme={currentTheme}
              currentFontSize={currentFontSize}
            />
          )}
        </main>
      </div>

      {toastMessage.show && <div className={`toast-message ${toastMessage.type}`}>{toastMessage.message}</div>}
      {!sidebarVisible && window.innerWidth <= 1024 && <button className="mobile-menu-btn" onClick={() => setSidebarVisible(true)}>☰</button>}
    </div>
  );
}

// Main App wrapper with LanguageProvider
function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;