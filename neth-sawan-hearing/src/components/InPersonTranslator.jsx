import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as tmImage from '@teachablemachine/image';
import './InPersonTranslator.css';

// ⚠️ ඔයා Google Teachable Machine එකෙන් කොපි කරගත්ත Link එක මෙන්න මෙතන තියෙන ලින්ක් එක වෙනුවට පේස්ට් කරන්න:
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/q7qApyLqo/"; // Example: "https://teachablemachine.withgoogle.com/models/YourModelID/"

// Teachable Machine Classes සිංහලට පරිවර්තනය කරන Map එක
const SINHALA_CLASS_MAP = {
  "Ayubowan": "ආයුබෝවන්! 🙏 (Hello / Welcome)",
  "Sthuthi": "ස්තුතියි! ❤️ (Thank You)",
  "Ow": "ඔව් 👍 (Yes)",
  "Nae": "නැහැ 👎 (No)",
  "Udavvak": "මට උදව් කරන්න! 🆘 (Need Help)",
  "Vathura": "මට වතුර ටිකක් ඕනේ... 💧 (Want Water)",
  "Kama": "මට බඩගිනියි, කෑම ඕනේ... 🍽️ (Hungry / Food)"
};

const InPersonTranslator = ({ onClose }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [liveTranslation, setLiveTranslation] = useState('පද්ධතිය සක්‍රීය කිරීමට කැමරාව On කරන්න...');
  const [translationHistory, setTranslationHistory] = useState([]);
  
  const cameraFeedRef = useRef(null);
  const localStreamRef = useRef(null);
  const modelRef = useRef(null);
  const maxPredictionsRef = useRef(0);
  const animationFrameIdRef = useRef(null);

  // AI Model එක Load කිරීම සහ සැබෑ කැමරාව සක්‍රීය කිරීම
  const startCameraScanner = async () => {
    setModelLoading(true);
    setLiveTranslation('AI මොඩලය සක්‍රීය වෙමින් පවතී. කරුණාකර රැඳී සිටින්න... 🧠');
    
    try {
      const modelPath = MODEL_URL + "model.json";
      const metadataPath = MODEL_URL + "metadata.json";
      
      // Teachable Machine මොඩලය ලෝඩ් කිරීම
      modelRef.current = await tmImage.load(modelPath, metadataPath);
      maxPredictionsRef.current = modelRef.current.getTotalClasses();

      // යූසර්ගේ වෙබ් කැමරාව ලබා ගැනීම
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 }, 
        audio: false 
      });
      
      localStreamRef.current = stream;
      if (cameraFeedRef.current) {
        cameraFeedRef.current.srcObject = stream;
      }
      
      setIsCameraActive(true);
      setModelLoading(false);
      setLiveTranslation('සැබෑ සජීවී AI ස්කෑන් කිරීම ක්‍රියාත්මකයි! සංඥා කරන්න... 🤟');

      // රියල්-ටයිම් අනාවැකි කියන ලූප් එක ස්ටාර්ට් කිරීම
      animationFrameIdRef.current = requestAnimationFrame(predictLoop);
    } catch (err) {
      console.error("AI Camera Loading Error:", err);
      setLiveTranslation('මොඩලය සක්‍රීය කිරීම අසාර්ථකයි. Link එක නිවැරදිදැයි පරීක්ෂා කරන්න.');
      setModelLoading(false);
    }
  };

  // කැමරා ෆ්‍රේම් එකෙන් එක අරන් AI එකට අනාවැකි කියන්න දීම
  const predictLoop = async () => {
    if (cameraFeedRef.current && modelRef.current && localStreamRef.current) {
      const prediction = await modelRef.current.predict(cameraFeedRef.current);
      
      // ඉහළම ප්‍රතිශතයක් ලැබුණු Class එක සොයා ගැනීම
      let highestPrediction = { className: "", probability: 0 };
      for (let i = 0; i < maxPredictionsRef.current; i++) {
        if (prediction[i].probability > highestPrediction.probability) {
          highestPrediction = prediction[i];
        }
      }

      // 85% කට වඩා නිවැරදි නම් සහ එය Neutral නොවන්නේ නම් පමණක් ස්ක්‍රීන් එකට දමන්න
      if (highestPrediction.probability > 0.85 && highestPrediction.className !== "Neutral") {
        const sinhalaText = SINHALA_CLASS_MAP[highestPrediction.className] || highestPrediction.className;
        
        setLiveTranslation(current => {
          if (current !== sinhalaText) {
            addToHistory(sinhalaText);
          }
          return sinhalaText;
        });
      }
      
      animationFrameIdRef.current = requestAnimationFrame(predictLoop);
    }
  };

  const addToHistory = (sinhalaPhrase) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTranslationHistory(prev => [`[${timestamp}] ${sinhalaPhrase}`, ...prev.slice(0, 3)]);
  };

  const stopCameraScanner = () => {
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (cameraFeedRef.current) cameraFeedRef.current.srcObject = null;
    
    setIsCameraActive(false);
    setLiveTranslation('කැමරාව සහ AI මොඩලය වසා ඇත.');
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
          <h3>📸 Face-to-Face AI Sign Scanner</h3>
          <button className="exit-btn" onClick={onClose} disabled={modelLoading}>✕</button>
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
              <button className="activate-cam-btn" onClick={startCameraScanner} disabled={modelLoading}>
                {modelLoading ? "මොඩලය සූදානම් වෙමින්..." : "සැබෑ AI කැමරාව පණගන්වන්න"}
              </button>
            </div>
          )}

          {isCameraActive && (
            <div className="live-hud-caption">
              <span className="hud-tag">LIVE TRANSLATION</span>
              <p className="hud-text">{liveTranslation}</p>
            </div>
          )}
        </div>

        {isCameraActive && (
          <div className="translator-actions">
            <button className="stop-scan-btn" onClick={stopCameraScanner}>
              🛑 ස්කෑන් කිරීම නවත්වන්න
            </button>
          </div>
        )}

        <div className="history-log-section">
          <h4>📋 මෑතකදී හඳුනාගත් වාක්‍ය (History Log)</h4>
          <div className="history-box">
            {translationHistory.length === 0 ? (
              <p className="empty-history-text">කැමරාව ඉදිරියේ සංඥා කරන විට ඒවා මෙහි සුරැකේ...</p>
            ) : (
              translationHistory.map((log, index) => (
                <div key={index} className="history-item-row">{log}</div>
              ))
            )}
          </div>
        </div>

        <div className="user-guide-footer">
          💡 <b>නොමිලේ උපදෙස:</b> සංඥා නිවැරදිව හඳුනා ගැනීමට දෑත් හොඳින් කැමරාවට පෙන්වන්න.
        </div>
      </div>
    </div>
  );
};

export default InPersonTranslator;