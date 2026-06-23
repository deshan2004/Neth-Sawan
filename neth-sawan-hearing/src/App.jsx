// src/App.jsx – Full Updated Code with Admin Integration
import React, { useState, useEffect, useRef } from 'react';
import { auth, db, addDoc, collection, serverTimestamp } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TranscriptBox from './components/TranscriptBox';
import VisualAlert from './components/VisualAlert';
import SignLanguageBox from './components/SignLanguageBox';
import SoundHistory from './components/SoundHistory';
import SoundVisualizer from './components/SoundVisualizer';
import RelativesManager from './components/RelativesManager';
import NotificationCenter from './components/NotificationCenter';
import Aivision from './components/Aivision';
import SignLanguageTutor from './components/SignLanguageTutor';
import VideoTutorial from './components/VideoTutorial';
import EmergencyFlash from './components/EmergencyFlash';
import AccessibilitySettings from './components/AccessibilitySettings';
import RoadSafetyMonitor from './components/RoadSafetyMonitor';
import FallDetector from "./components/FallDetector";
import BackgroundVideo from './components/BackgroundVideo';
import LandingPage from './components/LandingPage';
import OnlineUsers from './components/OnlineUsers';
import InstructionsPage from './components/InstructionsPage';
import InPersonTranslator from './components/InPersonTranslator';

// Admin Dashboard
import AdminDashboard from './admin/AdminDashboard';

// Hooks
import { useSpeech } from './hooks/useSpeech';
import { useVolume } from './hooks/useVolume';
import { useNotifications } from './hooks/useNotifications';
import { useGuestNotifications } from './hooks/useGuestNotifications';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

import './App.css';

// ---- Helper functions ----
const buildWhatsAppMessage = (contactName, location, userEmail, alertType) => {
  const time = new Date().toLocaleString('en-LK', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  let msg = `🚨 *EMERGENCY ALERT - Neth-Sawan* 🚨\n\n`;
  msg += `Dear ${contactName},\n\n`;
  msg += `⚠️ *This is an automated emergency alert from your loved one's device.*\n\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📢 *ALERT TYPE:* 🆘 ${alertType || 'SOS EMERGENCY'}\n`;
  msg += `🕒 *TIME:* ${time}\n`;
  msg += `👤 *USER:* ${userEmail || 'Neth-Sawan User'}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  if (location) {
    msg += `📍 *LIVE LOCATION:*\n`;
    msg += `https://maps.google.com/?q=${location.lat},${location.lng}\n\n`;
  } else {
    msg += `📍 *LOCATION:* Location services unavailable. Please call immediately.\n\n`;
  }
  msg += `📝 *MESSAGE:* ${alertType || 'SOS'} button was pressed. Immediate assistance may be required.\n\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `⚠️ *PLEASE RESPOND PROMPTLY* ⚠️\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  msg += `_This is an automated message from Neth-Sawan Hearing Assistant._\n`;
  msg += `_For more info, visit neth-sawan.app_`;
  return msg;
};

const buildSmsMessage = (contactName, location, userEmail, alertType) => {
  const time = new Date().toLocaleString('en-LK', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  let msg = `🚨 EMERGENCY ALERT - Neth-Sawan\n`;
  msg += `To: ${contactName}\n`;
  msg += `Type: ${alertType || 'SOS'}\n`;
  msg += `Time: ${time}\n`;
  msg += `User: ${userEmail || 'Neth-Sawan User'}\n`;
  if (location) {
    msg += `Location: https://maps.google.com/?q=${location.lat},${location.lng}\n`;
  } else {
    msg += `Location: Not available - please call immediately.\n`;
  }
  msg += `Message: ${alertType || 'SOS'} pressed. Immediate assistance required.`;
  return msg;
};

// ================================================================
// APP CONTENT
// ================================================================
function AppContent() {
  const { language, setLanguage, updateLanguageFromTranscript, t } = useLanguage();

  // ---- Authentication ----
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [showLanding, setShowLanding] = useState(true);

  // ---- Admin State ----
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRoleLoaded, setUserRoleLoaded] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // ---- UI State ----
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [flashEmergency, setFlashEmergency] = useState(false);
  const [emergencyData, setEmergencyData] = useState(null);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [roadSafetyActive, setRoadSafetyActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // ---- Accessibility ----
  const [currentTheme, setCurrentTheme] = useState('default');
  const [currentFontSize, setCurrentFontSize] = useState(16);
  const [emergencyNotificationsEnabled, setEmergencyNotificationsEnabled] = useState(true);

  // ---- Fall Detector ----
  const fallDetectorRef = useRef(null);
  const [fallDetectorBlocked, setFallDetectorBlocked] = useState(false);

  // ---- Custom Hooks ----
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

  const {
    volume,
    isLoud,
    soundType,
    soundHistory,
    setSoundHistory,
    threshold,
    setThreshold
  } = useVolume(0.15);

  const {
    notificationQueue,
    markAsRead,
    clearNotifications,
    relatives,
    addRelative,
    removeRelative,
    updateRelative,
    autoSendStatus
  } = useNotifications();

  const {
    notifications: guestNotifications,
    addNotification: guestAddNotification,
    clearAll: guestClearAll
  } = useGuestNotifications();

  const [guestRelatives, setGuestRelatives] = useState([]);
  const [guestSoundHistory, setGuestSoundHistory] = useState([]);
  const [sinhalaText, setSinhalaText] = useState('');
  const [signWord, setSignWord] = useState('');

  // ===== Save notification to Firestore =====
  const addNotificationToFirestore = async (notification) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      guestAddNotification(notification);
      return;
    }
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'notifications'), {
        type: notification.type || 'GENERAL',
        title: notification.message || 'Alert',
        message: notification.message,
        soundType: notification.soundType || null,
        read: false,
        timestamp: serverTimestamp(),
        location: notification.location || null
      });
      console.log('✅ Notification saved to Firestore');
    } catch (err) {
      console.error('Failed to save notification to Firestore:', err);
      guestAddNotification(notification);
    }
  };

  // ============================================================
  // 🔥 SCROLL TO TOP & SET LANGUAGE TO ENGLISH ON LOAD
  // ============================================================
  useEffect(() => {
    // Scroll to top of page
    window.scrollTo(0, 0);
    // Set language to English (if not already)
    if (language !== 'en') {
      setLanguage('en');
    }
    // Also ensure the speech recognition language matches
    if (lang !== 'en-US') {
      setLang('en-US');
    }
  }, []); // Empty array = runs once on mount

  // ============================================================
  // AUTHENTICATION & ROLE FETCH
  // ============================================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsGuest(false);
        setShowLanding(false);
        // Fetch role
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const admin = data.role === 'admin' || currentUser.email === 'admin@neth-sawan.com';
            setIsAdmin(admin);
          } else {
            setIsAdmin(false);
          }
        } catch (err) {
          console.error('Role fetch error:', err);
          setIsAdmin(false);
        }
        setUserRoleLoaded(true);
      } else {
        // Guest or no user
        const storedGuest = localStorage.getItem('guestUser');
        if (storedGuest) {
          try {
            const gData = JSON.parse(storedGuest);
            setIsGuest(true);
            setGuestName(gData.name || 'Guest');
            setShowLanding(false);
            setIsAdmin(false);
          } catch {
            setShowLanding(true);
          }
        } else {
          setUser(null);
          setIsGuest(false);
          setShowLanding(true);
          setIsAdmin(false);
        }
        setUserRoleLoaded(true);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ============================================================
  // PREFERENCES
  // ============================================================
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        const savedTheme = localStorage.getItem('accessibility_theme');
        const savedFontSize = localStorage.getItem('accessibility_fontSize');
        const savedToggle = localStorage.getItem('emergency_notifications_enabled');
        if (savedTheme) setCurrentTheme(savedTheme);
        if (savedFontSize) setCurrentFontSize(parseInt(savedFontSize));
        if (savedToggle !== null) setEmergencyNotificationsEnabled(savedToggle === 'true');
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.preferences) {
            const prefs = data.preferences;
            if (prefs.theme) setCurrentTheme(prefs.theme);
            if (prefs.fontSize) setCurrentFontSize(prefs.fontSize);
            if (prefs.emergencyNotificationsEnabled !== undefined) {
              setEmergencyNotificationsEnabled(prefs.emergencyNotificationsEnabled);
            }
            document.body.className = prefs.theme === 'light' ? 'light-theme' : '';
            document.documentElement.style.setProperty('--dynamic-font-size', `${prefs.fontSize || 16}px`);
            localStorage.setItem('emergency_notifications_enabled', String(prefs.emergencyNotificationsEnabled !== undefined ? prefs.emergencyNotificationsEnabled : true));
          }
        }
      } catch (err) {
        console.error('Failed to load preferences from Firestore:', err);
      }
    };
    if (!authLoading) {
      loadPreferences();
    }
  }, [user, authLoading]);

  const savePreferences = async (updates) => {
    if (!user) {
      if (updates.theme) localStorage.setItem('accessibility_theme', updates.theme);
      if (updates.fontSize) localStorage.setItem('accessibility_fontSize', String(updates.fontSize));
      if (updates.emergencyNotificationsEnabled !== undefined) {
        localStorage.setItem('emergency_notifications_enabled', String(updates.emergencyNotificationsEnabled));
      }
      return;
    }
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        preferences: {
          theme: updates.theme || currentTheme,
          fontSize: updates.fontSize || currentFontSize,
          emergencyNotificationsEnabled: updates.emergencyNotificationsEnabled !== undefined
            ? updates.emergencyNotificationsEnabled
            : emergencyNotificationsEnabled,
        }
      }, { merge: true });
    } catch (err) {
      console.error('Failed to save preferences to Firestore:', err);
    }
  };

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    document.body.className = theme === 'light' ? 'light-theme' : '';
    savePreferences({ theme });
  };

  const handleFontSizeChange = (size) => {
    setCurrentFontSize(size);
    document.documentElement.style.setProperty('--dynamic-font-size', `${size}px`);
    savePreferences({ fontSize: size });
  };

  const toggleEmergencyNotifications = () => {
    const newState = !emergencyNotificationsEnabled;
    setEmergencyNotificationsEnabled(newState);
    savePreferences({ emergencyNotificationsEnabled: newState });
    showToast(
      newState ? (t('alertsOn') || 'Emergency notifications enabled') : (t('alertsOff') || 'Emergency notifications disabled'),
      newState ? 'success' : 'info'
    );
  };

  // ============================================================
  // OTHER EFFECTS
  // ============================================================
  useEffect(() => {
    localStorage.setItem('emergency_notifications_enabled', String(emergencyNotificationsEnabled));
  }, [emergencyNotificationsEnabled]);

  useEffect(() => {
    if (lang === 'si-LK') updateLanguageFromTranscript('සිංහල');
    else if (lang === 'ta-LK') updateLanguageFromTranscript('தமிழ்');
    else updateLanguageFromTranscript('Hello');
  }, [lang, updateLanguageFromTranscript]);

  useEffect(() => {
    if (!transcript) {
      setSignWord('');
      return;
    }
    const words = transcript.trim().split(/\s+/);
    const lastWord = words[words.length - 1];
    if (!lastWord) return;
    if (/^[A-Za-z0-9]+$/.test(lastWord)) {
      setSignWord(lastWord.toLowerCase());
      return;
    }
    const fetchTranslation = async () => {
      try {
        const res = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=si&tl=en&dt=t&q=${encodeURIComponent(lastWord)}`
        );
        const data = await res.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          setSignWord(data[0][0][0].trim().toLowerCase());
        }
      } catch (e) {
        console.error('Translation failed:', e);
        setSignWord(lastWord.toLowerCase());
      }
    };
    const timer = setTimeout(fetchTranslation, 300);
    return () => clearTimeout(timer);
  }, [transcript]);

  useEffect(() => {
    if (isGuest) {
      const savedRelatives = localStorage.getItem('neth_sawan_guest_relatives');
      const savedSoundHistory = localStorage.getItem('neth_sawan_guest_sound_history');
      if (savedRelatives) setGuestRelatives(JSON.parse(savedRelatives));
      if (savedSoundHistory) setGuestSoundHistory(JSON.parse(savedSoundHistory));
    }
  }, [isGuest]);

  useEffect(() => {
    const check = () => {
      if (fallDetectorRef.current) {
        const blocked = fallDetectorRef.current.isBlocked?.() || false;
        setFallDetectorBlocked(blocked);
      }
    };
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  // ---- Loud sound emergency flash ----
  useEffect(() => {
    if (isLoud && soundType && !roadSafetyActive && emergencyNotificationsEnabled) {
      setFlashEmergency(true);
      setEmergencyData({ soundType, message: `Emergency: ${soundType}`, timestamp: new Date(), volume });
      setEmergencyMessage(`🚨 ${soundType} detected!`);
      addNotificationToFirestore({
        type: 'EMERGENCY',
        message: `Emergency: ${soundType}`,
        soundType: soundType,
        location: null,
        read: false
      });
      setTimeout(() => setFlashEmergency(false), 3000);
    }
  }, [isLoud, soundType, roadSafetyActive, emergencyNotificationsEnabled, addNotificationToFirestore]);

  useEffect(() => {
    if (isGuest && soundHistory?.length > 0) {
      setGuestSoundHistory(prev => {
        const updated = [...soundHistory, ...prev].slice(0, 50);
        localStorage.setItem('neth_sawan_guest_sound_history', JSON.stringify(updated));
        return updated;
      });
    }
  }, [soundHistory, isGuest]);

  // ============================================================
  // TOAST, SIDEBAR, LOGOUT, GUEST MODE, FALL PERMISSION, ETC.
  // ============================================================
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('guestUser');
      setIsGuest(false);
      setGuestName('');
      setUser(null);
      setShowLanding(true);
      setIsAdmin(false);
      setShowAdmin(false);
      showToast(t('loggedOut') || 'Logged out', 'success');
    } catch {
      showToast(t('logoutFailed') || 'Logout failed', 'error');
    }
  };

  const handleGuestMode = () => {
    const name = prompt('Enter your guest name:') || 'Guest';
    localStorage.setItem('guestUser', JSON.stringify({ name, timestamp: Date.now() }));
    setIsGuest(true);
    setGuestName(name);
    setShowLanding(false);
    setIsAdmin(false);
    showToast(t('guestModeActivated') || 'Guest mode activated', 'success');
  };

  const handleSignOutGuest = () => {
    localStorage.removeItem('guestUser');
    setIsGuest(false);
    setGuestName('');
    setShowLanding(true);
    showToast(t('guestSignedOut') || 'Signed out from guest mode', 'info');
  };

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

  const handleTranscriptChange = (text) => {
    setSinhalaText(text);
    if (text && text.trim()) {
      const words = text.trim().split(/\s+/);
      const lastWord = words[words.length - 1];
      if (/[\u0D80-\u0DFF]/.test(lastWord)) {
        const fetchTranslation = async () => {
          try {
            const res = await fetch(
              `https://translate.googleapis.com/translate_a/single?client=gtx&sl=si&tl=en&dt=t&q=${encodeURIComponent(lastWord)}`
            );
            const data = await res.json();
            if (data && data[0] && data[0][0] && data[0][0][0]) {
              setSignWord(data[0][0][0].trim().toLowerCase());
            }
          } catch (e) {
            console.error('Translation failed:', e);
          }
        };
        fetchTranslation();
      } else {
        setSignWord(lastWord.toLowerCase());
      }
    }
  };

  const getSignLanguageText = () => sinhalaText || transcript;

  const guestAddRelative = (data) => {
    const entry = {
      id: Date.now().toString(),
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

  // ============================================================
  // EMERGENCY DISPATCH
  // ============================================================
  const sendAlertToContact = (contact, alertType, location, userEmail) => {
    if (!contact.phone) {
      console.warn(`❌ ${contact.name} has no phone number`);
      return;
    }
    if (contact.notifyByWhatsApp) {
      const waMsg = buildWhatsAppMessage(contact.name, location, userEmail, alertType);
      let phone = contact.phone.replace(/[\s\-\(\)\.]/g, '');
      if (phone.startsWith('0')) phone = '94' + phone.slice(1);
      else if (phone.startsWith('+')) phone = phone.replace('+', '');
      else if (!phone.startsWith('94')) phone = '94' + phone;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}`, '_blank', 'noopener,noreferrer');
      showToast(`💬 WhatsApp sent to ${contact.name}`, 'info');
    }
    if (contact.notifyBySMS) {
      const smsMsg = buildSmsMessage(contact.name, location, userEmail, alertType);
      window.open(`sms:${contact.phone}?body=${encodeURIComponent(smsMsg)}`, '_blank');
      showToast(`✉️ SMS sent to ${contact.name}`, 'info');
    }
    if (contact.notifyByDesktop && Notification.permission === 'granted') {
      new Notification(`🆘 EMERGENCY ALERT - ${contact.name}`, {
        body: `${alertType} - Immediate attention needed!`,
        icon: 'https://cdn-icons-png.flaticon.com/512/3670/3670051.png',
        requireInteraction: true,
        vibrate: [200, 100, 200]
      });
    }
  };

  const handleFallEmergency = async () => {
    console.log("🚨 Fall emergency triggered!");
    let location = null;
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000, enableHighAccuracy: true })
      );
      location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch (e) {
      console.warn('Location error:', e.message);
    }

    if (user && !isGuest) {
      try {
        await addDoc(collection(db, 'emergency_alerts'), {
          alertType: 'AUTOMATIC_FALL_DETECTION',
          status: 'CRITICAL',
          timestamp: serverTimestamp(),
          userId: user.uid,
          location: location ? `${location.lat}, ${location.lng}` : 'Location Unavailable'
        });
      } catch (e) {
        console.error('Firebase save error:', e);
      }
    }

    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);

    if (emergencyNotificationsEnabled) {
      setFlashEmergency(true);
      setEmergencyData({
        soundType: '🛑 FALL DETECTED',
        message: 'An automatic fall was detected!',
        timestamp: new Date(),
        volume: 1.0,
        location
      });
      setEmergencyMessage('🚨 FALL DETECTED!');
      showToast('🚨 AUTOMATIC FALL DETECTED!', 'error');
      addNotificationToFirestore({
        type: 'EMERGENCY',
        message: 'Automatic fall detected!',
        soundType: 'FALL',
        location: location,
        read: false
      });
      setTimeout(() => setFlashEmergency(false), 8000);
    }

    if (currentRelatives.length > 0) {
      currentRelatives.forEach(contact => {
        sendAlertToContact(contact, 'FALL DETECTED', location, user?.email || 'Guest User');
      });
    } else {
      showToast('⚠️ No emergency contacts added. Add contacts in the Contacts tab.', 'warning');
    }
  };

  const triggerEmergency = async (msg) => {
    console.log("🆘 SOS triggered:", msg);
    let location = null;
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000, enableHighAccuracy: true })
      );
      location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch (e) {
      console.warn('Location error:', e.message);
    }

    setEmergencyMessage(msg || '🚨 SOS Activated!');
    setFlashEmergency(true);
    setEmergencyData({
      soundType: '🆘 SOS',
      message: msg || 'Manual SOS Triggered!',
      timestamp: new Date(),
      volume: 1.0,
      location
    });
    showToast(`🚨 EMERGENCY: ${msg || 'SOS Activated!'}`, 'error');
    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);

    if (user && !isGuest) {
      try {
        await addDoc(collection(db, 'emergencies'), {
          userId: user.uid,
          message: msg || 'SOS',
          timestamp: serverTimestamp(),
          location
        });
      } catch (e) {
        console.error('Error saving emergency:', e);
      }
    } else if (isGuest) {
      guestAddNotification({
        id: Date.now(),
        type: 'EMERGENCY',
        message: msg || 'SOS',
        timestamp: new Date().toISOString(),
        read: false,
        location
      });
    }

    addNotificationToFirestore({
      type: 'EMERGENCY',
      message: msg || 'SOS Button Pressed',
      soundType: 'SOS',
      location: location,
      read: false
    });

    if (currentRelatives.length > 0) {
      currentRelatives.forEach(contact => {
        sendAlertToContact(contact, msg || 'SOS', location, user?.email || 'Guest User');
      });
    } else {
      showToast('⚠️ No emergency contacts added. Add contacts in the Contacts tab.', 'warning');
    }

    setTimeout(() => setFlashEmergency(false), 8000);
  };

  // ================================================================
  // RENDER
  // ================================================================

  if (authLoading || !userRoleLoaded) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Neth-Sawan Loading...</p>
        <div style={{ fontSize: '48px', marginTop: '16px' }}>🤟</div>
      </div>
    );
  }

  if (showInstructions) {
    return <InstructionsPage onClose={() => setShowInstructions(false)} />;
  }

  if (showLanding && !user && !isGuest) {
    return <LandingPage onGuestMode={handleGuestMode} onShowInstructions={() => setShowInstructions(true)} />;
  }

  // 🔥 If user is admin and showAdmin is true, render AdminDashboard
  if (user && isAdmin && showAdmin) {
    return (
      <AdminDashboard 
        user={user} 
        onClose={() => {
          setShowAdmin(false);
        }}
      />
    );
  }

  // Otherwise render the main user app
  const isMobile = window.innerWidth <= 1024;

  return (
    <div className={`app-wrapper ${currentTheme}`} style={{ fontSize: `${currentFontSize}px` }}>
      {showLanding && <BackgroundVideo videoSrc="/videos/background.mp4" opacity={0.5} />}

      <FallDetector
        ref={fallDetectorRef}
        user={user}
        isGuest={isGuest}
        showToast={showToast}
        onFallDetected={handleFallEmergency}
      />

      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="protanopia"><feColorMatrix type="matrix" values="0.567,0.433,0,0,0,0.558,0.442,0,0,0,0,0.242,0.758,0,0,0,0,0,1,0"/></filter>
          <filter id="deuteranopia"><feColorMatrix type="matrix" values="0.625,0.375,0,0,0,0.7,0.3,0,0,0,0,0.3,0.7,0,0,0,0,0,1,0"/></filter>
          <filter id="tritanopia"><feColorMatrix type="matrix" values="0.95,0.05,0,0,0,0,0.433,0.567,0,0,0,0.475,0.525,0,0,0,0,0,1,0"/></filter>
        </defs>
      </svg>

      <EmergencyFlash
        isVisible={flashEmergency && emergencyNotificationsEnabled}
        emergencyData={emergencyData}
        message={emergencyMessage}
        onClose={() => setFlashEmergency(false)}
      />

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

      <div
        className={`sidebar-backdrop ${sidebarOpen && isMobile ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className={`content-area ${sidebarOpen ? 'sidebar-open' : ''}`}>
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
          isAdmin={isAdmin}
          onOpenAdmin={() => setShowAdmin(true)}
        />

        <main className="main-content">
          {activeTab === 'dashboard' && (
            <>
              <div className="dashboard-grid">
                <div className="dashboard-left">
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
                <div className="dashboard-right">
                  <SignLanguageBox transcript={getSignLanguageText()} />
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

              <div className="dashboard-secondary">
                <SoundHistory soundHistory={currentSoundHistory} onClear={() => setSoundHistory([])} />
                <VideoTutorial />
              </div>

              <div className="dashboard-primary">
                <div className="sound-card">
                  <h3 className="card-title-simple"><span>🔊</span> Sound Monitor</h3>
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
                      addNotificationToFirestore({
                        type: 'ROAD_SAFETY',
                        message: alert.description,
                        soundType: alert.name,
                        location: null,
                        read: false
                      });
                      setTimeout(() => setFlashEmergency(false), 5000);
                    }
                  }}
                  showToast={showToast}
                />
              </div>
            </>
          )}

          {activeTab === 'vision' && <Aivision showToast={showToast} />}

          {activeTab === 'learn' && (
            <div className="learn-tab-grid" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <SignLanguageTutor />
              <VideoTutorial />
            </div>
          )}

          {activeTab === 'inperson' && (
            <InPersonTranslator onClose={() => setActiveTab('dashboard')} />
          )}

          {activeTab === 'community' && <OnlineUsers user={user} isGuest={isGuest} guestName={guestName} />}

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
                <button
                  className="emergency-btn police"
                  style={{ flex: 1, padding: '16px', borderRadius: '16px', background: '#1A1E3A', border: '1px solid #4488FF', color: '#4488FF', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }}
                  onClick={() => window.location.href = 'tel:119'}
                >
                  👮 {t('police') || 'Police'} (119)
                </button>
                <button
                  className="emergency-btn ambulance"
                  style={{ flex: 1, padding: '16px', borderRadius: '16px', background: '#1A1E3A', border: '1px solid #FF3355', color: '#FF3355', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }}
                  onClick={() => window.location.href = 'tel:1990'}
                >
                  🚑 {t('ambulance') || 'Ambulance'} (1990)
                </button>
              </div>

              <div className="emergency-instructions-box" style={{ 
                padding: '20px', 
                background: 'rgba(255,0,51,0.05)', 
                borderRadius: '16px', 
                borderLeft: '4px solid #FF0033' 
              }}>
                <h4 style={{ color: '#FF0033', marginBottom: '16px' }}>
                  ⚠️ {t('emergencyInstructions') || 'Emergency Instructions'}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li className="emergency-instruction-item">
                    <span className="instruction-icon">🔴</span>
                    <span className="instruction-text">
                      {t('redFlashing') || 'Red Flashing Screen = Emergency detected or SOS activated'}
                    </span>
                  </li>
                  <li className="emergency-instruction-item">
                    <span className="instruction-icon">📳</span>
                    <span className="instruction-text">
                      {t('vibration') || 'Phone Vibration = Alert being sent to your contacts'}
                    </span>
                  </li>
                  <li className="emergency-instruction-item">
                    <span className="instruction-icon">📱</span>
                    <span className="instruction-text">
                      {t('contactsNotify') || 'Emergency Contacts = Will receive WhatsApp/SMS alerts'}
                    </span>
                  </li>
                  <li className="emergency-instruction-item">
                    <span className="instruction-icon">📍</span>
                    <span className="instruction-text">
                      {t('liveLocation') || 'Live Location = Automatically shared with emergency contacts'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'roadmonitor' && (
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>🛣️ {t('roadSafetyMonitor') || 'Road Safety Monitor'}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {t('dedicatedRoadSafety') || "Full‑screen detection of horns, sirens, engines – with direction & distance hints"}
                </p>
                <div style={{ 
                  marginTop: '12px', 
                  padding: '8px 20px', 
                  borderRadius: '40px', 
                  display: 'inline-block',
                  background: roadSafetyActive ? 'rgba(0, 221, 179, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: roadSafetyActive ? '#00DDB3' : '#8899CC',
                  border: roadSafetyActive ? '1px solid #00DDB3' : '1px solid rgba(255,255,255,0.1)',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}>
                  {roadSafetyActive ? '🟢 Monitor Active' : '⏸️ Monitor Paused – Click "🚗 Road Safe" in Header to Start'}
                </div>
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
                    addNotificationToFirestore({
                      type: 'ROAD_SAFETY',
                      message: alert.description,
                      soundType: alert.name,
                      location: null,
                      read: false
                    });
                    setTimeout(() => setFlashEmergency(false), 5000);
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

      {toast.show && (
        <div className={`toast-message ${toast.type}`} role="alert">
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ===== MAIN WRAPPER =====
function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;