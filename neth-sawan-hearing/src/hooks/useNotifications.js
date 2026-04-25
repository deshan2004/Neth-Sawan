import { useState, useEffect, useCallback } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState('default');
  const [notificationQueue, setNotificationQueue] = useState([]);
  const [relatives, setRelatives] = useState([]);
  const [autoSendStatus, setAutoSendStatus] = useState({});

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    try {
      const saved = localStorage.getItem('neth_sawan_relatives');
      if (saved) setRelatives(JSON.parse(saved));
    } catch {}
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

  const saveRelatives = (list) => {
    try { localStorage.setItem('neth_sawan_relatives', JSON.stringify(list)); } catch {}
  };

  const addRelative = useCallback((data) => {
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
    setRelatives(prev => {
      const updated = [...prev, entry];
      saveRelatives(updated);
      return updated;
    });
    return entry;
  }, []);

  const removeRelative = useCallback((id) => {
    setRelatives(prev => {
      const updated = prev.filter(r => r.id !== id);
      saveRelatives(updated);
      return updated;
    });
  }, []);

  const updateRelative = useCallback((id, updates) => {
    setRelatives(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      saveRelatives(updated);
      return updated;
    });
  }, []);

  const formatPhoneForWhatsApp = (phone) => {
    let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    if (cleaned.startsWith('0')) cleaned = '+94' + cleaned.slice(1);
    else if (!cleaned.startsWith('+')) cleaned = '+94' + cleaned;
    return cleaned.replace('+', '');
  };

  const openWhatsApp = useCallback((relative, emergencyData) => {
    if (!relative.phone) return;
    const time = new Date().toLocaleTimeString();
    const message = `🚨 EMERGENCY ALERT\nDetected: ${emergencyData.soundType}\nTime: ${time}\nMessage: ${emergencyData.message || 'Immediate assistance needed!'}`;
    const phoneNumber = formatPhoneForWhatsApp(relative.phone);
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }, []);

  const openSMS = useCallback((relative, emergencyData) => {
    if (!relative.phone) return;
    const message = `EMERGENCY ALERT: ${emergencyData.soundType} - ${emergencyData.message || 'Immediate assistance needed!'}`;
    window.location.href = `sms:${relative.phone}?body=${encodeURIComponent(message)}`;
  }, []);

  const makeCall = useCallback((relative) => {
    if (!relative.phone) return;
    window.location.href = `tel:${relative.phone}`;
  }, []);

  const sendDesktopNotification = (title, body, tag) => {
    if (permission !== 'granted') return;
    try {
      const n = new Notification(title, { body, tag, requireInteraction: true });
      n.onclick = () => { window.focus(); n.close(); };
      setTimeout(() => n.close(), 30000);
    } catch {}
  };

  const notifyRelatives = useCallback(async (emergencyData) => {
    const { message = 'Emergency detected', soundType = '', volume = 0, timestamp = new Date() } = emergencyData;

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
        sendDesktopNotification(`🚨 EMERGENCY`, `${message}\nDetected: ${soundType}`, `emg-${notification.id}`);
      }
    }

    return { notification, location };
  }, [permission, relatives]);

  const markAsRead = useCallback((id) => {
    setNotificationQueue(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotificationQueue([]);
  }, []);

  return {
    permission,
    requestPermission,
    relatives,
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