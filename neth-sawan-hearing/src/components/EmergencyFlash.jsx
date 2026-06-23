// src/components/EmergencyFlash.jsx
import React, { useState, useEffect, useRef } from 'react';
import './EmergencyFlash.css';

const EmergencyFlash = ({ isVisible, emergencyData, message, onClose }) => {
  const [countdown, setCountdown] = useState(8);
  const intervalRef = useRef(null);
  const isClosingRef = useRef(false);
  const onCloseRef = useRef(onClose);

  // Update ref when onClose changes
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // Reset when hidden
    if (!isVisible) {
      setCountdown(8);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isClosingRef.current = false;
      return;
    }

    // Reset countdown when becoming visible
    setCountdown(8);
    isClosingRef.current = false;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start new interval
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        const newCount = prev - 1;
        if (newCount <= 0) {
          // Stop interval
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          // Auto close
          if (!isClosingRef.current && onCloseRef.current) {
            isClosingRef.current = true;
            onCloseRef.current();
          }
          return 0;
        }
        return newCount;
      });
    }, 1000);

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isVisible]); // ✅ Only depend on isVisible, NOT onClose

  const handleDismiss = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!isClosingRef.current && onCloseRef.current) {
      isClosingRef.current = true;
      onCloseRef.current();
    }
  };

  if (!isVisible) return null;

  const alertMessage = message || '🚨 EMERGENCY ALERT';
  const alertType = emergencyData?.soundType || 'SOS Emergency';
  const alertTime = emergencyData?.timestamp 
    ? new Date(emergencyData.timestamp).toLocaleTimeString() 
    : new Date().toLocaleTimeString();
  const location = emergencyData?.location;

  return (
    <div className="emergency-flash-overlay">
      <div className="emergency-flash-content">
        <div className="emergency-siren">
          <div className="siren-ring"></div>
          <div className="siren-ring"></div>
          <div className="siren-ring"></div>
          <span className="siren-icon">🚨</span>
        </div>

        <h1>{alertMessage}</h1>

        <div className="emergency-details">
          <p><strong>Type:</strong> {alertType}</p>
          <p><strong>Time:</strong> {alertTime}</p>
          {location && (
            <p>
              <strong>📍 Location:</strong>
              <a 
                href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#FFD700', marginLeft: '8px' }}
              >
                View on Map →
              </a>
            </p>
          )}
        </div>

        <div className="visual-cues">
          <div className="visual-bar red"></div>
          <div className="visual-bar orange"></div>
          <div className="visual-bar yellow"></div>
        </div>

        <p className="warning-text">📤 EMERGENCY ALERT SENT TO YOUR CONTACTS!</p>

        <div className="countdown">
          Flash ends in <strong>{countdown}</strong> seconds
        </div>

        <button 
          className="dismiss-flash-btn"
          onClick={handleDismiss}
        >
          ✕ Dismiss
        </button>
      </div>
    </div>
  );
};

export default EmergencyFlash;