// src/components/RoadSafetyMonitor.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './RoadSafetyMonitor.css';

const RoadSafetyMonitor = ({ isActive, onAlert, showToast }) => {
  const { t } = useLanguage();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [alertHistory, setAlertHistory] = useState([]);
  const [vehicleDirection, setVehicleDirection] = useState(null);
  const [distance, setDistance] = useState(null);
  const [volume, setVolume] = useState(0);
  const [frequencyData, setFrequencyData] = useState({ low: 0, mid: 0, high: 0 });
  const [sensitivity, setSensitivity] = useState(0.25); // 0.1 – 0.5

  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const alertTimeoutRef = useRef(null);
  const stereoDataRef = useRef(null);

  // Advanced sound classification with frequency band analysis
  const VEHICLE_SOUNDS = {
    HORN: {
      name: '🚨 Vehicle Horn',
      severity: 'critical',
      color: '#FF0033',
      description: 'Car horn – vehicle approaching!',
      icon: '📢'
    },
    ENGINE: {
      name: '🏎️ Engine Sound',
      severity: 'high',
      color: '#FF6600',
      description: 'Vehicle engine – watch out!',
      icon: '🔊'
    },
    TIRE_SCREECH: {
      name: '⚠️ Tire Screech',
      severity: 'critical',
      color: '#FF0033',
      description: 'Braking vehicle – emergency!',
      icon: '🚨'
    },
    SIREN: {
      name: '🚨 Emergency Siren',
      severity: 'critical',
      color: '#FF0033',
      description: 'Emergency vehicle approaching!',
      icon: '🚨'
    },
    TRAIN: {
      name: '🚂 Train Horn',
      severity: 'critical',
      color: '#FF4400',
      description: 'Train approaching – stay away from tracks!',
      icon: '🚂'
    },
    BICYCLE_BELL: {
      name: '🔔 Bicycle Bell',
      severity: 'medium',
      color: '#FFAA00',
      description: 'Bicycle nearby',
      icon: '🚲'
    },
    MOTORCYCLE: {
      name: '🏍️ Motorcycle',
      severity: 'high',
      color: '#FF8800',
      description: 'Motorcycle approaching',
      icon: '🏍️'
    },
    TRUCK: {
      name: '🚛 Heavy Truck',
      severity: 'high',
      color: '#FF5500',
      description: 'Large truck nearby',
      icon: '🚛'
    }
  };

  // ── Start / Stop ──
  useEffect(() => {
    if (isActive) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
    return () => stopMonitoring();
  }, [isActive]);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      mediaStreamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // For stereo panning (direction)
      const splitter = audioContext.createChannelSplitter(2);
      source.connect(splitter);

      const leftAnalyser = audioContext.createAnalyser();
      leftAnalyser.fftSize = 1024;
      const rightAnalyser = audioContext.createAnalyser();
      rightAnalyser.fftSize = 1024;
      splitter.connect(leftAnalyser, 0);
      splitter.connect(rightAnalyser, 1);
      stereoDataRef.current = { leftAnalyser, rightAnalyser };

      await audioContext.resume();

      setIsMonitoring(true);
      if (showToast) showToast(t('monitorActive'), 'success');

      analyzeAudio();
    } catch (error) {
      console.error('Microphone access error:', error);
      if (showToast) showToast(t('microphoneRequired'), 'error');
    }
  };

  const stopMonitoring = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setIsMonitoring(false);
    setCurrentAlert(null);
    setVehicleDirection(null);
    setDistance(null);
    setFrequencyData({ low: 0, mid: 0, high: 0 });
  };

  // ── Audio Analysis Loop ──
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Overall volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
    const avgVolume = sum / dataArray.length / 255;
    setVolume(avgVolume);

    // Frequency bands for visual
    const lowBand = dataArray.slice(0, 80);
    const midBand = dataArray.slice(80, 200);
    const highBand = dataArray.slice(200, 400);
    const lowAvg = lowBand.reduce((a,b) => a + b, 0) / lowBand.length / 255;
    const midAvg = midBand.reduce((a,b) => a + b, 0) / midBand.length / 255;
    const highAvg = highBand.reduce((a,b) => a + b, 0) / highBand.length / 255;
    setFrequencyData({ low: lowAvg, mid: midAvg, high: highAvg });

    // Direction from stereo
    estimateDirection();

    // Detect vehicle sounds
    detectVehicleSounds(dataArray, avgVolume);
    estimateDistance(avgVolume);

    animationRef.current = requestAnimationFrame(analyzeAudio);
  }, []);

  // ── Direction Estimation (stereo panning) ──
  const estimateDirection = () => {
    if (!stereoDataRef.current) return;
    const { leftAnalyser, rightAnalyser } = stereoDataRef.current;
    const leftData = new Uint8Array(leftAnalyser.frequencyBinCount);
    const rightData = new Uint8Array(rightAnalyser.frequencyBinCount);
    leftAnalyser.getByteFrequencyData(leftData);
    rightAnalyser.getByteFrequencyData(rightData);

    const leftSum = leftData.reduce((a,b) => a + b, 0);
    const rightSum = rightData.reduce((a,b) => a + b, 0);
    const diff = leftSum - rightSum;
    const threshold = 50; // sensitivity
    if (Math.abs(diff) > threshold) {
      setVehicleDirection(diff > 0 ? 'left' : 'right');
    } else {
      setVehicleDirection(null);
    }
  };

  // ── Detection Logic ──
  const detectVehicleSounds = (dataArray, avgVolume) => {
    const lowAvg = dataArray.slice(0, 80).reduce((a,b) => a + b, 0) / 80;
    const midAvg = dataArray.slice(80, 200).reduce((a,b) => a + b, 0) / 120;
    const highAvg = dataArray.slice(200, 400).reduce((a,b) => a + b, 0) / 200;

    // Normalize to 0-1
    const normLow = lowAvg / 255;
    const normMid = midAvg / 255;
    const normHigh = highAvg / 255;

    // Sensitivity threshold applied
    const threshold = sensitivity;

    if (normHigh > 0.7 && avgVolume > threshold) {
      triggerAlert('HORN', avgVolume);
    }
    else if (normMid > 0.6 && normHigh > 0.5 && isSirenPattern(dataArray)) {
      triggerAlert('SIREN', avgVolume);
    }
    else if (normLow > 0.7 && avgVolume > threshold * 1.2) {
      triggerAlert('ENGINE', avgVolume);
    }
    else if (normHigh > 0.8 && isSharpSpike(dataArray)) {
      triggerAlert('TIRE_SCREECH', avgVolume);
    }
    else if (normLow > 0.6 && dataArray.slice(0, 30).some(v => v > 200)) {
      triggerAlert('TRAIN', avgVolume);
    }
    else if (normMid > 0.65 && isMotorcyclePattern(dataArray)) {
      triggerAlert('MOTORCYCLE', avgVolume);
    }
    else if (normLow > 0.65 && dataArray.slice(0, 40).some(v => v > 180)) {
      triggerAlert('TRUCK', avgVolume);
    }
    else if (normHigh > 0.7 && isBellPattern(dataArray)) {
      triggerAlert('BICYCLE_BELL', avgVolume);
    }
  };

  // Helper patterns
  const isSirenPattern = (data) => {
    let peaks = 0;
    for (let i = 120; i < 220; i += 15) {
      if (data[i] > 150) peaks++;
    }
    return peaks > 4;
  };

  const isSharpSpike = (data) => {
    let spikes = 0;
    for (let i = 280; i < 380; i++) {
      if (data[i] > data[i-1] + 60 && data[i] > data[i+1] + 60) spikes++;
    }
    return spikes > 3;
  };

  const isMotorcyclePattern = (data) => {
    return data[50] > 160 && data[90] > 140;
  };

  const isBellPattern = (data) => {
    return data[300] > 180 && data[320] > 150;
  };

  const estimateDistance = (vol) => {
    if (vol > 0.6) setDistance('very close');
    else if (vol > 0.4) setDistance('close');
    else if (vol > 0.25) setDistance('approaching');
    else setDistance('far');
  };

  // ── Trigger Alert ──
  const triggerAlert = (soundType, volumeLevel) => {
    const vehicleSound = VEHICLE_SOUNDS[soundType];
    if (!vehicleSound) return;
    if (alertTimeoutRef.current) return;

    const alert = {
      id: Date.now(),
      type: soundType,
      name: vehicleSound.name,
      severity: vehicleSound.severity,
      color: vehicleSound.color,
      description: vehicleSound.description,
      icon: vehicleSound.icon,
      distance: distance,
      direction: vehicleDirection,
      volume: volumeLevel,
      timestamp: new Date()
    };

    setCurrentAlert(alert);
    setAlertHistory(prev => [alert, ...prev].slice(0, 20));

    triggerVisualAlert(alert);
    triggerHapticAlert(alert);

    if (onAlert) onAlert(alert);

    alertTimeoutRef.current = setTimeout(() => {
      setCurrentAlert(null);
      alertTimeoutRef.current = null;
    }, 5000);
  };

  // ── Visual & Haptic Feedback ──
  const triggerVisualAlert = (alert) => {
    // Flash overlay
    const flashDiv = document.createElement('div');
    flashDiv.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: ${alert.color}; opacity: 0.5; z-index: 9999;
      pointer-events: none; transition: opacity 0.3s;
    `;
    document.body.appendChild(flashDiv);
    setTimeout(() => flashDiv.remove(), 500);

    // Direction arrow banner
    if (alert.direction) {
      const dirDiv = document.createElement('div');
      const arrow = alert.direction === 'left' ? '◀' : '▶';
      dirDiv.innerHTML = `${arrow} ${alert.direction.toUpperCase()} ${arrow}`;
      dirDiv.style.cssText = `
        position: fixed; top: 50%; transform: translateY(-50%);
        ${alert.direction === 'left' ? 'left: 20px;' : 'right: 20px;'}
        background: ${alert.color}; color: white; padding: 20px 24px;
        border-radius: 16px; font-size: 28px; font-weight: 900;
        z-index: 9999; box-shadow: 0 0 40px rgba(0,0,0,0.5);
        animation: dirFlash 0.5s ease infinite alternate;
      `;
      document.head.insertAdjacentHTML('beforeend', `
        <style>
          @keyframes dirFlash {
            0% { opacity: 0.6; transform: translateY(-50%) scale(0.95); }
            100% { opacity: 1; transform: translateY(-50%) scale(1.05); }
          }
        </style>
      `);
      document.body.appendChild(dirDiv);
      setTimeout(() => dirDiv.remove(), 3000);
    }
  };

  const triggerHapticAlert = (alert) => {
    if (!navigator.vibrate) return;
    const pattern = alert.severity === 'critical' 
      ? [500, 200, 500, 200, 500, 200, 700]
      : alert.severity === 'high'
      ? [400, 150, 400, 150, 400]
      : [300, 100, 300];
    navigator.vibrate(pattern);
  };

  // ── Clear History ──
  const clearHistory = () => setAlertHistory([]);

  // ── Test Alert ──
  const simulateAlert = () => {
    triggerAlert('HORN', 0.8);
  };

  // ── Format Time ──
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="road-safety-monitor">
      {/* Header */}
      <div className="safety-card header-card">
        <div className="card-header">
          <span className="card-icon">🛣️</span>
          <h2 className="card-title">{t('roadSafetyMonitor')}</h2>
          <div className={`monitor-status ${isMonitoring ? 'active' : 'inactive'}`}>
            <span className="status-dot"></span>
            <span>{isMonitoring ? t('monitorActive') : t('monitorInactive')}</span>
          </div>
        </div>
      </div>

      {/* Action & Controls */}
      <div className="safety-card action-card">
        {!isMonitoring ? (
          <button className="start-monitor-btn" onClick={startMonitoring}>
            <span className="btn-icon">🔊</span>
            <span className="btn-text">{t('startMonitoring')}</span>
            <span className="btn-sub">{t('detectsVehicles')}</span>
          </button>
        ) : (
          <button className="stop-monitor-btn" onClick={stopMonitoring}>
            <span className="btn-icon">⏹️</span>
            <span className="btn-text">{t('stopMonitoring')}</span>
          </button>
        )}
        <div className="monitor-controls">
          <button className="test-btn" onClick={simulateAlert} disabled={!isMonitoring}>
            🔔 Alert
          </button>
          <button className="clear-btn" onClick={clearHistory} disabled={alertHistory.length === 0}>
            🗑️ Clear
          </button>
        </div>
        <div className="sensitivity-control">
          <label>🔧 Sensitivity: <span>{Math.round(sensitivity * 100)}%</span></label>
          <input
            type="range"
            min="0.1"
            max="0.5"
            step="0.01"
            value={sensitivity}
            onChange={e => setSensitivity(parseFloat(e.target.value))}
            className="sensitivity-slider"
          />
        </div>
      </div>

      {/* Spectrum Analyzer (Frequency Bands) */}
      <div className="safety-card spectrum-card">
        <div className="card-header">
          <span className="card-icon">📊</span>
          <h3 className="card-title">Frequency Spectrum</h3>
          <span className="volume-badge">{Math.round(volume * 100)}%</span>
        </div>
        <div className="spectrum-bars">
          {['low', 'mid', 'high'].map((band) => (
            <div key={band} className="spectrum-band">
              <div
                className="spectrum-fill"
                style={{
                  height: `${Math.min(frequencyData[band] * 100, 100)}%`,
                  background: band === 'low' ? '#FF6600' : band === 'mid' ? '#FFCC00' : '#00DDFF'
                }}
              />
              <span className="spectrum-label">{band}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alert Card */}
      {currentAlert && (
        <div className="safety-card alert-card" style={{ borderColor: currentAlert.color }}>
          <div className="alert-content">
            <span className="alert-icon">{currentAlert.icon}</span>
            <div className="alert-info">
              <h4 className="alert-title">{currentAlert.name}</h4>
              <p className="alert-description">{currentAlert.description}</p>
              <div className="alert-tags">
                {currentAlert.direction && (
                  <span className="tag direction">
                    {currentAlert.direction === 'left' ? '← Left' : 'Right →'}
                  </span>
                )}
                {currentAlert.distance && (
                  <span className="tag distance">
                    {currentAlert.distance === 'very close' ? '⚠️ Immediate' :
                     currentAlert.distance === 'close' ? '🔴 Near' :
                     currentAlert.distance === 'approaching' ? '🟠 Approaching' : '🟡 Far'}
                  </span>
                )}
                <span className="tag volume">{Math.round(currentAlert.volume * 100)}%</span>
              </div>
            </div>
            <button className="dismiss-alert" onClick={() => {
              if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
              setCurrentAlert(null);
            }}>✕</button>
          </div>
        </div>
      )}

      {/* Direction & Distance */}
      <div className="safety-card direction-card">
        <div className="direction-indicator">
          <div className={`direction left ${vehicleDirection === 'left' ? 'active' : ''}`}>
            <span>←</span>
            <small>LEFT</small>
          </div>
          <div className="direction-center">
            <span className="you-icon">🧍</span>
            <span className="you-label">YOU</span>
          </div>
          <div className={`direction right ${vehicleDirection === 'right' ? 'active' : ''}`}>
            <span>→</span>
            <small>RIGHT</small>
          </div>
        </div>
        <div className="warning-zones">
          <div className={`zone ${distance === 'very close' ? 'danger' : ''}`}>
            <div className="zone-circle zone-1"></div>
            <span>Immediate</span>
          </div>
          <div className={`zone ${distance === 'close' ? 'warning' : ''}`}>
            <div className="zone-circle zone-2"></div>
            <span>Near</span>
          </div>
          <div className="zone">
            <div className="zone-circle zone-3"></div>
            <span>Far</span>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="safety-card history-card">
        <div className="card-header">
          <span className="card-icon">📜</span>
          <h3 className="card-title">{t('soundHistory')}</h3>
          <span className="history-count">{alertHistory.length} events</span>
        </div>
        <div className="history-list">
          {alertHistory.length === 0 ? (
            <div className="history-empty">
              <span className="empty-icon">🔇</span>
              <p>No alerts yet. Start monitoring to detect sounds.</p>
            </div>
          ) : (
            alertHistory.slice(0, 8).map((alert) => (
              <div key={alert.id} className="history-item" style={{ borderLeftColor: alert.color }}>
                <span className="history-icon">{alert.icon}</span>
                <div className="history-info">
                  <span className="history-name">{alert.name}</span>
                  <span className="history-time">{formatTime(alert.timestamp)}</span>
                </div>
                {alert.direction && (
                  <span className="history-direction">
                    {alert.direction === 'left' ? '←' : '→'}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="safety-card tips-card">
        <div className="card-header">
          <span className="card-icon">🛡️</span>
          <h3 className="card-title">Safety Tips</h3>
        </div>
        <ul className="tips-list">
          <li><span className="tip-number">1</span> Always face traffic when walking on roads</li>
          <li><span className="tip-number">2</span> Stay in well-lit areas at night</li>
          <li><span className="tip-number">3</span> Use sidewalks when available</li>
          <li><span className="tip-number">4</span> Watch for vehicle lights and shadows</li>
          <li><span className="tip-number">5</span> This monitor listens for approaching vehicles</li>
          <li className="tip-important"><span className="tip-number">6</span> Red alert = Immediate danger, move away!</li>
        </ul>
      </div>
    </div>
  );
};

export default RoadSafetyMonitor;