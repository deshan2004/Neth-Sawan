import React from 'react';
import TranscriptBox from './TranscriptBox';
import SignLanguageBox from './SignLanguageBox';
import VisualAlert from './VisualAlert';
import { SoundHistory } from './SoundHistory';
import SoundVisualizer from './SoundVisualizer';

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
  roadSafetyActive
}) => {
  return (
    <div className="simple-dashboard">
      {/* Main unified card for live captions + sign language */}
      <div className="primary-card unified-card">
        <div className="card-header-simple">
          <h2>
            <span className="header-icon">🎤🤟</span>
            Live Captions & Sign Language
          </h2>
          {isListening && (
            <div className="live-indicator">
              <span className="live-dot"></span>
              <span>LISTENING</span>
            </div>
          )}
        </div>
        
        <TranscriptBox 
          transcript={transcript} 
          isListening={isListening} 
          startListening={startListening}
          stopListening={stopListening} 
          clearTranscript={clearTranscript} 
          error={speechError}
          browserInfo={browserInfo}
        />
        
        <div className="sign-language-section">
          <SignLanguageBox transcript={transcript} />
        </div>
      </div>

      {/* Sound monitor row */}
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

      {/* Road safety active banner */}
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