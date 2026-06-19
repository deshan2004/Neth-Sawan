// src/components/FallDetector.jsx
import React, { useState, useEffect, useRef } from 'react';
import './FallDetector.css';

const FallDetector = ({ onFallDetected }) => {
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [permissionState, setPermissionState] = useState('unknown'); // 'unknown', 'granted', 'denied'
  const [isActive, setIsActive] = useState(false);
  const [deviceMotionAvailable, setDeviceMotionAvailable] = useState(true);
  
  const timerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const lastAccelerationRef = useRef({ x: 0, y: 0, z: 0 });
  const stationaryCheckRef = useRef(null);

  // Check if DeviceMotion is available
  useEffect(() => {
    const isDeviceMotionSupported = typeof DeviceMotionEvent !== 'undefined';
    setDeviceMotionAvailable(isDeviceMotionSupported);
    
    if (!isDeviceMotionSupported) {
      setPermissionState('denied');
      console.warn('DeviceMotion API not supported on this device.');
      return;
    }

    // On iOS 13+, we must request permission
    const initFallDetection = async () => {
      // iOS 13+ requires explicit permission
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
          const permissionResult = await DeviceMotionEvent.requestPermission();
          if (permissionResult === 'granted') {
            setPermissionState('granted');
            startMotionListener();
          } else {
            setPermissionState('denied');
            console.warn('Fall detection permission denied on iOS.');
          }
        } catch (error) {
          console.error('Error requesting motion permission:', error);
          setPermissionState('denied');
        }
      } else {
        // Android, PC, or older iOS – permission not required
        setPermissionState('granted');
        startMotionListener();
      }
    };

    const startMotionListener = () => {
      setIsActive(true);
      window.addEventListener('devicemotion', handleMotion);
      // Fallback: if no motion event after 2 seconds, assume no sensor
      const timeout = setTimeout(() => {
        if (!window._motionReceived) {
          setDeviceMotionAvailable(false);
          setPermissionState('denied');
        }
      }, 2000);
      return () => clearTimeout(timeout);
    };

    initFallDetection();

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      cleanupTimers();
    };
  }, []);

  const handleMotion = (event) => {
    if (!isActive) return;
    if (timerRef.current) return; // already counting down

    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    window._motionReceived = true;

    const totalAcceleration = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);

    // Threshold: adjust based on device sensitivity
    const FALL_THRESHOLD = 22; // lower = more sensitive, higher = less false positives

    // Also detect sudden change in acceleration (impact)
    const last = lastAccelerationRef.current;
    const delta = Math.sqrt(
      (acc.x - last.x) ** 2 +
      (acc.y - last.y) ** 2 +
      (acc.z - last.z) ** 2
    );
    lastAccelerationRef.current = { x: acc.x, y: acc.y, z: acc.z };

    // If total acceleration exceeds threshold or sudden change > 15, trigger fall
    if (totalAcceleration > FALL_THRESHOLD || delta > 15) {
      triggerCountdown();
    }
  };

  const triggerCountdown = () => {
    if (timerRef.current) return;

    // Vibrate to alert user
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    setIsCountingDown(true);
    setCountdown(10);

    timerRef.current = setTimeout(() => {
      cleanupTimers();
      setIsCountingDown(false);
      if (onFallDetected) {
        onFallDetected();
      }
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
    // Cancel fall detection by resetting last acceleration
    lastAccelerationRef.current = { x: 0, y: 0, z: 0 };
  };

  const cleanupTimers = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    countdownIntervalRef.current = null;
  };

  // If motion not available, show a subtle warning (optional)
  if (!deviceMotionAvailable) {
    return (
      <div className="fall-detector-warning">
        ⚠️ Fall detection unavailable – this device lacks motion sensors.
      </div>
    );
  }

  // If permission denied, show a message
  if (permissionState === 'denied' && deviceMotionAvailable) {
    return (
      <div className="fall-detector-warning">
        ⚠️ Fall detection blocked – please allow motion sensors in browser settings.
      </div>
    );
  }

  // Countdown overlay (visible only during fall detection)
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
          <div className="fall-countdown-hint">
            Tap "I am OK" to cancel the alert.
          </div>
        </div>
      )}
      {/* No other UI – fall detection runs silently */}
    </>
  );
};

export default FallDetector;