// src/components/FallDetector.jsx
import React, { useState, useEffect, useRef } from 'react';

const FallDetector = ({ onFallDetected }) => {
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [hasPermission, setHasPermission] = useState(null);
  
  const timerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // 1. iOS සහ සමහර Android ෆෝන් වල සෙන්සර්ස් වලට Permission ඉල්ලීම
  const requestPermission = async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceMotionEvent.requestPermission();
        setHasPermission(permissionState === 'granted');
      } catch (error) {
        console.error("Error requesting DeviceMotion permission:", error);
        setHasPermission(false);
      }
    } else {
      // සාමාන්‍ය බ්‍රවුසර් වල කෙලින්ම වැඩ කරයි
      setHasPermission(true);
    }
  };

  useEffect(() => {
    // Permission දැනටමත් තියෙනවද බලන්න මුලින්ම රන් කරනවා
    requestPermission();

    const handleMotion = (event) => {
      if (isCountingDown) return; // දැනටමත් වැටීමක් ඩිටෙක්ට් වී countdown යනවා නම් නැවත බලන්න ඕනේ නැහැ

      // X, Y, Z අක්ෂ ඔස්සේ සිදුවන ත්වරණය (Acceleration including gravity)
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      // G-Force එක ගණනය කිරීම (Magnitude of Acceleration)
      // Formula: √(x² + y² + z²)
      const totalAcceleration = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);

      // 💡 FALL DETECTION THRESHOLD: 
      // සාමාන්‍යයෙන් කෙනෙක් වැටෙද්දී G-Force එක 25 m/s² ට වඩා වැඩි වෙනවා (සාමාන්‍ය gravity එක 9.8 m/s²)
      if (totalAcceleration > 25) {
        triggerCountdown();
      }
    };

    if (hasPermission) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      clearInterval(countdownIntervalRef.current);
      clearTimeout(timerRef.current);
    };
  }, [hasPermission, isCountingDown]);

  // 2. වැටීමක් හඳුනාගත් විට Countdown එක පටන් ගැනීම
  const triggerCountdown = () => {
    setIsCountingDown(true);
    setCountdown(10);

    // හැම තත්පරයකම ස්ක්‍රීන් එකේ Countdown එක අඩු කරන්න
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    // තත්පර 10ක් ඇතුළත Cancel නොකළොත් ඥාතීන්ට Alert එක යවනවා
    timerRef.current = setTimeout(() => {
      clearInterval(countdownIntervalRef.current);
      setIsCountingDown(false);
      
      // 🚨 App.jsx එකේ තියෙන Emergency Function එක මෙතනින් Call වෙනවා
      if (onFallDetected) {
        onFallDetected(); 
      }
    }, 10); // 10000ms = තත්පර 10
  };

  // 3. වැරදීමකින් වැටීමක් පෙන්වුවහොත් (False Alarm) පරිශීලකයාට Cancel කිරීමට ඇති හැකියාව
  const handleIImOkay = () => {
    clearInterval(countdownIntervalRef.current);
    clearTimeout(timerRef.current);
    setIsCountingDown(false);
    setCountdown(10);
  };

  return (
    <div style={{ padding: '16px', textAlign: 'center' }}>
      {hasPermission === false && (
        <button 
          onClick={requestPermission}
          style={{ padding: '10px 20px', background: '#FF3355', color: '#white', border: 'none', borderRadius: '20px', cursor: 'pointer' }}
        >
          ⚠️ Enable Fall Detection (Grant Sensor Access)
        </button>
      )}

      {isCountingDown && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(255, 0, 0, 0.9)', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', zIndex: 9999, color: 'white'
        }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>🚨 Fall Detected! 🚨</h1>
          <p style={{ fontSize: '1.2rem' }}>Sending emergency alert to your relatives in...</p>
          <div style={{ fontSize: '6rem', fontWeight: 'bold', margin: '20px 0' }}>{countdown}</div>
          
          <button 
            onClick={handleIImOkay}
            style={{
              padding: '20px 40px', fontSize: '1.5rem', fontWeight: 'bold',
              background: '#00CCAA', color: 'black', border: 'none', borderRadius: '50px',
              cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}
          >
            I am OK 👍
          </button>
        </div>
      )}
    </div>
  );
};

export default FallDetector;