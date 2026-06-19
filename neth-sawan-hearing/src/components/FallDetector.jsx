// src/components/FallDetector.jsx
import React, { useState, useEffect, useRef } from 'react';
import './FallDetector.css';

const FallDetector = ({ onFallDetected }) => {
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [permissionState, setPermissionState] = useState('unknown'); // 'unknown', 'granted', 'denied'
  const [isActive, setIsActive] = useState(false);
  
  const timerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Auto-request permission on iOS and start listening
  useEffect(() => {
    const initFallDetection = async () => {
      // Check if DeviceMotionEvent is supported
      if (typeof DeviceMotionEvent === 'undefined') {
        console.warn('DeviceMotionEvent not supported on this device.');
        setPermissionState('denied');
        return;
      }

      // On iOS 13+, we need to request permission
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
          const permissionResult = await DeviceMotionEvent.requestPermission();
          if (permissionResult === 'granted') {
            setPermissionState('granted');
            startMotionListener();
          } else {
            setPermissionState('denied');
            console.warn('Fall detection permission denied.');
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
      // Listen for devicemotion
      window.addEventListener('devicemotion', handleMotion);
    };

    initFallDetection();

    // Cleanup
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      cleanupTimers();
    };
  }, []);

  const handleMotion = (event) => {
    if (!isActive) return;
    if (timerRef.current) return; // Already counting down

    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    const totalAcceleration = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);

    // Threshold for fall detection (adjustable)
    const FALL_THRESHOLD = 25;
    if (totalAcceleration > FALL_THRESHOLD) {
      triggerCountdown();
    }
  };

  const triggerCountdown = () => {
    if (timerRef.current) return;

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
  };

  const cleanupTimers = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    countdownIntervalRef.current = null;
  };

  // Show a subtle warning if permission is denied
  if (permissionState === 'denied') {
    return (
      <div className="fall-detector-warning">
        ⚠️ Fall detection unavailable – please allow motion sensors in browser settings.
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
        </div>
      )}
      {/* No other UI – fall detection runs silently in the background */}
    </>
  );
};

export default FallDetector;