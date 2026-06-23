// src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const useNotifications = () => {
  const [permission, setPermission] = useState('default');
  const [notificationQueue, setNotificationQueue] = useState([]);
  const [relatives, setRelatives] = useState([]);
  const [autoSendStatus, setAutoSendStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // ---- Permission ----
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch {
      return false;
    }
  }, []);

  // ---- Load contacts from Firestore (if logged in) or localStorage (guest) ----
  const loadContacts = useCallback(async () => {
    const user = auth.currentUser;
    let list = [];
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          list = data.emergencyContacts || [];
        }
      } catch (error) {
        console.error('Failed to load contacts from Firestore:', error);
      }
    } else {
      // Guest: load from localStorage
      try {
        const saved = localStorage.getItem('neth_sawan_relatives');
        if (saved) list = JSON.parse(saved);
      } catch {}
    }
    setRelatives(list);
    setIsLoading(false);
  }, []);

  // ---- Save contacts (Firestore for logged‑in, localStorage for guest) ----
  const saveContacts = useCallback(async (list) => {
    const user = auth.currentUser;
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { emergencyContacts: list }, { merge: true });
      } catch (error) {
        console.error('Failed to save contacts to Firestore:', error);
      }
    } else {
      try {
        localStorage.setItem('neth_sawan_relatives', JSON.stringify(list));
      } catch {}
    }
  }, []);

  // ---- Reload when auth state changes ----
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      loadContacts();
    });
    return () => unsubscribe();
  }, [loadContacts]);

  // ---- CRUD operations (all call saveContacts) ----
  const addRelative = useCallback(async (data) => {
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
    setRelatives(prev => {
      const updated = [...prev, entry];
      saveContacts(updated);
      return updated;
    });
    return entry;
  }, [saveContacts]);

  const removeRelative = useCallback(async (id) => {
    setRelatives(prev => {
      const updated = prev.filter(r => r.id !== id);
      saveContacts(updated);
      return updated;
    });
  }, [saveContacts]);

  const updateRelative = useCallback(async (id, updates) => {
    setRelatives(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      saveContacts(updated);
      return updated;
    });
  }, [saveContacts]);

  // ---- Format phone for WhatsApp ----
  const formatPhoneForWhatsApp = (phone) => {
    let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    if (cleaned.startsWith('0')) cleaned = '+94' + cleaned.slice(1);
    else if (!cleaned.startsWith('+')) cleaned = '+94' + cleaned;
    return cleaned.replace('+', '');
  };

  // ---- Build messages (same as before) ----
  const buildBeautifulMessage = (data, relative) => {
    const time = new Date(data.timestamp || new Date()).toLocaleTimeString('en-LK', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
    const date = new Date(data.timestamp || new Date()).toLocaleDateString('en-LK', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    let msg = `🚨 *EMERGENCY ALERT - Neth-Sawan* 🚨\n\n`;
    msg += `─────────────────────────────────────\n`;
    msg += `*To:* ${relative.name}\n`;
    msg += `*From:* Neth-Sawan Emergency System\n`;
    msg += `─────────────────────────────────────\n\n`;
    msg += `⚠️ *Emergency Detected:* ${data.soundType || 'Emergency button pressed'}\n`;
    msg += `📅 *Date:* ${date}\n`;
    msg += `⏰ *Time:* ${time}\n`;
    msg += `📝 *Message:* ${data.message || 'Immediate assistance may be needed.'}\n\n`;
    if (data.location) {
      msg += `📍 *Location:*\n`;
      msg += `https://www.google.com/maps?q=${data.location.lat},${data.location.lng}\n\n`;
    }
    msg += `─────────────────────────────────────\n`;
    msg += `⚠️ *URGENT: Please respond as soon as possible* ⚠️\n`;
    msg += `─────────────────────────────────────\n\n`;
    msg += `_This is an automated emergency alert from Neth-Sawan Hearing Assistant._`;
    return msg;
  };

  const buildSimpleMessage = (data, relative) => {
    const time = new Date(data.timestamp || new Date()).toLocaleTimeString('en-LK', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
    let msg = `EMERGENCY ALERT - Neth-Sawan\n`;
    msg += `To: ${relative.name}\n`;
    msg += `Detected: ${data.soundType || 'Emergency button pressed'}\n`;
    msg += `Time: ${time}\n`;
    msg += `Message: ${data.message || 'Immediate assistance needed!'}`;
    if (data.location) {
      msg += `\nLocation: https://www.google.com/maps?q=${data.location.lat},${data.location.lng}`;
    }
    return msg;
  };

  // ---- Auto‑send WhatsApp ----
  const autoSendWhatsApp = useCallback(async (relative, emergencyData) => {
    if (!relative.autoSendWhatsApp || !relative.phone) return false;
    const message = buildBeautifulMessage(emergencyData, relative);
    const phoneNumber = formatPhoneForWhatsApp(relative.phone);
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    setAutoSendStatus(prev => ({ ...prev, [relative.id]: 'sending' }));
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
      if (Notification.permission === 'granted') {
        new Notification(`WhatsApp Sent to ${relative.name}`, {
          body: `Emergency alert has been sent via WhatsApp`,
          icon: 'https://cdn-icons-png.flaticon.com/512/3670/3670051.png'
        });
      }
      setAutoSendStatus(prev => ({ ...prev, [relative.id]: 'sent' }));
      setTimeout(() => {
        setAutoSendStatus(prev => ({ ...prev, [relative.id]: null }));
      }, 3000);
      return true;
    } catch (error) {
      console.error('Auto WhatsApp send failed:', error);
      setAutoSendStatus(prev => ({ ...prev, [relative.id]: 'failed' }));
      return false;
    }
  }, []);

  const openWhatsApp = useCallback((relative, emergencyData) => {
    if (!relative.phone) return;
    const message = buildBeautifulMessage(emergencyData, relative);
    const phoneNumber = formatPhoneForWhatsApp(relative.phone);
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const openSMS = useCallback((relative, emergencyData) => {
    if (!relative.phone) return;
    const message = buildSimpleMessage(emergencyData, relative);
    const url = `sms:${relative.phone}?body=${encodeURIComponent(message)}`;
    window.location.href = url;
  }, []);

  const makeCall = useCallback((relative) => {
    if (!relative.phone) return;
    window.location.href = `tel:${relative.phone}`;
  }, []);

  // ---- Desktop notification helper ----
  const sendDesktopNotification = (title, body, tag) => {
    if (permission !== 'granted') return;
    try {
      const n = new Notification(title, {
        body,
        tag,
        renotify: true,
        requireInteraction: true,
        silent: false,
        vibrate: [300, 100, 300],
      });
      n.onclick = () => { window.focus(); n.close(); };
      setTimeout(() => n.close(), 30000);
    } catch {}
  };

  // ---- Notify all relatives ----
  const notifyRelatives = useCallback(async (emergencyData) => {
    const {
      message = 'Emergency detected',
      soundType = '',
      volume = 0,
      timestamp = new Date(),
    } = emergencyData;

    let location = null;
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 })
      );
      location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {}

    const notification = {
      id: Date.now(),
      type: 'EMERGENCY',
      message,
      soundType,
      volume: Math.round(volume * 100),
      timestamp: timestamp.toISOString(),
      location,
      read: false,
    };

    setNotificationQueue(prev => [notification, ...prev].slice(0, 50));

    for (const relative of relatives) {
      if (relative.notifyByDesktop && permission === 'granted') {
        sendDesktopNotification(
          `🚨 EMERGENCY — ${relative.name}`,
          `${message}\nDetected: ${soundType}\n${new Date(timestamp).toLocaleTimeString()}`,
          `emg-${notification.id}-${relative.id}`
        );
      }
      if (relative.autoSendWhatsApp && relative.notifyByWhatsApp) {
        await autoSendWhatsApp(relative, { ...emergencyData, location, timestamp });
      }
    }
    return { notification, location, relatives };
  }, [permission, relatives, autoSendWhatsApp]);

  // ---- Notification queue management ----
  const markAsRead = useCallback((id) => {
    setNotificationQueue(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotificationQueue([]);
  }, []);

  // ---- Return everything ----
  return {
    permission,
    requestPermission,
    relatives,
    isLoading,
    addRelative,
    removeRelative,
    updateRelative,
    notifyRelatives,
    openWhatsApp,
    openSMS,
    makeCall,
    notificationQueue,
    markAsRead,
    clearNotifications,
    autoSendStatus,
  };
};