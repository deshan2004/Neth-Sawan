import React, { useEffect, useState } from 'react';

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
    <div className="emergency-flash-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.95)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'criticalFlash 0.2s infinite alternate'
    }}>
      <div style={{
        textAlign: 'center',
        background: '#000000CC',
        padding: '40px',
        borderRadius: '48px',
        maxWidth: '600px',
        width: '90%',
        border: '6px solid #FF0033'
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>🚨</div>
        <h1 style={{ fontSize: '48px', color: '#FF0033', marginBottom: '20px', fontWeight: '900', textShadow: '2px 2px 0 white' }}>
          EMERGENCY ALERT
        </h1>
        
        <div style={{ fontSize: '24px', margin: '20px 0', background: '#FF003320', padding: '20px', borderRadius: '24px' }}>
          <p><strong>Sound Detected:</strong> {emergencyData?.soundType || 'Unknown'}</p>
          <p><strong>Time:</strong> {new Date(emergencyData?.timestamp).toLocaleTimeString()}</p>
          {emergencyData?.volume && <p><strong>Volume:</strong> {Math.round(emergencyData.volume * 100)}%</p>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', margin: '30px 0' }}>
          <div style={{ width: '60px', height: '60px', background: '#FF0033', borderRadius: '12px', animation: 'flashBar 0.3s infinite alternate' }}></div>
          <div style={{ width: '60px', height: '60px', background: '#FF8800', borderRadius: '12px', animation: 'flashBar 0.3s infinite alternate 0.1s' }}></div>
          <div style={{ width: '60px', height: '60px', background: '#FFFF00', borderRadius: '12px', animation: 'flashBar 0.3s infinite alternate 0.2s' }}></div>
        </div>

        <div style={{ fontSize: '20px', marginTop: '20px' }}>⚠️ CHECK YOUR SURROUNDINGS ⚠️</div>
        <div style={{ marginTop: '30px', fontSize: '18px' }}>
          Alert ends in <strong style={{ fontSize: '32px', color: '#FF0033' }}>{countdown}</strong> seconds
        </div>
      </div>

      <style>{`
        @keyframes criticalFlash {
          0% { background: rgba(255, 0, 51, 0.9); }
          100% { background: rgba(0, 0, 0, 0.95); }
        }
        @keyframes flashBar {
          0% { opacity: 0.3; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default EmergencyFlash;