// src/components/InPersonTranslator.jsx
import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as tmImage from '@teachablemachine/image';
import './InPersonTranslator.css';

// ⚠️ Replace with your Teachable Machine URL
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/q7qApyLqo/";

const SINHALA_CLASS_MAP = {
  "Ayubowan": "ආයුබෝවන්! 🙏",
  "Sthuthi": "ස්තුතියි! ❤️",
  "Ow": "ඔව් 👍",
  "Nae": "නැහැ 👎",
  "Udavvak": "මට උදව් කරන්න! 🆘",
  "Vathura": "මට වතුර ටිකක් ඕනේ... 💧",
  "Kama": "මට බඩගිනියි, කෑම ඕනේ... 🍽️"
};

const InPersonTranslator = ({ onClose }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [liveTranslation, setLiveTranslation] = useState('📷 කැමරාව සක්‍රීය කර සංඥා කරන්න...');
  const [translationHistory, setTranslationHistory] = useState([]);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const [isFlipping, setIsFlipping] = useState(false);

  const cameraFeedRef = useRef(null);
  const localStreamRef = useRef(null);
  const modelRef = useRef(null);
  const maxPredictionsRef = useRef(0);
  const animationFrameIdRef = useRef(null);

  const startCameraScanner = async () => {
    setModelLoading(true);
    setError('');
    setLiveTranslation('🧠 AI මොඩලය පූරණය වෙමින්...');

    try {
      const modelPath = MODEL_URL + "model.json";
      const metadataPath = MODEL_URL + "metadata.json";
      modelRef.current = await tmImage.load(modelPath, metadataPath);
      maxPredictionsRef.current = modelRef.current.getTotalClasses();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      localStreamRef.current = stream;
      if (cameraFeedRef.current) {
        cameraFeedRef.current.srcObject = stream;
      }

      setIsCameraActive(true);
      setModelLoading(false);
      setLiveTranslation('🤟 සජීවී AI ස්කෑන් කිරීම ක්‍රියාත්මකයි! සංඥා කරන්න...');

      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      animationFrameIdRef.current = requestAnimationFrame(predictLoop);

    } catch (err) {
      console.error("AI Camera Error:", err);
      setError('❌ මොඩලය සක්‍රීය කිරීම අසාර්ථකයි. Link එක නිවැරදිදැයි පරීක්ෂා කරන්න.');
      setLiveTranslation('⚠️ දෝෂයක් සිදුවිය');
      setModelLoading(false);
    }
  };

  const predictLoop = async () => {
    if (cameraFeedRef.current && modelRef.current && localStreamRef.current) {
      try {
        const prediction = await modelRef.current.predict(cameraFeedRef.current);

        let highestPrediction = { className: "", probability: 0 };
        for (let i = 0; i < maxPredictionsRef.current; i++) {
          if (prediction[i].probability > highestPrediction.probability) {
            highestPrediction = prediction[i];
          }
        }

        if (highestPrediction.probability > 0.85 && highestPrediction.className !== "Neutral") {
          const sinhalaText = SINHALA_CLASS_MAP[highestPrediction.className] || highestPrediction.className;
          setLiveTranslation(sinhalaText);
          addToHistory(sinhalaText);
        }
      } catch (err) {
        console.error('Prediction error:', err);
      }

      animationFrameIdRef.current = requestAnimationFrame(predictLoop);
    }
  };

  const addToHistory = (text) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTranslationHistory(prev => [`[${timestamp}] ${text}`, ...prev.slice(0, 9)]);
  };

  // 🔥 Simple Flip: just toggle the camera, no persistent messages
  const flipCamera = async () => {
    if (!isCameraActive || isFlipping) return;
    setIsFlipping(true);

    try {
      // Stop current stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      if (cameraFeedRef.current) {
        cameraFeedRef.current.srcObject = null;
      }

      // Toggle mode
      const newMode = facingMode === 'environment' ? 'user' : 'environment';
      setFacingMode(newMode);

      // Restart stream with new mode
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      localStreamRef.current = stream;
      if (cameraFeedRef.current) {
        cameraFeedRef.current.srcObject = stream;
      }

      setIsFlipping(false);
      // The liveTranslation stays as it was – no forced message

    } catch (err) {
      console.error('Flip error:', err);
      setError('කැමරාව හැරවීම අසාර්ථකයි');
      setIsFlipping(false);
      // Attempt to restart with current mode
      setTimeout(() => {
        if (isCameraActive) startCameraScanner();
      }, 1000);
    }
  };

  const stopCameraScanner = () => {
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (cameraFeedRef.current) cameraFeedRef.current.srcObject = null;
    setIsCameraActive(false);
    setLiveTranslation('⏹️ කැමරාව වසා ඇත');
  };

  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="in-person-translator-overlay">
      <div className="translator-window">
        <div className="translator-header">
          <h3>📸 සජීවී AI සංඥා පරිවර්තකය</h3>
          <button className="exit-btn" onClick={onClose}>✕</button>
        </div>

        <div className="camera-viewfinder-zone">
          <video ref={cameraFeedRef} autoPlay playsInline muted className="live-scanner-video" />

          <div className="viewfinder-brackets">
            <div className="corner top-left"></div>
            <div className="corner top-right"></div>
            <div className="corner bottom-left"></div>
            <div className="corner bottom-right"></div>
          </div>

          {!isCameraActive && (
            <div className="camera-prompt">
              <span className="camera-icon">{modelLoading ? "🧠" : "📷"}</span>
              <button
                className="activate-cam-btn"
                onClick={startCameraScanner}
                disabled={modelLoading}
              >
                {modelLoading ? "⏳ පූරණය වෙමින්..." : "🚀 කැමරාව සක්‍රීය කරන්න"}
              </button>
              {error && <p style={{ color: '#FF3355', fontSize: '12px', marginTop: '8px' }}>{error}</p>}
            </div>
          )}

          {isCameraActive && (
            <div className="live-hud-caption">
              <span className="hud-tag">🔴 LIVE TRANSLATION</span>
              <p className="hud-text">{liveTranslation}</p>
            </div>
          )}
        </div>

        {isCameraActive && (
          <div className="translator-actions">
            {/* 🔥 Simple Flip button – no extra messages */}
            <button className="flip-cam-btn" onClick={flipCamera} disabled={isFlipping}>
              {isFlipping ? '⏳' : '🔄 හරවන්න'}
            </button>
            <button className="stop-scan-btn" onClick={stopCameraScanner}>
              🛑 නවත්වන්න
            </button>
          </div>
        )}

        <div className="history-log-section">
          <h4>📋 මෑතකදී හඳුනාගත් සංඥා</h4>
          <div className="history-box">
            {translationHistory.length === 0 ? (
              <p className="empty-history-text">සංඥා හඳුනාගත් විට මෙහි පෙන්වයි...</p>
            ) : (
              translationHistory.map((log, index) => (
                <div key={index} className="history-item-row">{log}</div>
              ))
            )}
          </div>
        </div>

        <div className="user-guide-footer">
          💡 <b>උපදෙස:</b> දෑත් කැමරාවට හොඳින් පෙන්වන්න, ආලෝකය හොඳින් ඇති ස්ථානයක සිටින්න.
        </div>
      </div>
    </div>
  );
};

export default InPersonTranslator;