import React, { useEffect, useState } from 'react';
import './EmergencyFlash.css';

const EmergencyFlash = ({ isVisible, emergencyData, message, onClose }) => {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setCountdown(8);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            if (onClose) onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="emergency-flash-overlay">
      <div className="emergency-flash-content">
        <div className="emergency-siren">
          <div className="siren-ring"></div>
          <div className="siren-ring"></div>
          <div className="siren-ring"></div>
          <span className="siren-icon">🚨</span>
        </div>
        <h1>{message || '🚨 EMERGENCY ALERT'}</h1>
        <div className="emergency-details">
          <p><strong>Type:</strong> {emergencyData?.soundType || 'SOS Emergency'}</p>
          <p><strong>Time:</strong> {new Date(emergencyData?.timestamp).toLocaleTimeString()}</p>
          {emergencyData?.location && (
            <p>
              <strong>📍 Location:</strong>
              <a 
                href={`https://www.google.com/maps?q=${emergencyData.location.lat},${emergencyData.location.lng}`} 
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
          onClick={onClose}
          style={{
            marginTop: '20px',
            padding: '12px 32px',
            borderRadius: '40px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            fontWeight: '700',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          ✕ Dismiss
        </button>
      </div>
    </div>
  );
};

export default EmergencyFlash;