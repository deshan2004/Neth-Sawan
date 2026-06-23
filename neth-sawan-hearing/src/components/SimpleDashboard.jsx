// src/components/Dashboard.jsx
import React from 'react';
import TranscriptBox from './TranscriptBox';
import SignLanguageBox from './SignLanguageBox';
import VisualAlert from './VisualAlert';
import { SoundHistory } from './SoundHistory';
import SoundVisualizer from './SoundVisualizer';
import RoadSafetyMonitor from './RoadSafetyMonitor';
import './Dashboard.css';

const Dashboard = ({
  transcript,
  isListening,
  startListening,
  stopListening,
  clearTranscript,
  speechError,
  browserInfo,
  isLoud,
  soundType,
  volume,
  threshold,
  setThreshold,
  soundHistory,
  emergencyNotificationsEnabled,
  roadSafetyActive,
  setLang,
  lang,
  retryListening,
  microphonePermission,
  recognitionStatus,
  supported,
  onTranscriptChange,
  showToast,
  setFlashEmergency,
  setEmergencyData,
  setEmergencyMessage,
  isGuest,
  guestAddNotification,
}) => {
  return (
    <div className="dashboard-modern">

      {/* ===== TOP STATS BAR ===== */}
      <div className="dashboard-stats">
        <div className="stat-item">
          <span className="stat-icon">🎤</span>
          <span className="stat-label">Status</span>
          <span className={`stat-value ${isListening ? 'live' : 'idle'}`}>
            {isListening ? '🟢 Live' : '⏸ Idle'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🔊</span>
          <span className="stat-label">Volume</span>
          <span className="stat-value">{Math.round(volume * 100)}%</span>
        </div>
        {soundType && (
          <div className="stat-item">
            <span className="stat-icon">🏷️</span>
            <span className="stat-label">Sound</span>
            <span className="stat-value sound-type">{soundType}</span>
          </div>
        )}
        <div className="stat-item">
          <span className="stat-icon">📝</span>
          <span className="stat-label">Words</span>
          <span className="stat-value">{transcript ? transcript.split(/\s+/).length : 0}</span>
        </div>
      </div>

      {/* ===== MAIN GRID ===== */}
      <div className="dashboard-main-grid">
        {/* Left: Live Captions */}
        <div className="dashboard-card captions-card">
          <div className="card-header">
            <span className="card-header-icon">📝</span>
            <h3>Live Captions</h3>
            <span className={`live-dot ${isListening ? 'active' : ''}`}></span>
          </div>
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
            onTranscriptChange={onTranscriptChange}
          />
        </div>

        {/* Center: Sound Wave + Visual Alert */}
        <div className="dashboard-card center-card">
          <div className="card-header">
            <span className="card-header-icon">📊</span>
            <h3>Sound Monitor</h3>
          </div>
          <div className="center-content">
            <SoundVisualizer volume={volume} isLoud={isLoud} soundType={soundType} />
            <VisualAlert
              isLoud={isLoud && emergencyNotificationsEnabled}
              soundType={soundType}
              volume={volume}
              threshold={threshold}
              onThresholdChange={setThreshold}
              soundHistory={soundHistory}
            />
          </div>
        </div>

        {/* Right: Sign Language */}
        <div className="dashboard-card sign-card">
          <div className="card-header">
            <span className="card-header-icon">🤟</span>
            <h3>Sign Language</h3>
            <span className="sign-badge">Live</span>
          </div>
          <SignLanguageBox transcript={transcript} />
        </div>
      </div>

      {/* ===== BOTTOM ROW ===== */}
      <div className="dashboard-bottom-grid">
        <div className="dashboard-card road-card">
          <div className="card-header">
            <span className="card-header-icon">🛣️</span>
            <h3>Road Safety</h3>
            <span className={`road-status ${roadSafetyActive ? 'active' : ''}`}>
              {roadSafetyActive ? '🟢 Active' : '⏸ Off'}
            </span>
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
                setTimeout(() => setFlashEmergency(false), 5000);
                if (isGuest) {
                  guestAddNotification({
                    id: Date.now(),
                    type: 'ROAD_SAFETY',
                    message: alert.description,
                    soundType: alert.name,
                    timestamp: new Date().toISOString(),
                    read: false
                  });
                }
              }
            }}
            showToast={showToast}
          />
        </div>

        <div className="dashboard-card history-card">
          <div className="card-header">
            <span className="card-header-icon">📜</span>
            <h3>Sound History</h3>
          </div>
          <SoundHistory soundHistory={soundHistory.slice(0, 8)} />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;