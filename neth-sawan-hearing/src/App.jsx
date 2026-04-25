import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

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

// Hooks
import { useSpeech } from './hooks/useSpeech';
import { useVolume } from './hooks/useVolume';
import { useNotifications } from './hooks/useNotifications';

import './App.css';

function App() {
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
  
  // Accessibility States
  const [currentTheme, setCurrentTheme] = useState('default');
  const [currentFontSize, setCurrentFontSize] = useState(16);

  // Logic Hooks
  const { transcript, isListening, startListening, stopListening, clearTranscript, setLang, lang, error: speechError } = useSpeech();
  const { volume, isLoud, soundType, soundHistory, threshold, setThreshold } = useVolume(0.15);
  const { 
    notificationQueue, markAsRead, clearNotifications, 
    relatives, addRelative, removeRelative, updateRelative,
    requestPermission, autoSendStatus
  } = useNotifications();

  // Guest mode data (localStorage)
  const [guestRelatives, setGuestRelatives] = useState([]);
  const [guestNotifications, setGuestNotifications] = useState([]);
  const [guestSoundHistory, setGuestSoundHistory] = useState([]);

  // Apply accessibility settings on load
  useEffect(() => {
    const savedTheme = localStorage.getItem('accessibility_theme');
    const savedFontSize = localStorage.getItem('accessibility_fontSize');
    const savedColorBlindMode = localStorage.getItem('accessibility_colorBlindMode');
    
    if (savedFontSize) {
      setCurrentFontSize(parseInt(savedFontSize));
      document.documentElement.style.setProperty('--dynamic-font-size', `${savedFontSize}px`);
    }
    
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
    
    if (savedColorBlindMode && savedColorBlindMode !== 'none') {
      let filter = '';
      switch(savedColorBlindMode) {
        case 'protanopia':
          filter = 'url(#protanopia)';
          break;
        case 'deuteranopia':
          filter = 'url(#deuteranopia)';
          break;
        case 'tritanopia':
          filter = 'url(#tritanopia)';
          break;
        case 'achromatopsia':
          filter = 'grayscale(100%)';
          break;
      }
      if (filter) document.body.style.filter = filter;
    }
  }, []);

  // Load guest data from localStorage
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

  // Emergency flash on loud sound
  useEffect(() => {
    if (isLoud && soundType && !roadSafetyActive) {
      setFlashEmergency(true);
      setEmergencyData({ 
        soundType, 
        message: `Emergency: ${soundType}`, 
        timestamp: new Date(), 
        volume 
      });
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
  }, [isLoud, soundType, roadSafetyActive]);

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
      showToast("Logged out successfully", "success");
    } catch (err) {
      showToast("Logout failed", "error");
    }
  };

  const handleGuestMode = () => {
    setIsGuest(true);
    setUser(null);
    showToast("Guest mode activated. Features work fully!", "success");
  };

  const handleSignOutGuest = () => {
    setIsGuest(false);
    showToast("Signed out from guest mode", "info");
  };

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('accessibility_theme', theme);
  };

  const handleFontSizeChange = (size) => {
    setCurrentFontSize(size);
  };

  // Guest mode handlers
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

  // Use either logged-in data or guest data
  const currentRelatives = isGuest ? guestRelatives : relatives;
  const currentNotifications = isGuest ? guestNotifications : notificationQueue;
  const currentSoundHistory = isGuest ? guestSoundHistory : soundHistory;

  // Loading Screen
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Neth-Sawan Loading...</p>
        <div className="sign-language-loading">🤟</div>
      </div>
    );
  }

  // Not logged in and not guest - show Auth
  if (!user && !isGuest) {
    return <Auth onGuestMode={handleGuestMode} />;
  }

  // Logged in or guest - show Main App
  return (
    <div className="app-wrapper" style={{ fontSize: `${currentFontSize}px` }}>
      {/* SVG Filters for Color Blindness */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="protanopia">
            <feColorMatrix type="matrix" values="
              0.567, 0.433, 0, 0, 0,
              0.558, 0.442, 0, 0, 0,
              0, 0.242, 0.758, 0, 0,
              0, 0, 0, 1, 0
            "/>
          </filter>
          <filter id="deuteranopia">
            <feColorMatrix type="matrix" values="
              0.625, 0.375, 0, 0, 0,
              0.7, 0.3, 0, 0, 0,
              0, 0.3, 0.7, 0, 0,
              0, 0, 0, 1, 0
            "/>
          </filter>
          <filter id="tritanopia">
            <feColorMatrix type="matrix" values="
              0.95, 0.05, 0, 0, 0,
              0, 0.433, 0.567, 0, 0,
              0, 0.475, 0.525, 0, 0,
              0, 0, 0, 1, 0
            "/>
          </filter>
        </defs>
      </svg>

      {/* Emergency Flash Overlay */}
      <EmergencyFlash isVisible={flashEmergency} emergencyData={emergencyData} />

      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarVisible} 
        onClose={() => setSidebarVisible(false)}
        user={user}
        isGuest={isGuest}
        onLogout={isGuest ? handleSignOutGuest : handleLogout}
      />

      {/* Main Content Area */}
      <div className={`content-area ${sidebarVisible && window.innerWidth > 1024 ? 'sidebar-open' : ''}`}>
        <Header 
          isListening={isListening} 
          lang={lang} 
          setLang={setLang} 
          showToast={showToast}
          user={user}
          isGuest={isGuest}
          roadSafetyActive={roadSafetyActive}
          setRoadSafetyActive={setRoadSafetyActive}
        />

        <main className="main-content">
          {/* DASHBOARD - Main View with Live Transcript at TOP */}
          {activeTab === 'dashboard' && (
            <>
              {/* LIVE TRANSCRIPT - TOP SECTION (Most Important for Deaf Users) */}
              <div className="dashboard-transcript-top">
                <TranscriptBox 
                  transcript={transcript} 
                  isListening={isListening}
                  startListening={startListening}
                  stopListening={stopListening}
                  clearTranscript={clearTranscript}
                  error={speechError}
                />
              </div>

              {/* Second Row: Sound Alert + Road Safety */}
              <div className="dashboard-primary">
                <VisualAlert 
                  isLoud={isLoud} 
                  soundType={soundType} 
                  volume={volume}
                  threshold={threshold}
                  onThresholdChange={setThreshold}
                  soundHistory={currentSoundHistory}
                />
                <RoadSafetyMonitor 
                  isActive={roadSafetyActive}
                  onAlert={(alert) => {
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
                  }}
                  showToast={showToast}
                />
              </div>

              {/* Third Row: Sign Language Translation */}
              <div className="dashboard-sign-row">
                <SignLanguageBox transcript={transcript} />
              </div>

              {/* Bottom Row: Sound Visualizer + Recent History */}
              <div className="dashboard-secondary">
                <SoundVisualizer volume={volume} isLoud={isLoud} soundType={soundType} />
                <SoundHistory soundHistory={currentSoundHistory.slice(0, 5)} />
              </div>
            </>
          )}

          {/* AI VISION - Image Analysis & Media to Sign Language */}
          {activeTab === 'vision' && (
            <Aivision showToast={showToast} />
          )}

          {/* LEARN SIGNS - Sign Language Tutor */}
          {activeTab === 'learn' && (
            <SignLanguageTutor />
          )}

          {/* ALERTS - Notification Center */}
          {activeTab === 'alerts' && (
            <NotificationCenter 
              queue={currentNotifications}
              onMarkRead={isGuest ? guestMarkAsRead : markAsRead}
              onClear={isGuest ? guestClearNotifications : clearNotifications}
            />
          )}

          {/* CONTACTS - Emergency Contacts Manager */}
          {activeTab === 'contacts' && (
            <RelativesManager 
              relatives={currentRelatives}
              onAdd={isGuest ? guestAddRelative : addRelative}
              onRemove={isGuest ? guestRemoveRelative : removeRelative}
              onUpdate={isGuest ? guestUpdateRelative : updateRelative}
              onTest={(rel) => {
                const testEmergency = {
                  soundType: 'Test Alert',
                  message: 'This is a test emergency alert from Neth-Sawan',
                  timestamp: new Date()
                };
                if (isGuest) {
                  guestAddNotification({
                    id: Date.now(),
                    type: 'EMERGENCY',
                    message: testEmergency.message,
                    soundType: testEmergency.soundType,
                    timestamp: new Date().toISOString(),
                    read: false
                  });
                  showToast(`Test alert sent to ${rel.name}`, 'success');
                } else {
                  showToast(`Test alert functionality ready for ${rel.name}`, 'info');
                }
              }}
              autoSendStatus={autoSendStatus}
              isGuest={isGuest}
            />
          )}

          {/* SOS EMERGENCY - Emergency Button & Quick Dial */}
          {activeTab === 'emergency' && (
            <div className="emergency-sos-card">
              <div className="sos-header">
                <h2>🆘 SOS Emergency Center</h2>
                <p>Visual & Haptic Alerts for Deaf Users</p>
              </div>
              
              <div className="sos-button-large" onClick={() => {
                setFlashEmergency(true);
                setEmergencyData({ 
                  soundType: 'SOS', 
                  message: 'Manual SOS Triggered - Get Help Now!', 
                  timestamp: new Date() 
                });
                setTimeout(() => setFlashEmergency(false), 8000);
                showToast('🚨 SOS Activated! Screen flashing for attention', 'error');
                
                if (navigator.vibrate) {
                  navigator.vibrate([500, 200, 500, 200, 500, 200, 1000]);
                }
                
                if (isGuest) {
                  guestAddNotification({
                    id: Date.now(),
                    type: 'SOS',
                    message: 'Manual SOS Emergency Triggered',
                    soundType: 'SOS ALERT',
                    timestamp: new Date().toISOString(),
                    read: false
                  });
                }
              }}>
                <span className="sos-icon">🆘</span>
                <span className="sos-text">SOS</span>
                <span className="sos-sub">Tap for Emergency</span>
              </div>

              <div className="emergency-numbers">
                <button className="emergency-btn police" onClick={() => window.location.href = 'tel:119'}>
                  <span className="btn-icon">👮</span>
                  <div className="btn-text">
                    <span className="btn-title">Police</span>
                    <span className="btn-number">119</span>
                  </div>
                </button>
                <button className="emergency-btn ambulance" onClick={() => window.location.href = 'tel:1990'}>
                  <span className="btn-icon">🚑</span>
                  <div className="btn-text">
                    <span className="btn-title">Ambulance</span>
                    <span className="btn-number">1990</span>
                  </div>
                </button>
                <button className="emergency-btn fire" onClick={() => window.location.href = 'tel:110'}>
                  <span className="btn-icon">🔥</span>
                  <div className="btn-text">
                    <span className="btn-title">Fire Brigade</span>
                    <span className="btn-number">110</span>
                  </div>
                </button>
              </div>

              <div className="emergency-instructions">
                <h4>⚠️ Emergency Instructions</h4>
                <ul>
                  <li>🔴 <strong>Red Flashing Screen</strong> = Emergency detected or SOS activated</li>
                  <li>📳 <strong>Phone Vibration</strong> = Alert being sent to your contacts</li>
                  <li>👥 <strong>Emergency Contacts</strong> = Will receive WhatsApp/SMS alerts</li>
                  <li>📍 <strong>Live Location</strong> = Automatically shared with emergency contacts</li>
                </ul>
              </div>
            </div>
          )}

          {/* ACCESSIBILITY SETTINGS */}
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

      {/* Toast Notification */}
      {toastMessage.show && (
        <div className={`toast-message ${toastMessage.type}`}>
          {toastMessage.message}
        </div>
      )}

      {/* Mobile Menu Button */}
      {!sidebarVisible && window.innerWidth <= 1024 && (
        <button className="mobile-menu-btn" onClick={() => setSidebarVisible(true)}>
          ☰
        </button>
      )}
    </div>
  );
}

export default App;