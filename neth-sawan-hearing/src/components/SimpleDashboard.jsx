// src/components/SimpleDashboard.jsx
import React from 'react';
import TranscriptBox from './TranscriptBox';
import SignLanguageBox from './SignLanguageBox';
import VisualAlert from './VisualAlert';
import { SoundHistory } from './SoundHistory';
import SoundVisualizer from './SoundVisualizer';
import './SimpleDashboard.css';

const SimpleDashboard = ({
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
  onTranscriptChange
}) => {
  return (
    <div className="simple-dashboard">
      {/* ===== SPLIT LAYOUT: Captions | Sound Wave | Sign Language ===== */}
      <div className="dashboard-split">

        {/* LEFT: Live Captions */}
        <div className="dashboard-left">
          <div className="captions-box">
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
        </div>

        {/* CENTER: Sound Wave Visualizer + Status */}
        <div className="dashboard-center">
          <div className="sound-wave-center">
            <div className="wave-container">
              <div className="wave-ring">
                <div className="wave-ring-inner">
                  {/* Animated sound wave bars */}
                  {[...Array(24)].map((_, i) => {
                    const height = Math.max(4, Math.sin((i / 24) * Math.PI * 2) * volume * 60 + 30);
                    const delay = (i / 24) * 0.8;
                    const isActive = isLoud || isListening;
                    return (
                      <div
                        key={i}
                        className={`wave-bar ${isActive ? 'active' : ''}`}
                        style={{
                          height: `${isActive ? height : 6}px`,
                          animationDelay: `${delay}s`,
                          animationDuration: `${0.6 + volume * 0.8}s`,
                          background: isLoud
                            ? 'linear-gradient(180deg, #FF3355, #FF8866)'
                            : isListening
                            ? 'linear-gradient(180deg, #00DDB3, #66FFCC)'
                            : 'rgba(255,255,255,0.15)'
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="wave-status">
                {isListening ? (
                  <span className="status-live">
                    <span className="pulse-dot"></span>
                    LIVE
                  </span>
                ) : (
                  <span className="status-idle">⏸ PAUSED</span>
                )}
                {soundType && (
                  <span className="wave-sound-type">
                    {isLoud ? '🔊' : '🔈'} {soundType}
                  </span>
                )}
                <span className="wave-volume">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Sign Language */}
        <div className="dashboard-right">
          <div className="sign-box">
            <SignLanguageBox transcript={transcript} />
          </div>
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

      {/* ===== BOTTOM ROW: Sound Monitor + Road Safety ===== */}
      <div className="dashboard-primary">
        <div className="sound-card">
          <h3 className="card-title-simple">
            <span>🔊</span> Sound Monitor
          </h3>
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

      {/* ===== SOUND HISTORY ===== */}
      <div className="dashboard-secondary">
        <SoundHistory soundHistory={soundHistory.slice(0, 5)} />
      </div>

      {/* ===== Road Safety Banner ===== */}
      {roadSafetyActive && (
        <div className="road-safety-banner">
          <span>🚗</span>
          <div>
            <strong>Road Safety Mode Active</strong>
            <small>Listening for vehicles, horns, and sirens</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleDashboard;