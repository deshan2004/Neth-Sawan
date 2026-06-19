// src/components/FallDetector.jsx
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import './FallDetector.css';

const FallDetector = forwardRef(({ user, isGuest, showToast, onFallDetected }, ref) => {
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [permissionState, setPermissionState] = useState('unknown');
  const [deviceMotionAvailable, setDeviceMotionAvailable] = useState(true);
  const [motionDetected, setMotionDetected] = useState(false);

  const countdownIntervalRef = useRef(null);
  const motionListenerActive = useRef(false);

  // Expose requestPermission to parent (App.jsx)
  useImperativeHandle(ref, () => ({
    requestPermission: async () => {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceMotionEvent.requestPermission();
          setPermissionState(permission);
          if (permission === 'granted') {
            startMotionListener();
            return true;
          }
          return false;
        } catch (error) {
          console.error("Error requesting motion permission:", error);
          return false;
        }
      } else {
        // Android / Desktop – grant automatically if hardware is available
        setPermissionState('granted');
        startMotionListener();
        return true;
      }
    },
    isBlocked: () => {
      if (permissionState === 'denied') return true;
      if (permissionState === 'granted' && !motionDetected) return true;
      return false;
    }
  }));

  const startMotionListener = () => {
    if (motionListenerActive.current) return;
    window.removeEventListener('devicemotion', handleMotion);
    window.addEventListener('devicemotion', handleMotion);
    motionListenerActive.current = true;
    setMotionDetected(true);
  };

  const handleMotion = (event) => {
    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc) return;

    // Fall detection: when sudden acceleration > 30 m/s² (impact)
    const totalAcceleration = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
    
    if (totalAcceleration > 30 && !isCountingDown) {
      setIsCountingDown(true);
      setCountdown(10);
      showToast("⚠️ Fall Detected! Checking user status...", "warning");
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
            // Trigger emergency
            if (onFallDetected) onFallDetected();
            showToast("🚨 EMERGENCY: Fall alert dispatched!", "error");
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
    showToast("✅ Alert cancelled. Glad you are safe!", "success");
  };

  // Initial check for Android / non-iOS
  useEffect(() => {
    if (typeof DeviceMotionEvent === 'undefined') {
      setDeviceMotionAvailable(false);
      setPermissionState('denied');
    } else if (typeof DeviceMotionEvent.requestPermission !== 'function') {
      // Android: auto‑grant
      setPermissionState('granted');
      startMotionListener();
    }
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, []);

  // Warning messages
  if (!deviceMotionAvailable) {
    return (
      <div className="fall-detector-warning">
        ⚠️ Fall detection unavailable – Device lacks motion sensors.
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