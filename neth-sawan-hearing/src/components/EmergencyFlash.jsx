import React, { useEffect, useState } from 'react';

const EmergencyFlash = ({ isVisible, emergencyData }) => {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setCountdown(3);
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
        <div className="flashing-siren">
          <div className="siren-ring"></div>
          <div className="siren-ring"></div>
          <div className="siren-ring"></div>
          <span className="siren-icon">🚨</span>
        </div>
        
        <h1 className="emergency-title">EMERGENCY ALERT</h1>
        
        <div className="emergency-details-flash">
          <p className="sound-detected">
            <strong>Sound Detected:</strong> {emergencyData?.soundType || 'Unknown'}
          </p>
          <p className="time-detected">
            <strong>Time:</strong> {new Date(emergencyData?.timestamp).toLocaleTimeString()}
          </p>
          {emergencyData?.volume && (
            <p className="volume-level">
              <strong>Volume:</strong> {Math.round(emergencyData.volume * 100)}%
            </p>
          )}
        </div>

        <div className="visual-cue">
          <div className="visual-bar red-flash"></div>
          <div className="visual-bar yellow-flash"></div>
          <div className="visual-bar white-flash"></div>
        </div>

        <div className="action-instructions">
          <p>⚠️ VISUAL ALERT ⚠️</p>
          <p>A loud sound has been detected. Check your surroundings.</p>
          <p className="sign-translation">🤟 ශබ්දයක් අනාවරණය විය - කරුණාකර අවට පරීක්ෂා කරන්න</p>
        </div>

        <div className="countdown-timer">
          <div className="countdown-ring">
            <span>{countdown}</span>
          </div>
          <p>Alert ends in {countdown}s</p>
        </div>
      </div>

      <style>{`
        .emergency-flash-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.95);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: flashBg 0.3s ease infinite alternate;
        }
        
        @keyframes flashBg {
          0% { background: rgba(255, 51, 85, 0.95); }
          100% { background: rgba(0, 0, 0, 0.95); }
        }
        
        .emergency-flash-content {
          text-align: center;
          padding: 40px;
          border-radius: 40px;
          background: rgba(0, 0, 0, 0.8);
          border: 3px solid #FF3355;
          animation: pulse 0.8s ease infinite;
          max-width: 500px;
          width: 90%;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); border-color: #FF3355; }
          50% { transform: scale(1.02); border-color: #FF8833; }
        }
        
        .flashing-siren {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 20px;
        }
        
        .siren-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(255, 51, 85, 0.4);
          transform: translate(-50%, -50%);
          animation: ring 1.5s ease-out infinite;
        }
        
        .siren-ring:nth-child(2) { animation-delay: 0.5s; }
        .siren-ring:nth-child(3) { animation-delay: 1s; }
        
        @keyframes ring {
          0% { width: 100%; height: 100%; opacity: 1; }
          100% { width: 200%; height: 200%; opacity: 0; }
        }
        
        .siren-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 60px;
          animation: shake 0.2s ease infinite;
        }
        
        @keyframes shake {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
          25% { transform: translate(-50%, -50%) rotate(10deg); }
          75% { transform: translate(-50%, -50%) rotate(-10deg); }
        }
        
        .emergency-title {
          font-size: 32px;
          font-weight: 800;
          color: #FF3355;
          margin-bottom: 20px;
          letter-spacing: 2px;
        }
        
        .emergency-details-flash {
          background: rgba(255, 51, 85, 0.1);
          border-radius: 20px;
          padding: 15px;
          margin-bottom: 20px;
        }
        
        .emergency-details-flash p {
          margin: 8px 0;
          color: white;
          font-size: 14px;
        }
        
        .visual-cue {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin: 20px 0;
        }
        
        .visual-bar {
          width: 60px;
          height: 60px;
          border-radius: 10px;
          animation: flashBar 0.5s ease infinite alternate;
        }
        
        .red-flash { background: #FF3355; animation-delay: 0s; }
        .yellow-flash { background: #FF8833; animation-delay: 0.15s; }
        .white-flash { background: white; animation-delay: 0.3s; }
        
        @keyframes flashBar {
          0% { opacity: 0.3; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1.1); }
        }
        
        .action-instructions {
          background: rgba(0, 221, 179, 0.1);
          border-radius: 20px;
          padding: 15px;
          margin: 20px 0;
        }
        
        .action-instructions p {
          color: #00DDB3;
          margin: 5px 0;
          font-size: 14px;
        }
        
        .sign-translation {
          font-size: 16px !important;
          font-weight: bold;
        }
        
        .countdown-timer {
          margin-top: 20px;
        }
        
        .countdown-ring {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #FF3355;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
          animation: countdownBeat 1s ease infinite;
        }
        
        .countdown-ring span {
          font-size: 24px;
          font-weight: bold;
          color: white;
        }
        
        @keyframes countdownBeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .countdown-timer p {
          color: #8899CC;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default EmergencyFlash;