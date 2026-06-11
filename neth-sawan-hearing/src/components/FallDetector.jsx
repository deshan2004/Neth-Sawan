import React, { useState, useEffect, useRef } from 'react';

const FallDetector = ({ onFallDetected }) => {
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  
  // Accelerometer / Device Motion Sensor Refs
  const lastX = useRef(0);
  const lastY = useRef(0);
  const lastZ = useRef(0);
  const lastTime = useRef(Date.now());
  
  // 1. Sensor Event Listener to Detect Fall / Impact
  useEffect(() => {
    const handleMotion = (event) => {
      if (isCountingDown) return; // Countdown එක දුවන වෙලාවට අලුතින් impact ගන්නේ නැත

      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastTime.current;

      if (timeDiff > 100) {
        const x = acc.x || 0;
        const y = acc.y || 0;
        const z = acc.z || 0;

        const totalAcceleration = Math.sqrt(x * x + y * y + z * z);
        
        // Threshold එක 30m/s² ට වඩා වැඩි වුණොත් impact එකක් ලෙස සලකා Countdown එක පටන් ගනී
        if (totalAcceleration > 30) { 
          console.log("⚠️ Fall impact detected! Magnitude:", totalAcceleration);
          setIsCountingDown(true);
          setCountdown(10);
        }

        lastX.current = x;
        lastY.current = y;
        lastZ.current = z;
        lastTime.current = currentTime;
      }
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [isCountingDown]);

  // 🕒 2. CORRECTED COUNTDOWN TIMER LOGIC (10, 9, 8...)
  useEffect(() => {
    let timer;
    if (isCountingDown && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prevCount) => prevCount - 1);
      }, 1000);
    } else if (isCountingDown && countdown === 0) {
      setIsCountingDown(false);
      onFallDetected(); // Countdown එක 0 වුණ සැනින් WhatsApp/SOS පද්ධතිය ක්‍රියාත්මක වේ
    }

    return () => clearInterval(timer);
  }, [isCountingDown, countdown, onFallDetected]);

  // User cancels the emergency alert
  const handleCancel = () => {
    setIsCountingDown(false);
    setCountdown(10);
    console.log("😇 User clicked 'I am OK'. Emergency cancelled.");
  };

  // අනතුරක් හඳුනා නොගත් වෙලාවට මුකුත්ම Screen එකේ පෙන්වන්නේ නැත
  if (!isCountingDown) return null;

  return (
    <div className="fall-emergency-overlay" style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#e60000', zIndex: 99999, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: 'sans-serif', padding: '20px', boxSizing: 'border-box'
    }}>
      <div style={{ fontSize: '70px', marginBottom: '10px' }}>🚨</div>
      <h1 style={{ fontSize: '42px', fontWeight: 'bold', margin: '10px 0', textAlign: 'center' }}>Fall Detected!</h1>
      <div style={{ fontSize: '60px', marginBottom: '20px' }}>🚨</div>
      
      <p style={{ fontSize: '20px', textAlign: 'center', maxWidth: '80%', margin: '0 0 30px 0', lineHeight: '1.4' }}>
        Sending emergency alert to your relatives in...
      </p>

      {/* 🔴 මෙන්න මේ ස්ටේට් එක දැන් හැම තත්පරයකදීම 10, 9, 8... විදිහට අඩුවේවි මල්ලි */}
      <div style={{ fontSize: '120px', fontWeight: 'bold', marginBottom: '40px', transition: 'all 0.3s ease' }}>
        {countdown}
      </div>

      <button 
        onClick={handleCancel}
        style={{
          backgroundColor: '#00cc99', color: '#fff', border: 'none',
          padding: '18px 45px', fontSize: '24px', fontWeight: 'bold',
          borderRadius: '40px', cursor: 'pointer', boxShadow: '0 8px 15px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '10px', transition: 'transform 0.2s'
        }}
      >
        I am OK 👍
      </button>
    </div>
  );
};

export default FallDetector;