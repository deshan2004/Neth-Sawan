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
  retryListening,        // 👈 New prop
  microphonePermission   // 👈 New prop
}) => {
  return (
    <div className="simple-dashboard">
      {/* ===== Main Unified Card ===== */}
      <div className="primary-card unified-card">
        <div className="card-header-simple">
          <h2>
            <span className="header-icon">🎤</span>
            Live Captions
            {isListening && <span className="live-badge">● LIVE</span>}
          </h2>
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
          retryListening={retryListening}        // 👈 New
          microphonePermission={microphonePermission} // 👈 New
        />
      </div>

      {/* ===== Sign Language Translator ===== */}
      <div className="primary-card sign-card">
        <div className="card-header-simple">
          <h2>
            <span className="header-icon">🤟</span>
            Sign Language Translator
            <span className="sign-badge">Live from captions</span>
          </h2>
        </div>
        <SignLanguageBox transcript={transcript} />
      </div>

      {/* ===== Sound Monitor + Road Safety Row ===== */}
      <div className="sound-row">
        <div className="sound-card">
          <h3 className="card-title-simple">
            <span>🔊</span> Sound Monitor
          </h3>
          <VisualAlert 
            isLoud={isLoud && emergencyNotificationsEnabled} 
            soundType={soundType} 
            volume={volume}
            threshold={threshold} 
            onThresholdChange={setThreshold} 
            soundHistory={soundHistory}
          />
        </div>
        
        <div className="sound-card">
          <h3 className="card-title-simple">
            <span>📊</span> Sound Wave & History
          </h3>
          <SoundVisualizer volume={volume} isLoud={isLoud} soundType={soundType} />
          <SoundHistory soundHistory={soundHistory.slice(0, 5)} />
        </div>
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