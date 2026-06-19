// src/components/FallDetector.jsx
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import './FallDetector.css';

const FallDetector = forwardRef(({ user, isGuest, showToast, onFallDetected }, ref) => {
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [permissionState, setPermissionState] = useState('unknown');
  const [deviceMotionAvailable, setDeviceMotionAvailable] = useState(true);
  const [motionDetected, setMotionDetected] = useState(false);
  const [lastAccel, setLastAccel] = useState(0);
  const [debugText, setDebugText] = useState('⏳ Waiting for motion...');

  // Detect iOS vs Android for default threshold
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const defaultThreshold = isIOS ? 14 : 22;
  const [threshold, setThreshold] = useState(defaultThreshold);

  const countdownIntervalRef = useRef(null);
  const motionListenerActive = useRef(false);
  const fallTriggeredRef = useRef(false);
  const eventCounter = useRef(0);
  const lastAccelData = useRef({ x: 0, y: 0, z: 0 });
  const cooldownRef = useRef(false);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    requestPermission: async () => {
      console.log('[FallDetector] requestPermission called');
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceMotionEvent.requestPermission();
          console.log('[FallDetector] Permission result:', permission);
          setPermissionState(permission);
          if (permission === 'granted') {
            startMotionListener();
            return true;
          }
          return false;
        } catch (error) {
          console.error('[FallDetector] Permission error:', error);
          return false;
        }
      } else {
        // Android / Desktop – auto‑grant
        console.log('[FallDetector] Auto‑granting permission (Android or non‑iOS)');
        setPermissionState('granted');
        startMotionListener();
        return true;
      }
    },
    isBlocked: () => {
      if (permissionState === 'unknown') return true;
      if (permissionState === 'denied') return true;
      if (permissionState === 'granted' && !motionDetected) return true;
      return false;
    },
    getStatus: () => ({
      permissionState,
      deviceMotionAvailable,
      motionDetected,
      debugText,
      isListening: motionListenerActive.current,
      threshold,
    }),
    setThreshold: (val) => setThreshold(val),
  }));

  const startMotionListener = () => {
    if (motionListenerActive.current) {
      console.log('[FallDetector] Listener already active');
      return;
    }
    console.log('[FallDetector] Adding devicemotion listener');
    window.removeEventListener('devicemotion', handleMotion);
    window.addEventListener('devicemotion', handleMotion);
    motionListenerActive.current = true;
    setDebugText('👂 Listening for motion...');

    setTimeout(() => {
      if (!motionDetected && motionListenerActive.current) {
        setDebugText('⚠️ No motion yet – try moving your device');
      }
    }, 5000);
  };

  const handleMotion = (event) => {
    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc) {
      console.warn('[FallDetector] No acceleration data');
      return;
    }

    // First real motion event
    if (!motionDetected) {
      console.log('[FallDetector] ✅ First motion event received!', acc);
      setMotionDetected(true);
      setDebugText('✅ Motion active – monitoring for falls');
      setDeviceMotionAvailable(true);
    }

    const totalAccel = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
    setLastAccel(totalAccel);

    // Calculate delta (sudden change) from previous reading
    const prev = lastAccelData.current;
    const delta = Math.sqrt(
      (acc.x - prev.x) ** 2 +
      (acc.y - prev.y) ** 2 +
      (acc.z - prev.z) ** 2
    );
    lastAccelData.current = { x: acc.x, y: acc.y, z: acc.z };

    // Log every 10th event
    eventCounter.current++;
    if (eventCounter.current % 10 === 0) {
      console.log(`[FallDetector] Accel: ${totalAccel.toFixed(2)} m/s², delta: ${delta.toFixed(2)}`);
      setDebugText(`📊 ${totalAccel.toFixed(2)} m/s² (threshold: ${threshold})`);
    }

    // Cooldown: if we just triggered, ignore further motion for 5 seconds
    if (cooldownRef.current) return;

    // FALL DETECTION LOGIC:
    // 1. Peak acceleration > threshold
    // 2. OR sudden change (delta) > 12 (sharp impact)
    // 3. NOT already counting down
    // 4. NOT already triggered (prevent re‑trigger)
    const peakDetected = totalAccel > threshold;
    const impactDetected = delta > 12 && totalAccel > 10;

    if ((peakDetected || impactDetected) && !isCountingDown && !fallTriggeredRef.current) {
      console.log(`🚨 FALL DETECTED! Accel: ${totalAccel.toFixed(2)} m/s², delta: ${delta.toFixed(2)}, threshold: ${threshold}`);
      fallTriggeredRef.current = true;
      cooldownRef.current = true;
      setIsCountingDown(true);
      setCountdown(10);
      showToast('⚠️ Fall Detected! Checking user status...', 'warning');

      // Reset cooldown after 5 seconds
      setTimeout(() => {
        cooldownRef.current = false;
      }, 5000);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (isCountingDown) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            setIsCountingDown(false);
            fallTriggeredRef.current = false;
            cooldownRef.current = false;
            if (onFallDetected) onFallDetected();
            showToast('🚨 EMERGENCY: Fall alert dispatched!', 'error');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownIntervalRef.current);
  }, [isCountingDown, onFallDetected, showToast]);

  const handleIImOkay = () => {
    clearInterval(countdownIntervalRef.current);
    setIsCountingDown(false);
    fallTriggeredRef.current = false;
    cooldownRef.current = false;
    showToast('✅ Alert cancelled. Glad you are safe!', 'success');
  };

  // Initial setup
  useEffect(() => {
    if (typeof DeviceMotionEvent === 'undefined') {
      console.warn('[FallDetector] DeviceMotionEvent not supported');
      setDeviceMotionAvailable(false);
      setPermissionState('denied');
      setDebugText('❌ No motion sensors');
      return;
    }

    if (typeof DeviceMotionEvent.requestPermission !== 'function') {
      // Android: auto‑grant
      console.log('[FallDetector] Android: auto‑starting');
      setPermissionState('granted');
      startMotionListener();
    } else {
      // iOS: wait for user gesture
      console.log('[FallDetector] iOS: waiting for user permission');
      setPermissionState('unknown');
      setDebugText('📱 Tap "Enable Fall Detection" in header');
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      motionListenerActive.current = false;
    };
  }, []);

  // Render warnings
  if (!deviceMotionAvailable && permissionState !== 'granted') {
    return (
      <div className="fall-detector-warning">
        ⚠️ Fall detection unavailable – this device lacks motion sensors.
      </div>
    );
  }

  if (permissionState === 'unknown' || permissionState === 'denied') {
    return (
      <div className="fall-detector-warning">
        ⚠️ {permissionState === 'unknown' ? 'Enable Fall Detection' : 'Fall detection blocked'} – Tap the "Enable Fall Detection" button in the header.
      </div>
    );
  }

  // Main UI
  return (
    <>
      {isCountingDown && (
        <div className="fall-countdown-overlay">
          <h1 className="fall-countdown-title">🚨 Fall Detected! 🚨</h1>
          <p className="fall-countdown-message">Sending emergency alert in...</p>
          <div className="fall-countdown-number">{countdown}</div>
          <button className="fall-ok-btn" onClick={handleIImOkay}>
            I am OK 👍
          </button>
          <div className="fall-countdown-hint">Tap "I am OK" to cancel the alert.</div>
        </div>
      )}

      {/* Debug overlay */}
      <div style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.75)',
        color: '#00FF88',
        padding: '6px 18px',
        borderRadius: '30px',
        fontSize: '13px',
        zIndex: 999,
        fontFamily: 'monospace',
        textAlign: 'center',
        pointerEvents: 'none',
        border: '1px solid rgba(0,255,136,0.2)',
        backdropFilter: 'blur(4px)',
        whiteSpace: 'nowrap',
      }}>
        {debugText}
        {motionDetected && `  •  ${lastAccel.toFixed(1)} m/s²`}
      </div>

      {/* Sensitivity slider */}
      <div style={{
        position: 'fixed',
        bottom: '130px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.6)',
        padding: '8px 16px',
        borderRadius: '30px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 999,
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <span style={{ color: '#8899CC', fontSize: '12px' }}>Sensitivity</span>
        <input
          type="range"
          min="8"
          max="30"
          step="0.5"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          style={{ width: '100px', accentColor: '#00FF88' }}
        />
        <span style={{ color: '#00FF88', fontSize: '12px', minWidth: '30px' }}>{threshold}</span>
        <span style={{ color: '#8899CC', fontSize: '10px' }}>
          {isIOS ? '(iOS)' : '(Android)'}
        </span>
      </div>
    </>
  );
});

FallDetector.displayName = 'FallDetector';

export default FallDetector;