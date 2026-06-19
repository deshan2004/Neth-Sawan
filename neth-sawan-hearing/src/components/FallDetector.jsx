// src/components/FallDetector.jsx
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import './FallDetector.css';

const FallDetector = forwardRef(({ onFallDetected }, ref) => {
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [permissionState, setPermissionState] = useState('unknown');
  const [isActive, setIsActive] = useState(false);
  const [deviceMotionAvailable, setDeviceMotionAvailable] = useState(true);

  const timerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const lastAccelerationRef = useRef({ x: 0, y: 0, z: 0 });
  const motionListenerActive = useRef(false);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    requestPermission: async () => {
      const granted = await requestMotionPermission();
      return granted;
    },
    isBlocked: () => permissionState === 'denied' && deviceMotionAvailable,
    getStatus: () => ({ permissionState, deviceMotionAvailable, isActive }),
  }));

  const requestMotionPermission = async () => {
    if (typeof DeviceMotionEvent === 'undefined') {
      setDeviceMotionAvailable(false);
      setPermissionState('denied');
      return false;
    }

    // iOS 13+ requires explicit permission via user gesture
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permissionResult = await DeviceMotionEvent.requestPermission();
        if (permissionResult === 'granted') {
          setPermissionState('granted');
          startMotionListener();
          return true;
        } else {
          setPermissionState('denied');
          return false;
        }
      } catch (error) {
        console.error('Error requesting motion permission:', error);
        setPermissionState('denied');
        return false;
      }
    } else {
      // Android or older iOS – no permission needed
      setPermissionState('granted');
      startMotionListener();
      return true;
    }
  };

  const startMotionListener = () => {
    if (motionListenerActive.current) return;
    setIsActive(true);
    motionListenerActive.current = true;
    window.addEventListener('devicemotion', handleMotion);
    // Fallback: if no motion event after 2 seconds, assume no sensor
    setTimeout(() => {
      if (!window._motionReceived) {
        setDeviceMotionAvailable(false);
        setPermissionState('denied');
        setIsActive(false);
      }
    }, 2000);
  };

  // Auto‑request on mount (for Android / non‑iOS)
  useEffect(() => {
    if (typeof DeviceMotionEvent === 'undefined') {
      setDeviceMotionAvailable(false);
      setPermissionState('denied');
      return;
    }

    // On iOS, we wait for user gesture (header button)
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      setPermissionState('unknown');
      setDeviceMotionAvailable(true);
      return;
    }

    // Android: auto‑grant
    const init = async () => {
      await requestMotionPermission();
    };
    init();

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      cleanupTimers();
      motionListenerActive.current = false;
    };
  }, []);

  const handleMotion = (event) => {
    if (!isActive) return;
    if (timerRef.current) return;

    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    window._motionReceived = true;

    const totalAcceleration = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
    const last = lastAccelerationRef.current;
    const delta = Math.sqrt(
      (acc.x - last.x) ** 2 +
      (acc.y - last.y) ** 2 +
      (acc.z - last.z) ** 2
    );
    lastAccelerationRef.current = { x: acc.x, y: acc.y, z: acc.z };

    const FALL_THRESHOLD = 22;
    if (totalAcceleration > FALL_THRESHOLD || delta > 15) {
      triggerCountdown();
    }
  };

  const triggerCountdown = () => {
    if (timerRef.current) return;
    if (navigator.vibrate) navigator.vibrate(200);

    setIsCountingDown(true);
    setCountdown(10);

    timerRef.current = setTimeout(() => {
      cleanupTimers();
      setIsCountingDown(false);
      if (onFallDetected) onFallDetected();
    }, 10000);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleIImOkay = () => {
    cleanupTimers();
    setIsCountingDown(false);
    setCountdown(10);
    lastAccelerationRef.current = { x: 0, y: 0, z: 0 };
  };

  const cleanupTimers = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    countdownIntervalRef.current = null;
  };

  // Show warning when motion not available
  if (!deviceMotionAvailable) {
    return (
      <div className="fall-detector-warning">
        ⚠️ Fall detection unavailable – this device lacks motion sensors.
      </div>
    );
  }

  // Show warning when permission is denied on iOS
  if (permissionState === 'denied' && deviceMotionAvailable) {
    return (
      <div className="fall-detector-warning">
        ⚠️ Fall detection blocked – tap the "Enable Fall Detection" button in the header.
      </div>
    );
  }

  // Countdown overlay
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