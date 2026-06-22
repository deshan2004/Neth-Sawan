// src/components/FallDetector.jsx
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import './FallDetector.css';

const FallDetector = forwardRef(({ user, isGuest, showToast, onFallDetected }, ref) => {
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [permissionState, setPermissionState] = useState('unknown');
  const [deviceMotionAvailable, setDeviceMotionAvailable] = useState(true);
  const [motionDetected, setMotionDetected] = useState(false);

  // Auto‑detect iOS vs Android for default threshold
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const threshold = isIOS ? 14 : 22;

  const motionListenerActive = useRef(false);
  const fallTriggeredRef = useRef(false);
  const cooldownRef = useRef(false);
  const lastAccelData = useRef({ x: 0, y: 0, z: 0 });
  const countdownIntervalRef = useRef(null);
  const isCountingDownRef = useRef(false);

  // ===== VIBRATION HELPER =====
  const vibrate = (pattern) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Vibration failed:', error);
      }
    } else {
      console.warn('Vibration not supported');
    }
  };

  // ===== Expose methods to parent =====
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
      isListening: motionListenerActive.current,
      threshold,
    }),
  }));

  // ===== Start motion listener =====
  const startMotionListener = () => {
    if (motionListenerActive.current) {
      console.log('[FallDetector] Listener already active');
      return;
    }
    console.log('[FallDetector] Adding devicemotion listener');
    window.removeEventListener('devicemotion', handleMotion);
    window.addEventListener('devicemotion', handleMotion);
    motionListenerActive.current = true;
  };

  // ===== Motion event handler =====
  const handleMotion = (event) => {
    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc) {
      console.warn('[FallDetector] No acceleration data');
      return;
    }

    if (!motionDetected) {
      console.log('[FallDetector] ✅ First motion event received!', acc);
      setMotionDetected(true);
      setDeviceMotionAvailable(true);
    }

    const totalAccel = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);

    const prev = lastAccelData.current;
    const delta = Math.sqrt(
      (acc.x - prev.x) ** 2 +
      (acc.y - prev.y) ** 2 +
      (acc.z - prev.z) ** 2
    );
    lastAccelData.current = { x: acc.x, y: acc.y, z: acc.z };

    if (cooldownRef.current) return;

    const peakExceeded = totalAccel > threshold;
    const deltaExceeded = delta > 12 && totalAccel > 12;
    const extremePeak = totalAccel > 30;

    if ((peakExceeded && deltaExceeded) || extremePeak) {
      if (!isCountingDownRef.current && !fallTriggeredRef.current) {
        console.log(`🚨 FALL DETECTED! Accel: ${totalAccel.toFixed(2)} m/s², delta: ${delta.toFixed(2)}`);
        fallTriggeredRef.current = true;
        cooldownRef.current = true;
        
        // Vibrate immediately on fall detection (short buzz)
        vibrate([200, 100, 200]);
        
        // Start the countdown
        startCountdown();

        setTimeout(() => {
          cooldownRef.current = false;
        }, 5000);
      }
    }
  };

  // ===== Start countdown =====
  const startCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    setIsCountingDown(true);
    isCountingDownRef.current = true;
    setCountdown(10);
    let currentCount = 10;

    console.log('[FallDetector] Starting countdown...');

    const interval = setInterval(() => {
      currentCount -= 1;
      setCountdown(currentCount);
      console.log(`[FallDetector] Countdown: ${currentCount}`);

      // Vibrate every second during countdown (short buzz)
      if (currentCount > 0 && currentCount <= 5) {
        vibrate(100); // quick buzz to remind
      }

      if (currentCount <= 0) {
        clearInterval(interval);
        countdownIntervalRef.current = null;
        setIsCountingDown(false);
        isCountingDownRef.current = false;
        fallTriggeredRef.current = false;
        cooldownRef.current = false;

        // Trigger emergency vibration pattern (SOS)
        vibrate([500, 200, 500, 200, 500, 200, 500]);

        // Trigger emergency
        if (onFallDetected) onFallDetected();
        showToast('🚨 EMERGENCY: Fall alert dispatched!', 'error');
      }
    }, 1000);

    countdownIntervalRef.current = interval;
  };

  // ===== Cancel countdown =====
  const handleIImOkay = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsCountingDown(false);
    isCountingDownRef.current = false;
    fallTriggeredRef.current = false;
    cooldownRef.current = false;
    showToast('✅ Alert cancelled. Glad you are safe!', 'success');
  };

  // ===== Initial setup =====
  useEffect(() => {
    if (typeof DeviceMotionEvent === 'undefined') {
      console.warn('[FallDetector] DeviceMotionEvent not supported');
      setDeviceMotionAvailable(false);
      setPermissionState('denied');
      return;
    }

    if (typeof DeviceMotionEvent.requestPermission !== 'function') {
      console.log('[FallDetector] Android: auto‑starting');
      setPermissionState('granted');
      startMotionListener();
    } else {
      console.log('[FallDetector] iOS: waiting for user permission');
      setPermissionState('unknown');
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      motionListenerActive.current = false;
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, []);

  // ===== Render =====
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

  // ===== Main UI =====
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
    </>
  );
});

FallDetector.displayName = 'FallDetector';

export default FallDetector;