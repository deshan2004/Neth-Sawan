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

  const countdownIntervalRef = useRef(null);
  const motionListenerActive = useRef(false);
  const fallTriggeredRef = useRef(false);
  const eventCounter = useRef(0);

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
      // Blocked if permission denied, OR permission granted but no motion event yet
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
    }),
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

    // Fallback: if no event after 5s, show a hint
    setTimeout(() => {
      if (!motionDetected && motionListenerActive.current) {
        setDebugText('⚠️ No motion yet – try shaking your device');
      }
    }, 5000);
  };

  const handleMotion = (event) => {
    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc) {
      console.warn('[FallDetector] No acceleration data');
      return;
    }

    // First real motion event – mark as detected
    if (!motionDetected) {
      console.log('[FallDetector] ✅ First motion event received!', acc);
      setMotionDetected(true);
      setDebugText('✅ Motion active – monitoring for falls');
      setDeviceMotionAvailable(true);
    }

    const totalAccel = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
    setLastAccel(totalAccel);

    // Log every 10th event to avoid console spam
    eventCounter.current++;
    if (eventCounter.current % 10 === 0) {
      console.log(`[FallDetector] Accel: ${totalAccel.toFixed(2)} m/s² (x:${acc.x.toFixed(1)}, y:${acc.y.toFixed(1)}, z:${acc.z.toFixed(1)})`);
      setDebugText(`📊 ${totalAccel.toFixed(2)} m/s²`);
    }

    // FALL THRESHOLD – lowered to 18 for better sensitivity
    const FALL_THRESHOLD = 18;
    if (totalAccel > FALL_THRESHOLD && !isCountingDown && !fallTriggeredRef.current) {
      console.log(`🚨 FALL DETECTED! Accel: ${totalAccel.toFixed(2)} m/s²`);
      fallTriggeredRef.current = true;
      setIsCountingDown(true);
      setCountdown(10);
      showToast('⚠️ Fall Detected! Checking user status...', 'warning');
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

  if (permissionState === 'denied') {
    return (
      <div className="fall-detector-warning">
        ⚠️ Fall detection blocked – Tap the "Enable Fall Detection" button in the header.
      </div>
    );
  }

  // Main UI (countdown overlay + debug bar)
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

      {/* Debug overlay – shows acceleration and status */}
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
    </>
  );
});

FallDetector.displayName = 'FallDetector';

export default FallDetector;