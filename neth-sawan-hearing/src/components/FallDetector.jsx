// src/components/FallDetector.jsx
import React, { useState, useEffect, useRef } from 'react';
import './FallDetector.css';

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
      // දැනටමත් කවුන්ටඩවුන් එක දුවනවා නම් අලුතින් ඩිටෙක්ට් කරන්න ඕනේ නැහැ
      if (timerRef.current) return; 

      // X, Y, Z අක්ෂ ඔස්සේ සිදුවන ත්වරණය (Acceleration including gravity)
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      // G-Force එක ගණනය කිරීම (Magnitude of Acceleration)
      const totalAcceleration = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);

      // 💡 FALL DETECTION THRESHOLD:
      if (totalAcceleration > 25) {
        triggerCountdown();
      }
    };

    if (hasPermission) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [hasPermission]);

  // 🕒 3. Countdown එක තත්පරයෙන් තත්පරය අඩු කරන ලොජික් එක
  useEffect(() => {
    if (isCountingDown) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(countdownIntervalRef.current);
  }, [isCountingDown]);

  // 4. වැටීමක් හඳුනාගත් විට Countdown එක පටන් ගැනීම
  const triggerCountdown = () => {
    if (timerRef.current) return; // Duplicate ටයිමර්ස් හැදීම වළක්වයි

    setIsCountingDown(true);
    setCountdown(10);

    // තත්පර 10ක් ඇතුළත Cancel නොකළොත් App.jsx එකේ function එක call වෙනවා
    timerRef.current = setTimeout(() => {
      cleanupTimers();
      setIsCountingDown(false);
      
      // 🚨 App.jsx එකෙන් ආපු function එක මෙතනින් රන් වෙලා DB සේව් වීම සහ WhatsApp වැඩේ වෙනවා
      if (onFallDetected) {
        onFallDetected(); 
      }
    }, 10000); 
  };

  // ටයිමර්ස් ක්ලියර් කරන පොදු ෆන්ක්ෂන් එකක්
  const cleanupTimers = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    countdownIntervalRef.current = null;
  };

  // 5. පරිශීලකයා "I am OK" බොත්තම එබූ විට (False Alarm එකක් නම්)
  const handleIImOkay = () => {
    cleanupTimers();
    setIsCountingDown(false);
    setCountdown(10);
    console.log("😇 False alarm cancelled by user.");
  };

  // Component unmount වෙනකොට සේරම ටයිමර්ස් ක්ලීන් කරන්න
  useEffect(() => {
    return () => cleanupTimers();
  }, []);

  return (
    <div style={{ padding: '16px', textAlign: 'center' }}>
      {hasPermission === false && (
        <button 
          onClick={requestPermission}
          style={{ padding: '10px 20px', background: '#FF3355', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer' }}
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