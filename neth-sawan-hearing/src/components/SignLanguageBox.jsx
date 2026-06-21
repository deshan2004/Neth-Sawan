// src/components/SignLanguageBox.jsx
import React, { useState, useEffect, useRef } from 'react';
import './SignLanguageBox.css';

// Complete dictionary for sign language translation
const SIGN_DICTIONARY = {
  // Greetings & Politeness
  'HELLO': { asl: '👋', sinhala: 'ආයුබෝවන්', description: 'Wave hand from forehead outward' },
  'THANK YOU': { asl: '🙏', sinhala: 'ස්තුතියි', description: 'Fingers to chin, move forward' },
  'THANK': { asl: '🙏', sinhala: 'ස්තුතියි', description: 'Fingers to chin, move forward' },
  'PLEASE': { asl: '🤲', sinhala: 'කරුණාකර', description: 'Flat hand circles on chest' },
  'SORRY': { asl: '😔', sinhala: 'සමාවන්න', description: 'Fist circles on chest' },
  'YES': { asl: '👍', sinhala: 'ඔව්', description: 'Nodding fist' },
  'NO': { asl: '👎', sinhala: 'නැහැ', description: 'Tap index and middle together' },

  // Emergency
  'HELP': { asl: '🤝👍', sinhala: 'උදව්', description: 'One hand taps other palm, then thumbs up' },
  'EMERGENCY': { asl: '✊✊😟', sinhala: 'හදිසි අවස්ථාව', description: 'Fists shake, worried face' },
  'POLICE': { asl: '👮', sinhala: 'පොලිසිය', description: 'Badge tap on chest' },
  'DOCTOR': { asl: '👨‍⚕️', sinhala: 'වෛද්‍ය', description: 'Wrist pulse motion' },
  'HOSPITAL': { asl: '🏥', sinhala: 'රෝහල', description: 'Crossed arms on chest' },
  'AMBULANCE': { asl: '🚑', sinhala: 'ගිලන් රථය', description: 'C‑hand rotating near shoulder' },
  'FIRE': { asl: '🔥', sinhala: 'ගිනි', description: 'Wiggling fingers upward' },
  'DANGER': { asl: '⚠️', sinhala: 'අනතුරුදායක', description: 'Index finger draws Z shape' },
  'SAFE': { asl: '✅', sinhala: 'ආරක්ෂිත', description: 'Two hands making a house shape' },

  // Basic needs
  'WATER': { asl: '💧', sinhala: 'වතුර', description: 'W shape taps chin' },
  'FOOD': { asl: '🍔', sinhala: 'කෑම', description: 'Fingers tap mouth' },
  'EAT': { asl: '🍽️', sinhala: 'කන්න', description: 'Fingers to mouth' },
  'DRINK': { asl: '🥤', sinhala: 'බොන්න', description: 'C‑shaped hand to mouth' },
  'SLEEP': { asl: '😴', sinhala: 'නිදාගන්න', description: 'Hand over face then cheek' },

  // People & Places
  'PERSON': { asl: '👤', sinhala: 'පුද්ගලයා', description: 'Index finger pointing down, then up' },
  'PEOPLE': { asl: '👥', sinhala: 'මිනිසුන්', description: 'Circle motion with both hands' },
  'MAN': { asl: '👨', sinhala: 'මිනිසා', description: 'Hand on forehead like hat brim' },
  'WOMAN': { asl: '👩', sinhala: 'ගැහැනිය', description: 'Thumb tracing chin line' },
  'CHILD': { asl: '🧒', sinhala: 'දරුවා', description: 'Hand indicating height' },
  'FAMILY': { asl: '👨‍👩‍👧', sinhala: 'පවුල', description: 'Circle hands then spread' },
  'FRIEND': { asl: '👫', sinhala: 'මිතුරා', description: 'Two fingers hook then pull' },
  'TEACHER': { asl: '👩‍🏫', sinhala: 'ගුරුවරයා', description: 'Hands together then point' },

  // Actions
  'WALK': { asl: '🚶', sinhala: 'ඇවිදිනවා', description: 'Two fingers walking motion' },
  'RUN': { asl: '🏃', sinhala: 'දුවනවා', description: 'Two fingers running motion' },
  'SIT': { asl: '🪑', sinhala: 'වාඩි වෙනවා', description: 'Two fingers over two' },
  'STAND': { asl: '🧍', sinhala: 'නැගිටිනවා', description: 'Two fingers up' },
  'READ': { asl: '📖', sinhala: 'කියවනවා', description: 'Hands like holding book' },
  'WRITE': { asl: '✍️', sinhala: 'ලියනවා', description: 'Writing motion' },
  'TALK': { asl: '💬', sinhala: 'කතා කරනවා', description: 'Fingers at mouth' },

  // Emotions
  'HAPPY': { asl: '😊', sinhala: 'සතුටුයි', description: 'Pat chest in circular motion' },
  'SAD': { asl: '😢', sinhala: 'දුකයි', description: 'Fingers drag down face' },
  'ANGRY': { asl: '😠', sinhala: 'තරහයි', description: 'Claw hand to face' },
  'SCARED': { asl: '😨', sinhala: 'බයයි', description: 'Hands on chest, open mouth' },
  'LOVE': { asl: '🤟', sinhala: 'ආදරය', description: 'Cross arms over chest' },

  // Common objects
  'CAR': { asl: '🚗', sinhala: 'රථය', description: 'Steering wheel motion' },
  'HOUSE': { asl: '🏠', sinhala: 'ගෙදර', description: 'Fingers touch to make roof shape' },
  'HOME': { asl: '🏡', sinhala: 'නිවස', description: 'Fingers touch cheek then thumb' },
  'PHONE': { asl: '📱', sinhala: 'දුරකථනය', description: 'C‑shaped hand to ear' },
  'COMPUTER': { asl: '💻', sinhala: 'පරිගණකය', description: 'Hands typing motion' },
  'BOOK': { asl: '📖', sinhala: 'පොත', description: 'Hands opening like book' },
  'MONEY': { asl: '💰', sinhala: 'මුදල්', description: 'Tap palm then slap' },
  'SCHOOL': { asl: '🏫', sinhala: 'පාසල', description: 'Clap hands then flat' },
  'TREE': { asl: '🌳', sinhala: 'ගස', description: 'Elbow on hand, fingers spread' },
  'FLOWER': { asl: '🌸', sinhala: 'මල', description: 'Fingers touching nose then spread' },
  'ANIMAL': { asl: '🐾', sinhala: 'සත්ව', description: 'Hands on chest like paws' },
  'DOG': { asl: '🐕', sinhala: 'බල්ලා', description: 'Snap fingers then pat leg' },
  'CAT': { asl: '🐈', sinhala: 'බළලා', description: 'Fingers stroking whiskers' },
  'BIRD': { asl: '🐦', sinhala: 'කුරුල්ලා', description: 'Fingers at mouth like beak' },
  'FISH': { asl: '🐟', sinhala: 'මාළුවා', description: 'Hand swimming motion' }
};

const SignLanguageBox = ({ transcript }) => {
  const [currentSign, setCurrentSign] = useState(null);
  const [signHistory, setSignHistory] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recentSigns, setRecentSigns] = useState([]);
  const lastSignRef = useRef(null);
  const speechRef = useRef(null);

  // Update sign based on transcript
  useEffect(() => {
    if (!transcript) {
      setCurrentSign(null);
      return;
    }

    const words = transcript.toUpperCase().split(/\s+/);
    let found = null;
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].replace(/[^\w]/g, '');
      if (SIGN_DICTIONARY[clean]) {
        found = { key: clean, data: SIGN_DICTIONARY[clean] };
        break;
      }
    }
    if (!found) {
      const upper = transcript.toUpperCase();
      for (let phrase of Object.keys(SIGN_DICTIONARY)) {
        if (phrase.includes(' ') && upper.includes(phrase)) {
          found = { key: phrase, data: SIGN_DICTIONARY[phrase] };
          break;
        }
      }
    }

    if (found) {
      setCurrentSign(found);
      // Add to recent signs (avoid duplicates in a row)
      if (lastSignRef.current !== found.key) {
        setRecentSigns(prev => {
          const filtered = prev.filter(item => item.key !== found.key);
          return [found, ...filtered].slice(0, 8);
        });
        lastSignRef.current = found.key;
      }
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setCurrentSign(prev => prev === found ? null : prev);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      if (currentSign) {
        const timer = setTimeout(() => setCurrentSign(null), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [transcript]);

  // Speak the sign word aloud
  const speakSign = (word) => {
    if (!window.speechSynthesis) {
      return;
    }
    // Cancel any ongoing speech
    if (speechRef.current) {
      window.speechSynthesis.cancel();
      speechRef.current = null;
    }
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      speechRef.current = null;
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      speechRef.current = null;
    };
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    speechRef.current = null;
  };

  // Handle click on history item
  const handleHistoryClick = (item) => {
    setCurrentSign(item);
    speakSign(item.key);
    setTimeout(() => {
      setCurrentSign(prev => prev === item ? null : prev);
    }, 4000);
  };

  return (
    <div className="sign-language-card">
      {/* Main Display Area */}
      <div className="sign-main-display">
        {currentSign ? (
          <div className="sign-active">
            <div className="sign-icon-container">
              <div className="sign-icon-large">{currentSign.data.asl}</div>
              <div className="sign-icon-pulse"></div>
            </div>
            <div className="sign-info-container">
              <div className="sign-word-group">
                <h3 className="sign-word">{currentSign.key}</h3>
                <span className="sign-sinhala">{currentSign.data.sinhala}</span>
              </div>
              <p className="sign-description">{currentSign.data.description}</p>
              <button
                className={`sign-speak-btn ${isSpeaking ? 'active' : ''}`}
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    speakSign(currentSign.key);
                  }
                }}
              >
                {isSpeaking ? '🔊 Speaking...' : '🔊 Listen'}
              </button>
            </div>
          </div>
        ) : (
          <div className="sign-waiting">
            <div className="sign-waiting-icon">🤟</div>
            <p className="sign-waiting-text">
              Speak a word like <strong>HELP</strong>, <strong>WATER</strong>, <strong>THANK YOU</strong>
            </p>
            <p className="sign-waiting-sub">I'll show you the sign language</p>
            <div className="sign-example-words">
              {['HELP', 'WATER', 'FOOD', 'POLICE', 'DOCTOR', 'HAPPY', 'YES', 'NO'].map(word => (
                <span
                  key={word}
                  className="example-word"
                  onClick={() => {
                    const data = SIGN_DICTIONARY[word];
                    if (data) {
                      const item = { key: word, data };
                      setCurrentSign(item);
                      speakSign(word);
                      setTimeout(() => setCurrentSign(null), 4000);
                    }
                  }}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Signs History */}
      {recentSigns.length > 0 && (
        <div className="sign-history-section">
          <div className="sign-history-header">
            <span className="history-icon">📜</span>
            <span className="history-title">Recent Signs</span>
          </div>
          <div className="sign-history-list">
            {recentSigns.map((item, idx) => (
              <div
                key={idx}
                className={`sign-history-item ${currentSign?.key === item.key ? 'active' : ''}`}
                onClick={() => handleHistoryClick(item)}
              >
                <span className="history-sign">{item.data.asl}</span>
                <span className="history-word">{item.key}</span>
                <span className="history-meaning">{item.data.sinhala}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Reference */}
      <div className="sign-quick-reference">
        <div className="quick-header">
          <span>📖</span>
          <span>Common Signs</span>
        </div>
        <div className="quick-grid">
          {['HELP', 'WATER', 'THANK YOU', 'YES', 'NO', 'EMERGENCY', 'POLICE', 'DOCTOR'].map(key => {
            const data = SIGN_DICTIONARY[key];
            if (!data) return null;
            return (
              <div
                key={key}
                className="quick-item"
                onClick={() => {
                  const item = { key, data };
                  setCurrentSign(item);
                  speakSign(key);
                  setTimeout(() => setCurrentSign(null), 4000);
                }}
              >
                <span className="quick-sign">{data.asl}</span>
                <span className="quick-label">{key}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guide */}
      <div className="sign-guide">
        <span className="guide-icon">💡</span>
        <p className="guide-text">
          Speak naturally – I'll detect key words and show their sign language translation.
          Click <strong>🔊 Listen</strong> to hear the word spoken aloud.
        </p>
      </div>

      <style jsx>{`
        .sign-language-card {
          background: rgba(13, 17, 40, 0.6);
          backdrop-filter: blur(12px);
          border-radius: 24px;
          padding: 20px;
          border: 1px solid rgba(245, 200, 66, 0.15);
          transition: all 0.3s;
        }
        .sign-language-card:hover {
          border-color: rgba(245, 200, 66, 0.3);
        }

        /* Main Display */
        .sign-main-display {
          min-height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sign-active {
          display: flex;
          align-items: center;
          gap: 30px;
          width: 100%;
          padding: 10px 0;
          animation: signFadeIn 0.4s ease;
        }

        @keyframes signFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .sign-icon-container {
          position: relative;
          flex-shrink: 0;
        }

        .sign-icon-large {
          font-size: 80px;
          animation: signFloat 2s ease-in-out infinite;
          display: block;
        }

        @keyframes signFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .sign-icon-pulse {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          border: 2px solid rgba(0, 221, 179, 0.2);
          animation: signPulse 2s ease-in-out infinite;
        }

        @keyframes signPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0; }
        }

        .sign-info-container {
          flex: 1;
        }

        .sign-word-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }

        .sign-word {
          font-size: 28px;
          font-weight: 800;
          color: #00DDB3;
          margin: 0;
        }

        .sign-sinhala {
          font-size: 16px;
          color: #F5C842;
          font-weight: 500;
          background: rgba(245, 200, 66, 0.1);
          padding: 2px 14px;
          border-radius: 40px;
        }

        .sign-description {
          font-size: 14px;
          color: #A0A8D0;
          margin: 6px 0 12px 0;
        }

        .sign-speak-btn {
          background: rgba(0, 221, 179, 0.1);
          border: 1px solid rgba(0, 221, 179, 0.3);
          border-radius: 40px;
          padding: 6px 18px;
          color: #00DDB3;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sign-speak-btn:hover {
          background: rgba(0, 221, 179, 0.2);
          transform: translateY(-1px);
        }

        .sign-speak-btn.active {
          background: rgba(255, 51, 85, 0.15);
          border-color: #FF3355;
          color: #FF3355;
          animation: pulseBtn 1s infinite;
        }

        @keyframes pulseBtn {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        /* Waiting State */
        .sign-waiting {
          text-align: center;
          padding: 20px 0;
        }

        .sign-waiting-icon {
          font-size: 64px;
          display: block;
          margin-bottom: 12px;
          animation: signWaitPulse 2s ease-in-out infinite;
        }

        @keyframes signWaitPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 1; }
        }

        .sign-waiting-text {
          font-size: 16px;
          color: #D0D8FF;
          margin: 0 0 4px 0;
        }

        .sign-waiting-text strong {
          color: #F5C842;
        }

        .sign-waiting-sub {
          font-size: 13px;
          color: #8899CC;
          margin: 0 0 16px 0;
        }

        .sign-example-words {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }

        .example-word {
          background: rgba(255, 255, 255, 0.05);
          padding: 6px 16px;
          border-radius: 40px;
          font-size: 13px;
          font-weight: 500;
          color: #A0A8D0;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .example-word:hover {
          background: rgba(0, 221, 179, 0.15);
          color: #00DDB3;
          border-color: rgba(0, 221, 179, 0.3);
          transform: translateY(-2px);
        }

        /* History Section */
        .sign-history-section {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .sign-history-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .history-icon {
          font-size: 16px;
        }

        .history-title {
          font-size: 13px;
          font-weight: 600;
          color: #8899CC;
        }

        .sign-history-list {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 4px 0 8px 0;
        }

        .sign-history-list::-webkit-scrollbar {
          height: 3px;
        }
        .sign-history-list::-webkit-scrollbar-track {
          background: transparent;
        }
        .sign-history-list::-webkit-scrollbar-thumb {
          background: #00DDB3;
          border-radius: 4px;
        }

        .sign-history-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px 6px 10px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 40px;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          border: 1px solid transparent;
        }

        .sign-history-item:hover {
          background: rgba(0, 221, 179, 0.1);
          transform: translateY(-2px);
        }

        .sign-history-item.active {
          background: rgba(0, 221, 179, 0.15);
          border-color: rgba(0, 221, 179, 0.3);
        }

        .history-sign {
          font-size: 22px;
        }

        .history-word {
          font-size: 13px;
          font-weight: 600;
          color: #D0D8FF;
        }

        .history-meaning {
          font-size: 11px;
          color: #8899CC;
        }

        /* Quick Reference */
        .sign-quick-reference {
          margin-top: 16px;
          padding: 14px 16px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
        }

        .quick-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #00DDB3;
          margin-bottom: 10px;
        }

        .quick-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 8px;
        }

        .quick-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 4px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .quick-item:hover {
          background: rgba(0, 221, 179, 0.1);
          border-color: rgba(0, 221, 179, 0.2);
          transform: translateY(-2px);
        }

        .quick-sign {
          font-size: 28px;
        }

        .quick-label {
          font-size: 10px;
          font-weight: 600;
          color: #A0A8D0;
          margin-top: 2px;
          text-align: center;
        }

        /* Guide */
        .sign-guide {
          margin-top: 16px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(68, 136, 255, 0.06);
          border-radius: 12px;
          border-left: 3px solid #4488FF;
        }

        .guide-icon {
          font-size: 16px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .guide-text {
          font-size: 12px;
          color: #A0A8D0;
          margin: 0;
          line-height: 1.5;
        }

        .guide-text strong {
          color: #00DDB3;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sign-language-card {
            padding: 16px;
          }
          .sign-active {
            flex-direction: column;
            text-align: center;
            gap: 16px;
          }
          .sign-icon-large {
            font-size: 64px;
          }
          .sign-word {
            font-size: 22px;
          }
          .sign-word-group {
            justify-content: center;
          }
          .sign-description {
            text-align: center;
          }
          .sign-waiting-text {
            font-size: 14px;
          }
          .quick-grid {
            grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
          }
          .history-meaning {
            display: none;
          }
          .sign-history-item {
            padding: 4px 12px 4px 8px;
          }
        }

        @media (max-width: 480px) {
          .sign-language-card {
            padding: 12px;
          }
          .sign-icon-large {
            font-size: 52px;
          }
          .sign-word {
            font-size: 18px;
          }
          .sign-sinhala {
            font-size: 13px;
          }
          .example-word {
            font-size: 11px;
            padding: 4px 12px;
          }
          .quick-grid {
            grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
            gap: 6px;
          }
          .quick-sign {
            font-size: 22px;
          }
          .quick-label {
            font-size: 9px;
          }
        }
      `}</style>
    </div>
  );
};

export default SignLanguageBox;