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
import InPersonTranslator from './components/InPersonTranslator';

// Hooks
import { useSpeech } from './hooks/useSpeech';
import { useVolume } from './hooks/useVolume';
import { useNotifications } from './hooks/useNotifications';
import { useGuestNotifications } from './hooks/useGuestNotifications';
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
  const [guestName, setGuestName] = useState('');
  const [showLanding, setShowLanding] = useState(true);

  // ===== UI STATES =====
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [toastMessage, setToastMessage] = useState({ show: false, message: '', type: '' });
  const [flashEmergency, setFlashEmergency] = useState(false);
  const [emergencyData, setEmergencyData] = useState(null);
  const [emergencyMessage, setEmergencyMessage] = useState('');
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
  const {
    transcript,
    setTranscript,
    isListening,
    startListening,
    stopListening,
    clearTranscript,
    setLang,
    lang,
    error: speechError,
    browserInfo,
    retryListening,
    microphonePermission,
    recognitionStatus,
    supported
  } = useSpeech('si-LK');

  const { volume, isLoud, soundType, soundHistory, threshold, setThreshold } = useVolume(0.15);
  const {
    notificationQueue, markAsRead, clearNotifications,
    relatives, addRelative, removeRelative, updateRelative,
    autoSendStatus
  } = useNotifications();

  // ===== GUEST NOTIFICATIONS =====
  const { notifications: guestNotifications, addNotification: guestAddNotification, clearAll: guestClearAll } = useGuestNotifications();

  // ===== SINHALA TYPING STATE =====
  const [sinhalaText, setSinhalaText] = useState('');
  const [signWord, setSignWord] = useState('');

  // ===== GUEST DATA (Relatives & Sound History) =====
  const [guestRelatives, setGuestRelatives] = useState([]);
  const [guestSoundHistory, setGuestSoundHistory] = useState([]);

  // ===== UI LANGUAGE SYNC WITH RECOGNITION LANGUAGE =====
  useEffect(() => {
    if (lang === 'si-LK') {
      updateLanguageFromTranscript('සිංහල');
    } else if (lang === 'ta-LK') {
      updateLanguageFromTranscript('தமிழ்');
    } else {
      updateLanguageFromTranscript('Hello');
    }
  }, [lang, updateLanguageFromTranscript]);

  // ===== REMOVED: Auto‑detection of language from transcript =====
  // (Removed to prevent UI language changing automatically)

  // ===== REAL-TIME SIGN LANGUAGE TRANSLATION =====
  useEffect(() => {
    if (!transcript) {
      setSignWord('');
      return;
    }

    const wordsArray = transcript.trim().split(/\s+/);
    const lastWord = wordsArray[wordsArray.length - 1];
    if (!lastWord) return;

    if (/^[A-Za-z0-9]+$/.test(lastWord)) {
      setSignWord(lastWord.toLowerCase());
      return;
    }

    const fetchTranslation = async () => {
      try {
        const response = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=si&tl=en&dt=t&q=${encodeURIComponent(lastWord)}`
        );
        const data = await response.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          setSignWord(data[0][0][0].trim().toLowerCase());
        }
      } catch (error) {
        console.error("Translation failed:", error);
        setSignWord(lastWord.toLowerCase());
      }
    };

    const delayDebounce = setTimeout(fetchTranslation, 300);
    return () => clearTimeout(delayDebounce);
  }, [transcript]);

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
      const savedSoundHistory = localStorage.getItem('neth_sawan_guest_sound_history');
      if (savedRelatives) setGuestRelatives(JSON.parse(savedRelatives));
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
      setEmergencyMessage(`🚨 ${soundType} detected!`);
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
  }, [isLoud, soundType, roadSafetyActive, emergencyNotificationsEnabled, isGuest]);

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
      if (currentUser) {
        setUser(currentUser);
        setIsGuest(false);
        setShowLanding(false);
        setAuthLoading(false);
      } else {
        const storedGuest = localStorage.getItem('guestUser');
        if (storedGuest) {
          try {
            const gData = JSON.parse(storedGuest);
            setIsGuest(true);
            setGuestName(gData.name || 'Guest');
            setShowLanding(false);
          } catch {
            setShowLanding(true);
          }
        } else {
          setUser(null);
          setIsGuest(false);
          setShowLanding(true);
        }
        setAuthLoading(false);
      }
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
      localStorage.removeItem('guestUser');
      setIsGuest(false);
      setGuestName('');
      setUser(null);
      setShowLanding(true);
      showToast(t('loggedOut') || "Logged out", "success");
    } catch {
      showToast(t('logoutFailed') || "Logout failed", "error");
    }
  };

  const handleGuestMode = () => {
    const name = prompt('Enter your guest name:') || 'Guest';
    localStorage.setItem('guestUser', JSON.stringify({ name, timestamp: Date.now() }));
    setIsGuest(true);
    setGuestName(name);
    setShowLanding(false);
    showToast(t('guestModeActivated') || "Guest mode activated", "success");
  };

  const handleSignOutGuest = () => {
    localStorage.removeItem('guestUser');
    setIsGuest(false);
    setGuestName('');
    setShowLanding(true);
    showToast(t('guestSignedOut') || "Signed out from guest mode", "info");
  };

  // ===== ACCESSIBILITY HANDLERS =====
  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    document.body.className = theme === 'light' ? 'light-theme' : '';
    localStorage.setItem('accessibility_theme', theme);
  };

  const handleFontSizeChange = (size) => {
    setCurrentFontSize(size);
    document.documentElement.setAttribute('data-size', size);
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

  // ===== SINHALA TRANSCRIPT HANDLER =====
  const handleTranscriptChange = (text) => {
    setSinhalaText(text);
    if (text && text.trim()) {
      const words = text.trim().split(/\s+/);
      const lastWord = words[words.length - 1];
      if (/[\u0D80-\u0DFF]/.test(lastWord)) {
        const fetchTranslation = async () => {
          try {
            const response = await fetch(
              `https://translate.googleapis.com/translate_a/single?client=gtx&sl=si&tl=en&dt=t&q=${encodeURIComponent(lastWord)}`
            );
            const data = await response.json();
            if (data && data[0] && data[0][0] && data[0][0][0]) {
              setSignWord(data[0][0][0].trim().toLowerCase());
            }
          } catch (error) {
            console.error("Translation failed:", error);
          }
        };
        fetchTranslation();
      } else {
        setSignWord(lastWord.toLowerCase());
      }
    }
  };

  // ===== TEXT TO PASS TO SIGN LANGUAGE BOX =====
  const getSignLanguageText = () => {
    return sinhalaText || transcript;
  };

  // ===== GUEST RELATIVES HANDLERS =====
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

    // 🔥 VIBRATION: Always vibrate on fall detection (even if notifications are off)
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }

    if (emergencyNotificationsEnabled) {
      setFlashEmergency(true);
      setEmergencyData({ soundType: '🛑 FALL DETECTED', message: 'An automatic fall was detected!', timestamp: new Date(), volume: 1.0 });
      setEmergencyMessage('🚨 FALL DETECTED!');
      showToast('🚨 AUTOMATIC FALL DETECTED!', 'error');
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

  // ===== TRIGGER EMERGENCY (SOS) =====
  const triggerEmergency = async (msg) => {
    setEmergencyMessage(msg || 'SOS Button Pressed');
    setFlashEmergency(true);
    setEmergencyData({
      soundType: 'SOS',
      message: msg || 'Manual SOS Triggered!',
      timestamp: new Date(),
      volume: 1.0
    });
    showToast(`🚨 EMERGENCY: ${msg || 'SOS'}`, 'danger');

    if (user && !isGuest) {
      try {
        await addDoc(collection(db, 'emergencies'), {
          userId: user.uid,
          message: msg || 'SOS',
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.error("Error saving emergency:", e);
      }
    } else if (isGuest) {
      guestAddNotification({
        id: Date.now(),
        type: 'EMERGENCY',
        message: msg || 'SOS',
        timestamp: new Date().toISOString(),
        read: false
      });
    }

    setTimeout(() => setFlashEmergency(false), 8000);
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
  if (showLanding && !user && !isGuest) {
    return <LandingPage onGuestMode={handleGuestMode} onShowInstructions={() => setShowInstructions(true)} />;
  }

  // ===== MAIN APP =====
  const isMobile = window.innerWidth <= 1024;

  return (
    <div className={`app-wrapper ${currentTheme}`} style={{ fontSize: `${currentFontSize}px` }}>
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
        message={emergencyMessage}
        onClose={() => setFlashEmergency(false)}
      />

      {/* ===== SIDEBAR ===== */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        isGuest={isGuest}
        guestName={guestName}
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
          guestName={guestName}
          roadSafetyActive={roadSafetyActive}
          setRoadSafetyActive={setRoadSafetyActive}
          emergencyNotificationsEnabled={emergencyNotificationsEnabled}
          onToggleEmergencyNotifications={toggleEmergencyNotifications}
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          fallDetectorBlocked={fallDetectorBlocked}
          onRequestFallPermission={handleRequestFallPermission}
          onTestFall={handleFallEmergency}
          onTriggerEmergency={triggerEmergency}
        />

        {/* ===== MAIN CONTENT ===== */}
        <main className="main-content">

          {/* ===== DASHBOARD TAB ===== */}
          {activeTab === 'dashboard' && (
            <>
              <div className="dashboard-grid">
                <div className="dashboard-left">
                  <div className="captions-box">
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
                      retryListening={retryListening}
                      microphonePermission={microphonePermission}
                      recognitionStatus={recognitionStatus}
                      supported={supported}
                      onTranscriptChange={handleTranscriptChange}
                    />
                  </div>
                </div>

                <div className="dashboard-right">
                  <div className="sign-box">
                    <SignLanguageBox transcript={getSignLanguageText()} />
                  </div>

                  <VisualAlert
                    isLoud={isLoud && emergencyNotificationsEnabled}
                    soundType={soundType}
                    volume={volume}
                    threshold={threshold}
                    onThresholdChange={setThreshold}
                    soundHistory={currentSoundHistory}
                  />
                </div>
              </div>

              <div className="dashboard-primary">
                <div className="sound-card">
                  <h3 className="card-title-simple">
                    <span>🔊</span> Sound Monitor
                  </h3>
                  <SoundVisualizer volume={volume} isLoud={isLoud} soundType={soundType} />
                </div>

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
                      setEmergencyMessage(`🚗 ${alert.name}`);
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
                <SoundHistory soundHistory={currentSoundHistory.slice(0, 5)} />
              </div>
            </>
          )}

          {/* ===== AI VISION ===== */}
          {activeTab === 'vision' && <Aivision showToast={showToast} />}

          {/* ===== SIGN LANGUAGE TUTOR ===== */}
          {activeTab === 'learn' && <SignLanguageTutor />}

          {/* ===== IN-PERSON TRANSLATOR ===== */}
          {activeTab === 'inperson' && (
            <InPersonTranslator onClose={() => setActiveTab('dashboard')} />
          )}

          {/* ===== COMMUNITY ===== */}
          {activeTab === 'community' && <OnlineUsers user={user} isGuest={isGuest} guestName={guestName} />}

          {/* ===== NOTIFICATIONS ===== */}
          {activeTab === 'alerts' && (
            <NotificationCenter
              queue={currentNotifications}
              onMarkRead={isGuest ? (id) => {
                const updated = guestNotifications.map(n => n.id === id ? { ...n, read: true } : n);
                localStorage.setItem('neth_sawan_guest_notifications', JSON.stringify(updated));
              } : markAsRead}
              onClear={isGuest ? () => {
                localStorage.setItem('neth_sawan_guest_notifications', JSON.stringify([]));
                guestClearAll();
              } : clearNotifications}
            />
          )}

          {/* ===== EMERGENCY CONTACTS ===== */}
          {activeTab === 'contacts' && (
            <RelativesManager
              user={user}
              isGuest={isGuest}
              showToast={showToast}
              relatives={currentRelatives}
              onAdd={isGuest ? guestAddRelative : addRelative}
              onRemove={isGuest ? guestRemoveRelative : removeRelative}
              onUpdate={isGuest ? guestUpdateRelative : updateRelative}
              onTest={(rel) => showToast(`Test alert ready for ${rel.name}`, 'info')}
              autoSendStatus={autoSendStatus}
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
                onClick={() => triggerEmergency('SOS Button Pressed')}
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
                    setEmergencyMessage(`🚗 ${alert.name}`);
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