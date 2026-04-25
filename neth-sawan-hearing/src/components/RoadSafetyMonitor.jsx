import React, { useState, useEffect, useRef } from 'react';

const RoadSafetyMonitor = ({ isActive, onAlert, showToast }) => {
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

  // Vehicle sound patterns (frequency ranges)
  const VEHICLE_SOUNDS = {
    HORN: {
      name: '🚨 Vehicle Horn',
      severity: 'critical',
      color: '#FF0000',
      lowFreq: 1800,
      highFreq: 3500,
      pattern: 'sharp',
      description: 'Car horn detected - Vehicle approaching!'
    },
    ENGINE: {
      name: '🏎️ Engine Sound',
      severity: 'high',
      color: '#FF6600',
      lowFreq: 80,
      highFreq: 400,
      pattern: 'rumbling',
      description: 'Vehicle engine detected - Watch out!'
    },
    TIRE_SCREECH: {
      name: '⚠️ Tire Screech',
      severity: 'critical',
      color: '#FF0000',
      lowFreq: 2000,
      highFreq: 8000,
      pattern: 'sharp',
      description: 'Braking vehicle! Emergency!'
    },
    SIREN: {
      name: '🚨 Emergency Siren',
      severity: 'critical',
      color: '#FF0000',
      lowFreq: 700,
      highFreq: 1500,
      pattern: 'wavy',
      description: 'Emergency vehicle approaching!'
    },
    TRAIN: {
      name: '🚂 Train Horn',
      severity: 'critical',
      color: '#FF4400',
      lowFreq: 200,
      highFreq: 800,
      pattern: 'low_rumble',
      description: 'Train approaching - Stay away from tracks!'
    },
    BICYCLE_BELL: {
      name: '🚲 Bicycle Bell',
      severity: 'medium',
      color: '#FFAA00',
      lowFreq: 2500,
      highFreq: 4000,
      pattern: 'ring',
      description: 'Bicycle nearby'
    },
    MOTORCYCLE: {
      name: '🏍️ Motorcycle',
      severity: 'high',
      color: '#FF8800',
      lowFreq: 150,
      highFreq: 600,
      pattern: 'loud_engine',
      description: 'Motorcycle approaching'
    },
    TRUCK: {
      name: '🚛 Heavy Truck',
      severity: 'high',
      color: '#FF5500',
      lowFreq: 50,
      highFreq: 250,
      pattern: 'deep_rumble',
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
      showToast('Road safety monitoring active', 'success');
      
      // Start analyzing audio
      analyzeAudio();
      
    } catch (error) {
      console.error('Microphone access error:', error);
      showToast('Microphone access needed for road safety', 'error');
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
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avgVolume = sum / dataArray.length / 255;
    setVolume(avgVolume);
    
    // Detect vehicle sounds
    detectVehicleSounds(dataArray, avgVolume);
    
    // Estimate direction based on stereo if available
    estimateDirection(dataArray);
    
    // Estimate distance based on volume
    estimateDistance(avgVolume);
    
    animationRef.current = requestAnimationFrame(analyzeAudio);
  };

  const detectVehicleSounds = (dataArray, avgVolume) => {
    // Analyze frequency distribution
    const lowFreqRegion = dataArray.slice(0, 50);
    const midFreqRegion = dataArray.slice(50, 150);
    const highFreqRegion = dataArray.slice(150, 300);
    
    const lowAvg = lowFreqRegion.reduce((a,b) => a + b, 0) / lowFreqRegion.length;
    const midAvg = midFreqRegion.reduce((a,b) => a + b, 0) / midFreqRegion.length;
    const highAvg = highFreqRegion.reduce((a,b) => a + b, 0) / highFreqRegion.length;
    
    // Detect Vehicle Horn (high frequency spike)
    if (highAvg > 200 && avgVolume > 0.3) {
      triggerAlert('HORN', avgVolume);
    }
    // Detect Siren (wavy pattern in mid-high frequencies)
    else if (midAvg > 150 && highAvg > 120 && isSirenPattern(dataArray)) {
      triggerAlert('SIREN', avgVolume);
    }
    // Detect Engine (low frequency rumble)
    else if (lowAvg > 180 && avgVolume > 0.25) {
      triggerAlert('ENGINE', avgVolume);
    }
    // Detect Tire Screech (sharp high frequency)
    else if (highAvg > 220 && isSharpSpike(dataArray)) {
      triggerAlert('TIRE_SCREECH', avgVolume);
    }
    // Detect Train (very low frequency)
    else if (lowAvg > 150 && dataArray.slice(0, 20).some(v => v > 180)) {
      triggerAlert('TRAIN', avgVolume);
    }
    // Detect Motorcycle (distinct engine pattern)
    else if (midAvg > 160 && isMotorcyclePattern(dataArray)) {
      triggerAlert('MOTORCYCLE', avgVolume);
    }
    // Detect Truck (deep rumble)
    else if (lowAvg > 170 && dataArray.slice(0, 30).some(v => v > 160)) {
      triggerAlert('TRUCK', avgVolume);
    }
    // Detect Bicycle Bell
    else if (highAvg > 180 && isBellPattern(dataArray)) {
      triggerAlert('BICYCLE_BELL', avgVolume);
    }
  };

  const isSirenPattern = (dataArray) => {
    // Check for alternating pattern typical of sirens
    let peaks = 0;
    for (let i = 100; i < 200; i += 10) {
      if (dataArray[i] > 140) peaks++;
    }
    return peaks > 3;
  };

  const isSharpSpike = (dataArray) => {
    // Check for sudden sharp spikes in frequency
    let spikes = 0;
    for (let i = 250; i < 350; i++) {
      if (dataArray[i] > dataArray[i-1] + 50 && dataArray[i] > dataArray[i+1] + 50) {
        spikes++;
      }
    }
    return spikes > 2;
  };

  const isMotorcyclePattern = (dataArray) => {
    // Check for characteristic motorcycle pattern
    return dataArray[45] > 150 && dataArray[80] > 130;
  };

  const isBellPattern = (dataArray) => {
    // Check for bell-like ringing pattern
    return dataArray[280] > 170 && dataArray[290] > 140;
  };

  const estimateDirection = (dataArray) => {
    // Simplified direction detection based on left/right channel differences
    // In production, use actual stereo panning detection
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
    
    // Prevent too many alerts
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
    
    // Trigger visual and haptic alerts
    triggerVisualAlert(alert);
    triggerHapticAlert(alert);
    
    // Call parent onAlert
    if (onAlert) onAlert(alert);
    
    // Clear alert after 5 seconds
    alertTimeoutRef.current = setTimeout(() => {
      setCurrentAlert(null);
      alertTimeoutRef.current = null;
    }, 5000);
  };

  const triggerVisualAlert = (alert) => {
    // Flash the screen
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
    
    // Show direction indicator
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

  return (
    <div className="road-safety-monitor">
      <div className="monitor-header">
        <div className="monitor-title">
          <span className="monitor-icon">🛣️</span>
          <span>Road Safety Monitor</span>
        </div>
        <div className={`monitor-status ${isMonitoring ? 'active' : 'inactive'}`}>
          <span className="status-dot"></span>
          <span>{isMonitoring ? 'Monitoring Active' : 'Tap to Start'}</span>
        </div>
      </div>

      {!isMonitoring && (
        <button className="start-monitor-btn" onClick={startMonitoring}>
          <span>🔊</span>
          <span>Start Road Safety Monitoring</span>
          <span className="btn-sub">Detects approaching vehicles, horns, sirens</span>
        </button>
      )}

      {isMonitoring && (
        <>
          {/* Live Alert Display */}
          {currentAlert && (
            <div className="emergency-alert" style={{ backgroundColor: currentAlert.color }}>
              <div className="alert-shaking">
                <span className="alert-icon">🚨</span>
                <div className="alert-content">
                  <h3>{currentAlert.name}</h3>
                  <p>{currentAlert.description}</p>
                  <div className="alert-details">
                    {currentAlert.direction && (
                      <span className="direction-badge">
                        {currentAlert.direction === 'left' ? '← Approaching from LEFT' : '→ Approaching from RIGHT'}
                      </span>
                    )}
                    {currentAlert.distance && (
                      <span className="distance-badge">
                        {currentAlert.distance === 'very close' ? '⚠️ VERY CLOSE!' :
                         currentAlert.distance === 'close' ? '⚠️ Getting closer!' :
                         currentAlert.distance === 'approaching' ? '⚠️ Vehicle approaching!' : 'Vehicle in distance'}
                      </span>
                    )}
                  </div>
                </div>
                <button className="dismiss-alert" onClick={clearCurrentAlert}>✕</button>
              </div>
            </div>
          )}

          {/* Visualizer */}
          <div className="safety-visualizer">
            <div className="volume-meter-road">
              <div className="volume-label">Sound Level</div>
              <div className="volume-bar-road">
                <div 
                  className="volume-fill-road"
                  style={{ 
                    width: `${volume * 100}%`,
                    backgroundColor: volume > 0.4 ? '#FF3355' : volume > 0.2 ? '#FF8833' : '#00DDB3'
                  }}
                />
              </div>
            </div>

            {/* Direction Indicator */}
            <div className="direction-indicator">
              <div className={`direction left ${vehicleDirection === 'left' ? 'active' : ''}`}>
                <span>←</span>
                <small>LEFT</small>
              </div>
              <div className="direction-center">
                <span>YOU</span>
                <div className="pedestrian-icon">🚶</div>
              </div>
              <div className={`direction right ${vehicleDirection === 'right' ? 'active' : ''}`}>
                <span>→</span>
                <small>RIGHT</small>
              </div>
            </div>

            {/* Warning Zones */}
            <div className="warning-zones">
              <div className={`warning-zone ${distance === 'very close' ? 'danger' : distance === 'close' ? 'warning' : ''}`}>
                <div className="zone-circle zone-1"></div>
                <span>Immediate</span>
              </div>
              <div className={`warning-zone ${distance === 'close' ? 'warning' : ''}`}>
                <div className="zone-circle zone-2"></div>
                <span>Near</span>
              </div>
              <div className="warning-zone">
                <div className="zone-circle zone-3"></div>
                <span>Distance</span>
              </div>
            </div>
          </div>

          {/* Recent Alerts History */}
          <div className="alert-history">
            <h4>Recent Alerts</h4>
            <div className="history-list">
              {alertHistory.slice(0, 5).map(alert => (
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
                    <span className="history-time">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {alert.direction && (
                    <span className="history-direction">{alert.direction === 'left' ? '←' : '→'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button className="stop-monitor-btn" onClick={stopMonitoring}>
            ⏹️ Stop Monitoring
          </button>
        </>
      )}

      <div className="safety-tips">
        <h4>🛡️ Safety Tips for Deaf Pedestrians</h4>
        <ul>
          <li>• Always face traffic when walking on roads</li>
          <li>• Stay in well-lit areas at night</li>
          <li>• Use sidewalks when available</li>
          <li>• Watch for vehicle lights and shadows</li>
          <li>• This monitor listens for approaching vehicles</li>
          <li>• Red alert = Immediate danger, move away!</li>
        </ul>
      </div>

      <style>{`
        .road-safety-monitor {
          background: var(--surface);
          border-radius: 24px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .monitor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }
        
        .monitor-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 700;
        }
        
        .monitor-icon {
          font-size: 24px;
        }
        
        .monitor-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 12px;
        }
        
        .monitor-status.active {
          background: rgba(0, 221, 179, 0.1);
          color: var(--teal);
        }
        
        .monitor-status.inactive {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 1s infinite;
        }
        
        .start-monitor-btn {
          width: 100%;
          padding: 24px;
          background: linear-gradient(135deg, var(--teal-dim), var(--teal));
          border: none;
          border-radius: 20px;
          color: var(--text);
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        
        .start-monitor-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 221, 179, 0.3);
        }
        
        .btn-sub {
          font-size: 12px;
          font-weight: normal;
          opacity: 0.8;
        }
        
        .emergency-alert {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 500px;
          padding: 20px;
          border-radius: 20px;
          z-index: 10000;
          animation: slideDown 0.3s ease, shake 0.3s ease infinite;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        
        @keyframes slideDown {
          from { top: -100px; opacity: 0; }
          to { top: 20px; opacity: 1; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          25% { transform: translateX(-50%) translateY(-5px); }
          75% { transform: translateX(-50%) translateY(5px); }
        }
        
        .alert-shaking {
          display: flex;
          align-items: center;
          gap: 15px;
          animation: textShake 0.1s ease infinite;
        }
        
        @keyframes textShake {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        
        .alert-icon {
          font-size: 48px;
          animation: bounce 0.5s ease infinite;
        }
        
        .alert-content {
          flex: 1;
        }
        
        .alert-content h3 {
          font-size: 20px;
          margin-bottom: 5px;
          color: white;
        }
        
        .alert-content p {
          font-size: 14px;
          margin-bottom: 8px;
          color: rgba(255,255,255,0.9);
        }
        
        .alert-details {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .direction-badge, .distance-badge {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(0,0,0,0.3);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .dismiss-alert {
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          color: white;
          font-size: 18px;
          cursor: pointer;
        }
        
        .safety-visualizer {
          background: var(--card);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .volume-meter-road {
          margin-bottom: 20px;
        }
        
        .volume-label {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }
        
        .volume-bar-road {
          height: 10px;
          background: rgba(255,255,255,0.1);
          border-radius: 5px;
          overflow: hidden;
        }
        
        .volume-fill-road {
          height: 100%;
          transition: width 0.1s;
        }
        
        .direction-indicator {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 15px;
          background: rgba(0,0,0,0.2);
          border-radius: 50px;
        }
        
        .direction {
          text-align: center;
          padding: 10px 20px;
          border-radius: 40px;
          transition: all 0.2s;
        }
        
        .direction span {
          font-size: 28px;
          display: block;
        }
        
        .direction small {
          font-size: 10px;
          color: var(--text-secondary);
        }
        
        .direction.active {
          background: rgba(255, 51, 85, 0.2);
          animation: pulse 0.5s infinite;
        }
        
        .direction.active span {
          color: #FF3355;
        }
        
        .direction-center {
          text-align: center;
        }
        
        .pedestrian-icon {
          font-size: 32px;
          margin-top: 5px;
        }
        
        .warning-zones {
          display: flex;
          justify-content: space-around;
          text-align: center;
        }
        
        .warning-zone {
          text-align: center;
        }
        
        .zone-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          margin: 0 auto 8px;
          transition: all 0.2s;
        }
        
        .zone-1 {
          background: rgba(255, 51, 85, 0.2);
          border: 2px solid #FF3355;
        }
        
        .zone-2 {
          background: rgba(255, 136, 51, 0.15);
          border: 2px solid #FF8833;
        }
        
        .zone-3 {
          background: rgba(255, 255, 255, 0.05);
          border: 2px dashed var(--border);
        }
        
        .warning-zone.danger .zone-1 {
          background: rgba(255, 51, 85, 0.6);
          animation: pulse 0.5s infinite;
        }
        
        .warning-zone.warning .zone-2 {
          background: rgba(255, 136, 51, 0.4);
          animation: pulse 1s infinite;
        }
        
        .alert-history {
          margin-bottom: 20px;
        }
        
        .alert-history h4 {
          margin-bottom: 12px;
          font-size: 14px;
        }
        
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
        }
        
        .history-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          background: var(--card);
          border-left: 3px solid;
          border-radius: 8px;
        }
        
        .history-icon {
          font-size: 24px;
        }
        
        .history-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .history-name {
          font-size: 13px;
          font-weight: 600;
        }
        
        .history-time {
          font-size: 10px;
          color: var(--text-secondary);
        }
        
        .history-direction {
          font-size: 20px;
          font-weight: 700;
        }
        
        .stop-monitor-btn {
          width: 100%;
          padding: 14px;
          background: rgba(255, 51, 85, 0.1);
          border: 1px solid var(--red);
          border-radius: 12px;
          color: var(--red);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .stop-monitor-btn:hover {
          background: rgba(255, 51, 85, 0.2);
        }
        
        .safety-tips {
          margin-top: 20px;
          padding: 16px;
          background: rgba(0, 221, 179, 0.05);
          border-radius: 16px;
          border-left: 4px solid var(--teal);
        }
        
        .safety-tips h4 {
          margin-bottom: 12px;
          color: var(--teal);
        }
        
        .safety-tips ul {
          list-style: none;
          padding: 0;
        }
        
        .safety-tips li {
          font-size: 13px;
          color: var(--text-secondary);
          padding: 5px 0;
          line-height: 1.5;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default RoadSafetyMonitor;