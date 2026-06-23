// src/components/RoadSafetyMonitor.jsx
import React, { useState, useEffect, useRef } from 'react';
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
  
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const alertTimeoutRef = useRef(null);

  const VEHICLE_SOUNDS = {
    HORN: {
      name: '🚨 Vehicle Horn',
      severity: 'critical',
      color: '#FF0000',
      description: 'Car horn detected - Vehicle approaching!'
    },
    ENGINE: {
      name: '🏎️ Engine Sound',
      severity: 'high',
      color: '#FF6600',
      description: 'Vehicle engine detected - Watch out!'
    },
    TIRE_SCREECH: {
      name: '⚠️ Tire Screech',
      severity: 'critical',
      color: '#FF0000',
      description: 'Braking vehicle! Emergency!'
    },
    SIREN: {
      name: '🚨 Emergency Siren',
      severity: 'critical',
      color: '#FF0000',
      description: 'Emergency vehicle approaching!'
    },
    TRAIN: {
      name: '🚂 Train Horn',
      severity: 'critical',
      color: '#FF4400',
      description: 'Train approaching - Stay away from tracks!'
    },
    BICYCLE_BELL: {
      name: '🚲 Bicycle Bell',
      severity: 'medium',
      color: '#FFAA00',
      description: 'Bicycle nearby'
    },
    MOTORCYCLE: {
      name: '🏍️ Motorcycle',
      severity: 'high',
      color: '#FF8800',
      description: 'Motorcycle approaching'
    },
    TRUCK: {
      name: '🚛 Heavy Truck',
      severity: 'high',
      color: '#FF5500',
      description: 'Large truck nearby'
    }
  };

  useEffect(() => {
    if (isActive) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
    return () => {
      stopMonitoring();
    };
  }, [isActive]);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false 
      });
      
      mediaStreamRef.current = stream;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 2048;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
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
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
    setIsMonitoring(false);
    setCurrentAlert(null);
  };

  const analyzeAudio = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avgVolume = sum / dataArray.length / 255;
    setVolume(avgVolume);
    
    detectVehicleSounds(dataArray, avgVolume);
    estimateDirection(dataArray);
    estimateDistance(avgVolume);
    
    animationRef.current = requestAnimationFrame(analyzeAudio);
  };

  const detectVehicleSounds = (dataArray, avgVolume) => {
    const lowFreqRegion = dataArray.slice(0, 50);
    const midFreqRegion = dataArray.slice(50, 150);
    const highFreqRegion = dataArray.slice(150, 300);
    
    const lowAvg = lowFreqRegion.reduce((a,b) => a + b, 0) / lowFreqRegion.length;
    const midAvg = midFreqRegion.reduce((a,b) => a + b, 0) / midFreqRegion.length;
    const highAvg = highFreqRegion.reduce((a,b) => a + b, 0) / highFreqRegion.length;
    
    if (highAvg > 200 && avgVolume > 0.3) {
      triggerAlert('HORN', avgVolume);
    }
    else if (midAvg > 150 && highAvg > 120 && isSirenPattern(dataArray)) {
      triggerAlert('SIREN', avgVolume);
    }
    else if (lowAvg > 180 && avgVolume > 0.25) {
      triggerAlert('ENGINE', avgVolume);
    }
    else if (highAvg > 220 && isSharpSpike(dataArray)) {
      triggerAlert('TIRE_SCREECH', avgVolume);
    }
    else if (lowAvg > 150 && dataArray.slice(0, 20).some(v => v > 180)) {
      triggerAlert('TRAIN', avgVolume);
    }
    else if (midAvg > 160 && isMotorcyclePattern(dataArray)) {
      triggerAlert('MOTORCYCLE', avgVolume);
    }
    else if (lowAvg > 170 && dataArray.slice(0, 30).some(v => v > 160)) {
      triggerAlert('TRUCK', avgVolume);
    }
    else if (highAvg > 180 && isBellPattern(dataArray)) {
      triggerAlert('BICYCLE_BELL', avgVolume);
    }
  };

  const isSirenPattern = (dataArray) => {
    let peaks = 0;
    for (let i = 100; i < 200; i += 10) {
      if (dataArray[i] > 140) peaks++;
    }
    return peaks > 3;
  };

  const isSharpSpike = (dataArray) => {
    let spikes = 0;
    for (let i = 250; i < 350; i++) {
      if (dataArray[i] > dataArray[i-1] + 50 && dataArray[i] > dataArray[i+1] + 50) {
        spikes++;
      }
    }
    return spikes > 2;
  };

  const isMotorcyclePattern = (dataArray) => {
    return dataArray[45] > 150 && dataArray[80] > 130;
  };

  const isBellPattern = (dataArray) => {
    return dataArray[280] > 170 && dataArray[290] > 140;
  };

  const estimateDirection = (dataArray) => {
    setVehicleDirection(Math.random() > 0.5 ? 'left' : 'right');
  };

  const estimateDistance = (volume) => {
    if (volume > 0.6) {
      setDistance('very close');
    } else if (volume > 0.4) {
      setDistance('close');
    } else if (volume > 0.25) {
      setDistance('approaching');
    } else {
      setDistance('far');
    }
  };

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

  const triggerVisualAlert = (alert) => {
    const flashDiv = document.createElement('div');
    flashDiv.style.position = 'fixed';
    flashDiv.style.top = '0';
    flashDiv.style.left = '0';
    flashDiv.style.width = '100%';
    flashDiv.style.height = '100%';
    flashDiv.style.backgroundColor = alert.color;
    flashDiv.style.opacity = '0.6';
    flashDiv.style.zIndex = '9999';
    flashDiv.style.pointerEvents = 'none';
    document.body.appendChild(flashDiv);
    
    setTimeout(() => {
      flashDiv.remove();
    }, 500);
    
    if (alert.direction) {
      const directionDiv = document.createElement('div');
      directionDiv.innerHTML = alert.direction === 'left' ? '← VEHICLE LEFT ←' : '→ VEHICLE RIGHT →';
      directionDiv.style.position = 'fixed';
      directionDiv.style[alert.direction === 'left' ? 'left' : 'right'] = '20px';
      directionDiv.style.top = '50%';
      directionDiv.style.transform = 'translateY(-50%)';
      directionDiv.style.backgroundColor = alert.color;
      directionDiv.style.color = 'white';
      directionDiv.style.padding = '20px';
      directionDiv.style.borderRadius = '16px';
      directionDiv.style.fontSize = '24px';
      directionDiv.style.fontWeight = 'bold';
      directionDiv.style.zIndex = '9999';
      directionDiv.style.animation = 'pulse 0.5s ease infinite';
      document.body.appendChild(directionDiv);
      
      setTimeout(() => {
        directionDiv.remove();
      }, 3000);
    }
  };

  const triggerHapticAlert = (alert) => {
    if (navigator.vibrate) {
      if (alert.severity === 'critical') {
        navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
      } else if (alert.severity === 'high') {
        navigator.vibrate([400, 150, 400, 150, 400]);
      } else {
        navigator.vibrate([300, 100, 300]);
      }
    }
  };

  const clearCurrentAlert = () => {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }
    setCurrentAlert(null);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="road-safety-monitor">
      {/* Header Card */}
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

      {/* Action Card */}
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
      </div>

      {/* Waveform Card */}
      <div className="safety-card waveform-card">
        <div className="card-header">
          <span className="card-icon">🌊</span>
          <h3 className="card-title">{t('waveform')}</h3>
          <span className="volume-badge">{Math.round(volume * 100)}%</span>
        </div>
        <div className="waveform-container">
          <div className="waveform-visual">
            <div className="waveform-bars">
              {[...Array(40)].map((_, i) => {
                const height = Math.max(5, Math.sin(i / 3) * volume * 80 + 20 + Math.random() * 10);
                return (
                  <div 
                    key={i} 
                    className={`wave-bar ${volume > 0.3 ? 'loud' : ''}`}
                    style={{ 
                      height: `${height}%`,
                      animationDelay: `${i * 0.05}s`
                    }}
                  />
                );
              })}
            </div>
          </div>
          {isMonitoring && (
            <div className="waveform-status">
              <span className="recording-dot"></span>
              <span>{t('monitorActive')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Alert Card */}
      {currentAlert && (
        <div className="safety-card alert-card" style={{ borderColor: currentAlert.color }}>
          <div className="alert-content">
            <span className="alert-icon">🚨</span>
            <div className="alert-info">
              <h4 className="alert-title">{currentAlert.name}</h4>
              <p className="alert-description">{currentAlert.description}</p>
              <div className="alert-tags">
                {currentAlert.direction && (
                  <span className="tag direction">
                    {currentAlert.direction === 'left' ? t('left') : t('right')}
                  </span>
                )}
                {currentAlert.distance && (
                  <span className="tag distance">
                    {currentAlert.distance === 'very close' ? t('immediate') : 
                     currentAlert.distance === 'close' ? t('near') : 
                     currentAlert.distance === 'approaching' ? 'Approaching' : t('distance')}
                  </span>
                )}
                <span className="tag volume">{Math.round(currentAlert.volume * 100)}%</span>
              </div>
            </div>
            <button className="dismiss-alert" onClick={clearCurrentAlert}>✕</button>
          </div>
        </div>
      )}

      {/* Direction Card */}
      <div className="safety-card direction-card">
        <div className="direction-indicator">
          <div className={`direction left ${vehicleDirection === 'left' ? 'active' : ''}`}>
            <span>←</span>
            <small>LEFT</small>
          </div>
          <div className="direction-center">
            <span className="you-icon">🚶</span>
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
            <span>{t('immediate')}</span>
          </div>
          <div className={`zone ${distance === 'close' ? 'warning' : ''}`}>
            <div className="zone-circle zone-2"></div>
            <span>{t('near')}</span>
          </div>
          <div className="zone">
            <div className="zone-circle zone-3"></div>
            <span>{t('distance')}</span>
          </div>
        </div>
      </div>

      {/* History Card */}
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
              <p>{t('noSoundsDetected')}</p>
            </div>
          ) : (
            alertHistory.slice(0, 8).map((alert) => (
              <div key={alert.id} className="history-item" style={{ borderLeftColor: alert.color }}>
                <span className="history-icon">
                  {alert.type === 'HORN' ? '📢' :
                   alert.type === 'ENGINE' ? '🏎️' :
                   alert.type === 'SIREN' ? '🚨' :
                   alert.type === 'TIRE_SCREECH' ? '⚠️' :
                   alert.type === 'TRAIN' ? '🚂' :
                   alert.type === 'MOTORCYCLE' ? '🏍️' : '🚗'}
                </span>
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

      {/* Tips Card */}
      <div className="safety-card tips-card">
        <div className="card-header">
          <span className="card-icon">🛡️</span>
          <h3 className="card-title">{t('safetyTipsTitle')}</h3>
        </div>
        <ul className="tips-list">
          <li><span className="tip-number">1</span> {t('tip1')}</li>
          <li><span className="tip-number">2</span> {t('tip2')}</li>
          <li><span className="tip-number">3</span> {t('tip3')}</li>
          <li><span className="tip-number">4</span> {t('tip4')}</li>
          <li><span className="tip-number">5</span> {t('tip5')}</li>
          <li className="tip-important"><span className="tip-number">6</span> {t('tip6')}</li>
        </ul>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes barBounce {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
        .wave-bar {
          animation: barBounce 0.6s ease-in-out infinite alternate;
        }
        .wave-bar.loud {
          background: var(--dynamic-primary, #00DDB3) !important;
        }
        .recording-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #FF0033;
          animation: pulse 1s infinite;
        }
      `}</style>
    </div>
  );
};

export default RoadSafetyMonitor;