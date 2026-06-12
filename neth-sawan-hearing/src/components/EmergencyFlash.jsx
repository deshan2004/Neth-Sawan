import React, { useEffect, useState } from 'react';
import './EmergencyFlash.css';

const EmergencyFlash = ({ isVisible, emergencyData }) => {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

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
        <h1>EMERGENCY ALERT</h1>
        <div className="emergency-details">
          <p><strong>Detected:</strong> {emergencyData?.soundType || 'SOS button pressed'}</p>
          <p><strong>Time:</strong> {new Date(emergencyData?.timestamp).toLocaleTimeString()}</p>
          {emergencyData?.volume && <p><strong>Volume:</strong> {Math.round(emergencyData.volume * 100)}%</p>}
        </div>
        <div className="visual-cues">
          <div className="visual-bar red"></div>
          <div className="visual-bar orange"></div>
          <div className="visual-bar yellow"></div>
        </div>
        <p className="warning-text">⚠️ CHECK YOUR SURROUNDINGS ⚠️</p>
        <div className="countdown">
          Alert ends in <strong>{countdown}</strong> seconds
        </div>
      </div>
    </div>
  );
};

export default EmergencyFlash;