// src/hooks/useGuestNotifications.js
import { useState, useEffect, useCallback } from 'react';

export const useGuestNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('neth_sawan_guest_notifications');
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse guest notifications:', e);
        setNotifications([]);
      }
    }
  }, []);

  // Save to localStorage whenever notifications change
  const saveNotifications = useCallback((newNotifications) => {
    try {
      localStorage.setItem('neth_sawan_guest_notifications', JSON.stringify(newNotifications));
    } catch (e) {
      console.error('Failed to save guest notifications:', e);
    }
  }, []);

  // Add a new notification
  const addNotification = useCallback((notification) => {
    setNotifications(prev => {
      const newList = [notification, ...prev].slice(0, 50); // keep last 50
      saveNotifications(newList);
      return newList;
    });
  }, [saveNotifications]);

  // Mark a notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev => {
      const newList = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveNotifications(newList);
      return newList;
    });
  }, [saveNotifications]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const newList = prev.map(n => ({ ...n, read: true }));
      saveNotifications(newList);
      return newList;
    });
  }, [saveNotifications]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, [saveNotifications]);

  // Remove a specific notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const newList = prev.filter(n => n.id !== id);
      saveNotifications(newList);
      return newList;
    });
  }, [saveNotifications]);

  // Get unread count
  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
    getUnreadCount,
  };
};