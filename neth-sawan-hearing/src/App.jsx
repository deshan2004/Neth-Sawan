// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
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
import SignLanguageTutor from './components/SignLanguageTutor';
import EmergencyFlash from './components/EmergencyFlash';
import AccessibilitySettings from './components/AccessibilitySettings';
import RoadSafetyMonitor from './components/RoadSafetyMonitor';
import FallDetector from "./components/FallDetector";
import BackgroundVideo from './components/BackgroundVideo';
import LandingPage from './components/LandingPage';
import OnlineUsers from './components/OnlineUsers';
import InstructionsPage from './components/InstructionsPage';

// Hooks
import { useSpeech } from './hooks/useSpeech';
import { useVolume } from './hooks/useVolume';
import { useNotifications } from './hooks/useNotifications';
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

// ===== INNER COMPONENT =====
function AppContent() {
  const { updateLanguageFromTranscript, t } = useLanguage();

  // ===== AUTH STATES =====
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // ===== UI STATES =====
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [toastMessage, setToastMessage] = useState({ show: false, message: '', type: '' });
  const [flashEmergency, setFlashEmergency] = useState(false);
  const [emergencyData, setEmergencyData] = useState(null);
  const [roadSafetyActive, setRoadSafetyActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // ===== ACCESSIBILITY STATES =====
  const [currentTheme, setCurrentTheme] = useState('default');
  const [currentFontSize, setCurrentFontSize] = useState(16);

  // ===== EMERGENCY NOTIFICATIONS TOGGLE =====
  const [emergencyNotificationsEnabled, setEmergencyNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('emergency_notifications_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // ===== FALL DETECTOR REF & STATE =====
  const fallDetectorRef = useRef(null);
  const [fallDetectorBlocked, setFallDetectorBlocked] = useState(false);

  // ===== HOOKS =====
  const { transcript, isListening, startListening, stopListening, clearTranscript, setLang, lang, error: speechError, browserInfo } = useSpeech();
  const { volume, isLoud, soundType, soundHistory, threshold, setThreshold } = useVolume(0.15);
  const {
    notificationQueue, markAsRead, clearNotifications,
    relatives, addRelative, removeRelative, updateRelative,
    autoSendStatus
  } = useNotifications();

  // ===== GUEST DATA =====
  const [guestRelatives, setGuestRelatives] = useState([]);
  const [guestNotifications, setGuestNotifications] = useState([]);
  const [guestSoundHistory, setGuestSoundHistory] = useState([]);

  // ===== AUTO LANGUAGE SWITCH =====
  useEffect(() => {
    if (transcript && transcript.trim().length > 0) {
      updateLanguageFromTranscript(transcript);
    }
  }, [transcript, updateLanguageFromTranscript]);

  // ===== SAVE EMERGENCY TOGGLE =====
  useEffect(() => {
    localStorage.setItem('emergency_notifications_enabled', emergencyNotificationsEnabled);
  }, [emergencyNotificationsEnabled]);

  // ===== APPLY SAVED ACCESSIBILITY SETTINGS =====
  useEffect(() => {
    const savedFontSize = localStorage.getItem('accessibility_fontSize');
    if (savedFontSize) {
      setCurrentFontSize(parseInt(savedFontSize));
      document.documentElement.style.setProperty('--dynamic-font-size', `${savedFontSize}px`);
    }
    const savedTheme = localStorage.getItem('accessibility_theme');
    if (savedTheme) setCurrentTheme(savedTheme);
  }, []);

  // ===== LOAD GUEST DATA =====
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

  // ===== FALL DETECTOR STATUS CHECK =====
  useEffect(() => {
    const checkStatus = () => {
      if (fallDetectorRef.current) {
        const blocked = fallDetectorRef.current.isBlocked?.() || false;
        setFallDetectorBlocked(blocked);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // ===== LOUD SOUND EMERGENCY FLASH =====
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

  // ===== SAVE SOUND HISTORY FOR GUEST =====
  useEffect(() => {
    if (isGuest && soundHistory?.length > 0) {
      setGuestSoundHistory(prev => {
        const updated = [...soundHistory, ...prev].slice(0, 50);
        localStorage.setItem('neth_sawan_guest_sound_history', JSON.stringify(updated));
        return updated;
      });
    }
  }, [soundHistory, isGuest]);

  // ===== AUTH LISTENER =====
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsGuest(false);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ===== TOAST HELPER =====
  const showToast = (message, type = 'info') => {
    setToastMessage({ show: true, message, type });
    setTimeout(() => setToastMessage({ show: false, message: '', type: '' }), 3000);
  };

  // ===== TOGGLE SIDEBAR =====
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // ===== AUTH HANDLERS =====
  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast(t('loggedOut') || "Logged out", "success");
    } catch {
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

  // ===== ACCESSIBILITY HANDLERS =====
  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('accessibility_theme', theme);
  };

  const handleFontSizeChange = (size) => {
    setCurrentFontSize(size);
    localStorage.setItem('accessibility_fontSize', size);
  };

  // ===== EMERGENCY TOGGLE =====
  const toggleEmergencyNotifications = () => {
    const newState = !emergencyNotificationsEnabled;
    setEmergencyNotificationsEnabled(newState);
    showToast(newState ? (t('alertsOn') || 'Emergency notifications enabled') : (t('alertsOff') || 'Emergency notifications disabled'), newState ? 'success' : 'info');
  };

  // ===== FALL PERMISSION REQUEST =====
  const handleRequestFallPermission = async () => {
    if (fallDetectorRef.current) {
      const granted = await fallDetectorRef.current.requestPermission();
      if (granted) {
        showToast('✅ Fall detection enabled!', 'success');
        setFallDetectorBlocked(false);
      } else {
        showToast('❌ Permission denied. Please allow motion sensors in settings.', 'error');
      }
    }
  };

  // ===== GUEST HANDLERS =====
  const guestAddRelative = (data) => {
    const entry = {
      id: Date.now(),
      name: data.name.trim(),
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      relation: data.relation || '',
      notifyByWhatsApp: data.notifyByWhatsApp !== false,
      notifyBySMS: data.notifyBySMS || false,
      notifyByCall: data.notifyByCall || false,
      notifyByDesktop: data.notifyByDesktop !== false,
      autoSendWhatsApp: data.autoSendWhatsApp || false,
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

  // ===== FALL DETECTION HANDLER =====
  const handleFallEmergency = async () => {
    console.log("🚨 Fall emergency triggered!");
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

  // ===== LOADING SCREEN =====
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Neth-Sawan Loading...</p>
        <div style={{ fontSize: '48px', marginTop: '16px' }}>🤟</div>
      </div>
    );
  }

  // ===== INSTRUCTIONS PAGE =====
  if (showInstructions) {
    return <InstructionsPage onClose={() => setShowInstructions(false)} />;
  }

  // ===== LANDING PAGE =====
  if (!user && !isGuest) {
    return <LandingPage onGuestMode={handleGuestMode} onShowInstructions={() => setShowInstructions(true)} />;
  }

  // ===== MAIN APP =====
  const isMobile = window.innerWidth <= 1024;

  return (
    <div className="app-wrapper" style={{ fontSize: `${currentFontSize}px` }}>
      <BackgroundVideo opacity={0.85} />

      {/* ===== FALL DETECTOR ===== */}
      <FallDetector
        ref={fallDetectorRef}
        user={user}
        isGuest={isGuest}
        showToast={showToast}
        onFallDetected={handleFallEmergency}
      />

      {/* ===== SVG FILTERS FOR COLOR BLINDNESS ===== */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="protanopia"><feColorMatrix type="matrix" values="0.567,0.433,0,0,0,0.558,0.442,0,0,0,0,0.242,0.758,0,0,0,0,0,1,0"/></filter>
          <filter id="deuteranopia"><feColorMatrix type="matrix" values="0.625,0.375,0,0,0,0.7,0.3,0,0,0,0,0.3,0.7,0,0,0,0,0,1,0"/></filter>
          <filter id="tritanopia"><feColorMatrix type="matrix" values="0.95,0.05,0,0,0,0,0.433,0.567,0,0,0,0.475,0.525,0,0,0,0,0,1,0"/></filter>
        </defs>
      </svg>

      {/* ===== EMERGENCY FLASH ===== */}
      <EmergencyFlash
        isVisible={flashEmergency && emergencyNotificationsEnabled}
        emergencyData={emergencyData}
      />

      {/* ===== SIDEBAR ===== */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        isGuest={isGuest}
        onLogout={isGuest ? handleSignOutGuest : handleLogout}
        onShowInstructions={() => setShowInstructions(true)}
      />

      {/* ===== SIDEBAR BACKDROP (mobile only) ===== */}
      <div
        className={`sidebar-backdrop ${sidebarOpen && isMobile ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ===== CONTENT AREA ===== */}
      <div className={`content-area ${sidebarOpen ? 'sidebar-open' : ''}`}>

        {/* ===== HEADER ===== */}
        <Header
          isListening={isListening}
          lang={lang}
          setLang={setLang}
          showToast={showToast}
          user={user}
          isGuest={isGuest}
          roadSafetyActive={roadSafetyActive}
          setRoadSafetyActive={setRoadSafetyActive}
          emergencyNotificationsEnabled={emergencyNotificationsEnabled}
          onToggleEmergencyNotifications={toggleEmergencyNotifications}
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          fallDetectorBlocked={fallDetectorBlocked}
          onRequestFallPermission={handleRequestFallPermission}
        />

        {/* ===== MAIN CONTENT ===== */}
        <main className="main-content">

          {/* ===== DASHBOARD TAB ===== */}
          {activeTab === 'dashboard' && (
            <>
              <div className="captions-sign-row">
                <div className="captions-box">
                  <div className="section-header">
                    <span className="section-icon">🎤</span>
                    <h3>Live Captions</h3>
                    {isListening && <span className="live-badge-small">LIVE</span>}
                  </div>
                  <div className="captions-content">
                    <TranscriptBox
                      transcript={transcript}
                      isListening={isListening}
                      startListening={startListening}
                      stopListening={stopListening}
                      clearTranscript={clearTranscript}
                      error={speechError}
                      browserInfo={browserInfo}
                      setLang={setLang}
                      currentLang={lang}
                    />
                  </div>
                </div>
                <div className="sign-box">
                  <div className="section-header">
                    <span className="section-icon">🤟</span>
                    <h3>Sign Language Translator</h3>
                    <span className="sign-badge-small">Live from captions</span>
                  </div>
                  <div className="sign-content">
                    <SignLanguageBox transcript={transcript} />
                  </div>
                </div>
              </div>

              <div className="dashboard-primary">
                <VisualAlert
                  isLoud={isLoud && emergencyNotificationsEnabled}
                  soundType={soundType}
                  volume={volume}
                  threshold={threshold}
                  onThresholdChange={setThreshold}
                  soundHistory={currentSoundHistory}
                />
                <RoadSafetyMonitor
                  isActive={roadSafetyActive}
                  onAlert={(alert) => {
                    if (emergencyNotificationsEnabled) {
                      showToast(alert.description, 'error');
                      setFlashEmergency(true);
                      setEmergencyData({
                        soundType: alert.name,
                        message: alert.description,
                        timestamp: new Date(),
                        volume: alert.volume
                      });
                      setTimeout(() => setFlashEmergency(false), 5000);
                      if (isGuest) {
                        guestAddNotification({
                          id: Date.now(),
                          type: 'ROAD_SAFETY',
                          message: alert.description,
                          soundType: alert.name,
                          timestamp: new Date().toISOString(),
                          read: false
                        });
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

              {/* ===== 🔥 TEST FALL BUTTON ===== */}
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  onClick={() => {
                    if (fallDetectorRef.current) {
                      handleFallEmergency();
                      showToast('🧪 Test fall triggered!', 'warning');
                    }
                  }}
                  style={{
                    background: '#FF8800',
                    color: 'white',
                    border: 'none',
                    padding: '14px 28px',
                    borderRadius: '40px',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(255, 136, 0, 0.3)',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  🧪 Test Fall (Simulate)
                </button>
                <p style={{ fontSize: '0.75rem', color: '#8899CC', marginTop: '8px' }}>
                  Triggers emergency alert without shaking your device
                </p>
              </div>
            </>
          )}

          {/* ===== AI VISION ===== */}
          {activeTab === 'vision' && <Aivision showToast={showToast} />}

          {/* ===== SIGN LANGUAGE TUTOR ===== */}
          {activeTab === 'learn' && <SignLanguageTutor />}

          {/* ===== COMMUNITY ===== */}
          {activeTab === 'community' && <OnlineUsers />}

          {/* ===== NOTIFICATIONS ===== */}
          {activeTab === 'alerts' && (
            <NotificationCenter
              queue={currentNotifications}
              onMarkRead={isGuest ? guestMarkAsRead : markAsRead}
              onClear={isGuest ? guestClearNotifications : clearNotifications}
            />
          )}

          {/* ===== EMERGENCY CONTACTS ===== */}
          {activeTab === 'contacts' && (
            <RelativesManager
              relatives={currentRelatives}
              onAdd={isGuest ? guestAddRelative : addRelative}
              onRemove={isGuest ? guestRemoveRelative : removeRelative}
              onUpdate={isGuest ? guestUpdateRelative : updateRelative}
              onTest={(rel) => showToast(`Test alert ready for ${rel.name}`, 'info')}
              autoSendStatus={autoSendStatus}
              isGuest={isGuest}
            />
          )}

          {/* ===== SOS EMERGENCY ===== */}
          {activeTab === 'emergency' && (
            <div className="emergency-sos-card card">
              <div className="sos-header card-head">
                <h2>🆘 {t('sosCenter') || 'SOS Emergency Center'}</h2>
              </div>
              <div
                className="sos-button-large"
                style={{
                  padding: '48px',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #FF0033, #CC0022)',
                  borderRadius: '24px',
                  cursor: 'pointer',
                  marginBottom: '20px',
                  transition: 'transform 0.2s'
                }}
                onClick={() => {
                  if (emergencyNotificationsEnabled) {
                    setFlashEmergency(true);
                    setEmergencyData({
                      soundType: 'SOS',
                      message: 'Manual SOS Triggered!',
                      timestamp: new Date()
                    });
                    setTimeout(() => setFlashEmergency(false), 8000);
                    showToast('🚨 SOS Activated!', 'error');
                    if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
                  }
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span style={{ fontSize: '80px', display: 'block' }}>🆘</span>
                <span style={{ fontSize: '32px', fontWeight: 800, color: 'white' }}>{t('sos') || 'SOS'}</span>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', display: 'block', marginTop: '8px' }}>
                  Tap to send emergency alert
                </span>
              </div>
              <div className="emergency-numbers" style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <button className="emergency-btn police" style={{ flex: 1, padding: '16px', borderRadius: '16px', background: '#1A1E3A', border: '1px solid #4488FF', color: '#4488FF', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }} onClick={() => window.location.href = 'tel:119'}>
                  👮 {t('police') || 'Police'} (119)
                </button>
                <button className="emergency-btn ambulance" style={{ flex: 1, padding: '16px', borderRadius: '16px', background: '#1A1E3A', border: '1px solid #FF3355', color: '#FF3355', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }} onClick={() => window.location.href = 'tel:1990'}>
                  🚑 {t('ambulance') || 'Ambulance'} (1990)
                </button>
              </div>
              <div className="emergency-instructions-box" style={{ padding: '20px', background: 'rgba(255,0,51,0.05)', borderRadius: '16px', borderLeft: '4px solid #FF0033' }}>
                <h4 style={{ color: '#FF0033', marginBottom: '12px' }}>⚠️ {t('emergencyInstructions') || 'Emergency Instructions'}</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>🔴 {t('redFlashing') || 'Red Flashing Screen = Emergency detected or SOS activated'}</li>
                  <li style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>📳 {t('vibration') || 'Phone Vibration = Alert being sent to your contacts'}</li>
                  <li style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>📱 {t('contactsNotify') || 'Emergency Contacts = Will receive WhatsApp/SMS alerts'}</li>
                  <li style={{ padding: '8px 0' }}>📍 {t('liveLocation') || 'Live Location = Automatically shared with emergency contacts'}</li>
                </ul>
              </div>
            </div>
          )}

          {/* ===== ROAD MONITOR ===== */}
          {activeTab === 'roadmonitor' && (
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>🛣️ {t('roadSafetyMonitor') || 'Road Safety Monitor'}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {t('dedicatedRoadSafety') || "Full‑screen detection of horns, sirens, engines – with direction & distance hints"}
                </p>
              </div>
              <RoadSafetyMonitor
                isActive={true}
                onAlert={(alert) => {
                  if (emergencyNotificationsEnabled) {
                    showToast(alert.description, 'error');
                    setFlashEmergency(true);
                    setEmergencyData({
                      soundType: alert.name,
                      message: alert.description,
                      timestamp: new Date(),
                      volume: alert.volume
                    });
                    setTimeout(() => setFlashEmergency(false), 5000);
                    if (isGuest) {
                      guestAddNotification({
                        id: Date.now(),
                        type: 'ROAD_SAFETY',
                        message: alert.description,
                        soundType: alert.name,
                        timestamp: new Date().toISOString(),
                        read: false
                      });
                    }
                  }
                }}
                showToast={showToast}
              />
            </div>
          )}

          {/* ===== ACCESSIBILITY SETTINGS ===== */}
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

      {/* ===== TOAST ===== */}
      {toastMessage.show && <div className={`toast-message ${toastMessage.type}`}>{toastMessage.message}</div>}
    </div>
  );
}

// ===== MAIN APP WRAPPER =====
function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;