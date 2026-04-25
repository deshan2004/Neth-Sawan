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

// Hooks
import { useSpeech } from './hooks/useSpeech';
import { useVolume } from './hooks/useVolume';
import { useNotifications } from './hooks/useNotifications';

import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarVisible, setSidebarVisible] = useState(window.innerWidth > 1024);
  const [toastMessage, setToastMessage] = useState({ show: false, message: '', type: '' });
  const [flashEmergency, setFlashEmergency] = useState(false);
  const [emergencyData, setEmergencyData] = useState(null);
  
  // Accessibility States
  const [currentTheme, setCurrentTheme] = useState('default');
  const [currentFontSize, setCurrentFontSize] = useState(16);

  const { transcript, isListening, startListening, stopListening, clearTranscript, setLang, lang, error: speechError } = useSpeech();
  const { volume, isLoud, soundType, soundHistory, threshold, setThreshold } = useVolume(0.15);
  const { 
    notificationQueue, markAsRead, clearNotifications, 
    relatives, addRelative, removeRelative, updateRelative,
    requestPermission, autoSendStatus
  } = useNotifications();

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

  useEffect(() => {
    if (isLoud && soundType) {
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
  }, [isLoud, soundType]);

  useEffect(() => {
    if (isGuest && soundHistory?.length > 0) {
      setGuestSoundHistory(prev => {
        const updated = [...soundHistory, ...prev].slice(0, 30);
        localStorage.setItem('neth_sawan_guest_sound_history', JSON.stringify(updated));
        return updated;
      });
    }
  }, [soundHistory, isGuest]);

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
      showToast("Logged out", "success");
    } catch (err) {
      showToast("Logout failed", "error");
    }
  };

  const handleGuestMode = () => {
    setIsGuest(true);
    setUser(null);
    showToast("Guest mode activated", "success");
  };

  const handleSignOutGuest = () => {
    setIsGuest(false);
    showToast("Signed out", "info");
  };

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('accessibility_theme', theme);
  };

  const handleFontSizeChange = (size) => {
    setCurrentFontSize(size);
  };

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
      const updated = [notification, ...prev].slice(0, 30);
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

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Neth-Sawan</p>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <Auth onGuestMode={handleGuestMode} />;
  }

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

      <EmergencyFlash isVisible={flashEmergency} emergencyData={emergencyData} />

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarVisible} 
        onClose={() => setSidebarVisible(false)}
        user={user}
        isGuest={isGuest}
        onLogout={isGuest ? handleSignOutGuest : handleLogout}
      />

      <div className={`content-area ${sidebarVisible && window.innerWidth > 1024 ? 'sidebar-open' : ''}`}>
        <Header 
          isListening={isListening} 
          lang={lang} 
          setLang={setLang} 
          showToast={showToast}
          user={user}
          isGuest={isGuest}
        />

        <main className="main-content">
          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              <div className="dashboard-primary">
                <VisualAlert 
                  isLoud={isLoud} 
                  soundType={soundType} 
                  volume={volume}
                  threshold={threshold}
                  onThresholdChange={setThreshold}
                />
                <SignLanguageBox transcript={transcript} />
              </div>

              <div className="dashboard-transcript">
                <TranscriptBox 
                  transcript={transcript} 
                  isListening={isListening}
                  startListening={startListening}
                  stopListening={stopListening}
                  clearTranscript={clearTranscript}
                  error={speechError}
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
          {activeTab === 'contacts' && (
            <RelativesManager 
              relatives={currentRelatives}
              onAdd={isGuest ? guestAddRelative : addRelative}
              onRemove={isGuest ? guestRemoveRelative : removeRelative}
              onUpdate={isGuest ? guestUpdateRelative : updateRelative}
              autoSendStatus={autoSendStatus}
              isGuest={isGuest}
            />
          )}
          {activeTab === 'alerts' && (
            <NotificationCenter 
              queue={currentNotifications}
              onMarkRead={isGuest ? guestMarkAsRead : markAsRead}
              onClear={isGuest ? guestClearNotifications : clearNotifications}
            />
          )}
          {activeTab === 'emergency' && (
            <div className="emergency-sos-card">
              <div className="sos-button-large" onClick={() => {
                setFlashEmergency(true);
                setEmergencyData({ soundType: 'SOS', message: 'Manual SOS Triggered', timestamp: new Date() });
                setTimeout(() => setFlashEmergency(false), 5000);
                showToast('SOS Activated! Screen flashing', 'error');
              }}>
                <span className="sos-icon">🆘</span>
                <span className="sos-text">SOS</span>
                <span className="sos-sub">Emergency Alert</span>
              </div>
              <div className="emergency-numbers">
                <button onClick={() => window.location.href = 'tel:119'}>👮 Police 119</button>
                <button onClick={() => window.location.href = 'tel:1990'}>🚑 Ambulance 1990</button>
                <button onClick={() => window.location.href = 'tel:110'}>🔥 Fire 110</button>
              </div>
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

      {toastMessage.show && (
        <div className={`toast-message ${toastMessage.type}`}>
          {toastMessage.message}
        </div>
      )}

      {!sidebarVisible && window.innerWidth <= 1024 && (
        <button className="mobile-menu-btn" onClick={() => setSidebarVisible(true)}>☰</button>
      )}
    </div>
  );
}

export default App;