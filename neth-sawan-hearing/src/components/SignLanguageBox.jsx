// src/components/SignLanguageBox.jsx
import React, { useState, useEffect, useRef } from 'react';
import './SignLanguageBox.css';

// ===== COMPLETE SIGN DICTIONARY =====
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
  'DOCTOR': { asl: '🥼', sinhala: 'වෛද්‍ය', description: 'Tap fingertips on inside of wrist' },
  'HOSPITAL': { asl: '🏥', sinhala: 'රෝහල', description: 'Draw a cross on shoulder with index/middle fingers' },
  'AMBULANCE': { asl: '🚑', sinhala: 'ගිලන් රථය', description: 'C‑hand rotating near shoulder' },
  'FIRE': { asl: '🔥', sinhala: 'ගිනි', description: 'Wiggling fingers upward' },
  'DANGER': { asl: '⚠️', sinhala: 'අනතුරුදායක', description: 'Hand moves sharply downwards with warning face' },
  'SAFE': { asl: '✅', sinhala: 'ආරක්ෂිත', description: 'Two hands making a house shape' },
  'STOP': { asl: '✋', sinhala: 'නවතින්න', description: 'Extend flat palm forward sharply' },

  // Basic needs
  'WATER': { asl: '💧', sinhala: 'වතුර', description: 'W shape taps chin' },
  'FOOD': { asl: '🍔', sinhala: 'කෑම', description: 'Fingers tap mouth' },
  'EAT': { asl: '🍽️', sinhala: 'කන්න', description: 'Fingers to mouth' },
  'DRINK': { asl: '🥤', sinhala: 'බොන්න', description: 'C‑shaped hand to mouth' },
  'SLEEP': { asl: '😴', sinhala: 'නිදාගන්න', description: 'Hand over face then cheek' },
  'WHERE': { asl: '❓', sinhala: 'කොහේද', description: 'Shake index finger side to side' },
  'NAME': { asl: '🏷️', sinhala: 'නම', description: 'Tap index and middle fingers of both hands crosswise' },
  'GOOD': { asl: '😊👍', sinhala: 'හොඳයි', description: 'Flat hand moves from lips down to other flat hand' },

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

// Quick sign list for easy access
const QUICK_SIGNS = ['HELP', 'WATER', 'THANK YOU', 'YES', 'NO', 'EMERGENCY', 'POLICE', 'DOCTOR', 'STOP', 'LOVE'];

const SignLanguageBox = ({ transcript, currentWord }) => {
  // ===== STATE =====
  const [currentSign, setCurrentSign] = useState(null);
  const [signHistory, setSignHistory] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recentSigns, setRecentSigns] = useState([]);
  const [isFingerspelling, setIsFingerspelling] = useState(false);
  const [lettersArray, setLettersArray] = useState([]);
  const [currentLetterIdx, setCurrentLetterIdx] = useState(0);
  const [activeWord, setActiveWord] = useState('');

  const lastSignRef = useRef(null);
  const speechRef = useRef(null);
  const historyEndRef = useRef(null);

  // ===== DETERMINE INPUT SOURCE =====
  // Use currentWord if provided, otherwise use transcript
  const inputText = currentWord || transcript || '';

  // ===== UPDATE SIGN BASED ON INPUT =====
  useEffect(() => {
    if (!inputText || !inputText.trim()) {
      setCurrentSign(null);
      setIsFingerspelling(false);
      return;
    }

    const cleanInput = inputText.trim().toUpperCase();

    // Check if the entire phrase or word exists in dictionary
    let found = null;
    const words = cleanInput.split(/\s+/);

    // First try to match the whole input
    if (SIGN_DICTIONARY[cleanInput]) {
      found = { key: cleanInput, data: SIGN_DICTIONARY[cleanInput] };
    } else {
      // Then try to match individual words (take the first match)
      for (const word of words) {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (SIGN_DICTIONARY[cleanWord]) {
          found = { key: cleanWord, data: SIGN_DICTIONARY[cleanWord] };
          break;
        }
      }
      // Check for multi-word phrases (e.g., "THANK YOU")
      if (!found) {
        for (const phrase of Object.keys(SIGN_DICTIONARY)) {
          if (phrase.includes(' ') && cleanInput.includes(phrase)) {
            found = { key: phrase, data: SIGN_DICTIONARY[phrase] };
            break;
          }
        }
      }
    }

    if (found) {
      setActiveWord(found.key);
      setCurrentSign({ word: found.key, ...found.data });
      setIsFingerspelling(false);

      // Add to recent signs (avoid duplicates in a row)
      if (lastSignRef.current !== found.key) {
        setRecentSigns(prev => {
          const filtered = prev.filter(item => item.key !== found.key);
          return [{ key: found.key, data: found.data }, ...filtered].slice(0, 8);
        });
        lastSignRef.current = found.key;

        // Add to history with timestamp
        setSignHistory(prev => {
          const newEntry = {
            word: found.key,
            sinhala: found.data.sinhala,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          };
          // Avoid duplicate consecutive entries
          if (prev.length > 0 && prev[prev.length - 1].word === found.key) return prev;
          return [...prev, newEntry].slice(-10);
        });
      }

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setCurrentSign(prev => prev?.word === found.key ? null : prev);
      }, 5000);
      return () => clearTimeout(timer);
    }

    // ===== FINGERSPELLING MODE (word not in dictionary) =====
    // Extract letters (handles both Sinhala and English)
    const letters = Array.from(cleanInput.replace(/\s/g, ''));
    if (letters.length > 0) {
      setActiveWord(cleanInput);
      setLettersArray(letters);
      setCurrentLetterIdx(0);
      setIsFingerspelling(true);
      setCurrentSign({
        word: cleanInput,
        sinhala: 'අකුරු සංඥා කිරීම',
        description: 'Fingerspelling – signing each letter individually',
        asl: '🔤'
      });
    } else {
      setCurrentSign(null);
      setIsFingerspelling(false);
    }
  }, [inputText]);

  // ===== FINGERSPELLING LETTER TIMER =====
  useEffect(() => {
    if (!isFingerspelling || lettersArray.length === 0) return;

    const interval = setInterval(() => {
      setCurrentLetterIdx(prev => (prev + 1) % lettersArray.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [isFingerspelling, lettersArray]);

  // ===== AUTO-SCROLL HISTORY =====
  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [signHistory]);

  // ===== TEXT-TO-SPEECH =====
  const speakSign = (word) => {
    if (!window.speechSynthesis) return;
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
    utterance.onend = () => { setIsSpeaking(false); speechRef.current = null; };
    utterance.onerror = () => { setIsSpeaking(false); speechRef.current = null; };
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    speechRef.current = null;
  };

  // ===== HANDLE QUICK SIGN CLICK =====
  const handleQuickSign = (key) => {
    const data = SIGN_DICTIONARY[key];
    if (data) {
      const item = { key, data };
      setCurrentSign({ word: key, ...data });
      setIsFingerspelling(false);
      speakSign(key);
      // Also add to recent signs
      setRecentSigns(prev => {
        const filtered = prev.filter(i => i.key !== key);
        return [item, ...filtered].slice(0, 8);
      });
      setSignHistory(prev => {
        const newEntry = {
          word: key,
          sinhala: data.sinhala,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        if (prev.length > 0 && prev[prev.length - 1].word === key) return prev;
        return [...prev, newEntry].slice(-10);
      });
      setTimeout(() => {
        setCurrentSign(prev => prev?.word === key ? null : prev);
      }, 4000);
    }
  };

  // ===== HANDLE HISTORY ITEM CLICK =====
  const handleHistoryClick = (item) => {
    setCurrentSign({ word: item.word, ...item });
    setIsFingerspelling(false);
    speakSign(item.word);
    setTimeout(() => {
      setCurrentSign(prev => prev?.word === item.word ? null : prev);
    }, 4000);
  };

  // ===== RENDER FINGERSPELLING LETTER =====
  const renderFingerspellingLetter = () => {
    const letter = lettersArray[currentLetterIdx]?.toUpperCase() || '?';
    return (
      <div className="fingerspell-container">
        <div className="fingerspell-letter">{letter}</div>
        <div className="fingerspell-hint">
          <span>🔤 {currentLetterIdx + 1}/{lettersArray.length}</span>
        </div>
      </div>
    );
  };

  // ===== DETERMINE CURRENT DISPLAY WORD =====
  const displayWord = currentSign?.word || activeWord || '';

  return (
    <div className="sign-language-card">

      {/* ===== HEADER ===== */}
      <div className="sign-card-header">
        <div className="sign-header-title-group">
          <span className="sign-header-dot animated"></span>
          <h3 className="sign-title">🤟 Sign Language Translator</h3>
        </div>
        {isFingerspelling && <span className="sign-badge fingerspell">🔤 Fingerspelling</span>}
        {!isFingerspelling && currentSign && <span className="sign-badge live">✅ Word</span>}
      </div>

      {/* ===== MAIN DISPLAY ===== */}
      <div className="sign-display-panel">
        {currentSign ? (
          <div className="sign-active-content">
            <div className="sign-graphic-wrapper">
              {isFingerspelling ? renderFingerspellingLetter() : (
                <div className="sign-avatar-animation">
                  <span className="sign-icon-large">{currentSign.asl}</span>
                  <div className="sign-icon-pulse"></div>
                </div>
              )}
            </div>

            <div className="sign-info-text">
              <div className="sign-word-group">
                <h4 className="sign-word">{displayWord}</h4>
                <span className="sign-sinhala">{currentSign.sinhala}</span>
              </div>
              <p className="sign-description">
                <strong>How to sign:</strong> {currentSign.description}
              </p>
              <button
                className={`sign-speak-btn ${isSpeaking ? 'active' : ''}`}
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    speakSign(displayWord);
                  }
                }}
              >
                {isSpeaking ? '🔊 Speaking...' : '🔊 Listen'}
              </button>
            </div>
          </div>
        ) : (
          <div className="sign-waiting-state">
            <div className="sign-waiting-pulse">
              <span className="sign-icon-large passive">🤟</span>
            </div>
            <p className="sign-waiting-text">
              {inputText ? 'Searching for sign...' : 'Speak or type a word to see sign language'}
            </p>
            <p className="sign-waiting-sub">Try: HELP, WATER, THANK YOU</p>
          </div>
        )}
      </div>

      {/* ===== QUICK SIGNS ===== */}
      <div className="sign-quick-actions">
        <span className="quick-label">📖 Quick Signs:</span>
        <div className="quick-grid">
          {QUICK_SIGNS.map((key) => (
            <button
              key={key}
              className={`quick-sign-btn ${currentSign?.word === key ? 'active' : ''}`}
              onClick={() => handleQuickSign(key)}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* ===== RECENT SIGNS HISTORY ===== */}
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
                className={`sign-history-item ${currentSign?.word === item.key ? 'active' : ''}`}
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

      {/* ===== SESSION HISTORY ===== */}
      <div className="sign-history-footer">
        <h5 className="history-title">📋 Session History</h5>
        <div className="sign-history-scroll">
          {signHistory.length === 0 ? (
            <div className="history-empty">No signs detected in this session yet.</div>
          ) : (
            signHistory.map((item, idx) => (
              <div key={idx} className="sign-history-item session-item">
                <span className="history-indicator"></span>
                <span className="history-word">{item.word}</span>
                <span className="history-meaning">({item.sinhala})</span>
                <span className="history-time">{item.time}</span>
              </div>
            ))
          )}
          <div ref={historyEndRef} />
        </div>
      </div>

      {/* ===== GUIDE ===== */}
      <div className="sign-guide">
        <span className="guide-icon">💡</span>
        <p className="guide-text">
          <strong>Two ways to use:</strong> Speak naturally (captions) or type a word directly.
          Click <strong>🔊 Listen</strong> to hear the word spoken aloud.
          {isFingerspelling && ' 🔤 Words not in dictionary are fingerspelled letter by letter.'}
        </p>
      </div>

      {/* ===== STYLES ===== */}
      <style>{`
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

        .sign-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sign-header-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sign-header-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #00DDB3;
          display: inline-block;
        }
        .sign-header-dot.animated {
          animation: livePulse 1.2s infinite;
        }
        .sign-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0;
        }

        .sign-badge {
          padding: 4px 12px;
          border-radius: 40px;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .sign-badge.live {
          background: rgba(0, 221, 179, 0.15);
          color: #00DDB3;
          border: 1px solid rgba(0, 221, 179, 0.3);
        }
        .sign-badge.fingerspell {
          background: rgba(245, 200, 66, 0.15);
          color: #F5C842;
          border: 1px solid rgba(245, 200, 66, 0.3);
        }

        .sign-display-panel {
          min-height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 0;
        }

        .sign-active-content {
          display: flex;
          align-items: center;
          gap: 30px;
          width: 100%;
          animation: signFadeIn 0.4s ease;
        }
        @keyframes signFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .sign-graphic-wrapper {
          flex-shrink: 0;
        }

        .sign-icon-large {
          font-size: 80px;
          display: block;
          animation: signFloat 2s ease-in-out infinite;
        }
        .sign-icon-large.passive {
          animation: none;
          opacity: 0.5;
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

        .sign-avatar-animation {
          position: relative;
        }

        .sign-info-text {
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

        /* Fingerspelling */
        .fingerspell-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .fingerspell-letter {
          font-size: 3.5rem;
          font-weight: 800;
          color: #F5C842;
          text-shadow: 0 0 20px rgba(245, 200, 66, 0.3);
          min-width: 80px;
          text-align: center;
        }
        .fingerspell-hint {
          font-size: 0.7rem;
          color: #8899CC;
        }

        /* Waiting State */
        .sign-waiting-state {
          text-align: center;
          padding: 10px 0;
        }
        .sign-waiting-pulse {
          animation: signWaitPulse 2s ease-in-out infinite;
          display: inline-block;
        }
        @keyframes signWaitPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        .sign-waiting-text {
          font-size: 16px;
          color: #D0D8FF;
          margin: 8px 0 4px 0;
        }
        .sign-waiting-text strong { color: #F5C842; }
        .sign-waiting-sub {
          font-size: 13px;
          color: #8899CC;
          margin: 0;
        }

        /* Quick Actions */
        .sign-quick-actions {
          margin-top: 16px;
          padding: 14px 16px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
        }
        .quick-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #8899CC;
          margin-bottom: 10px;
        }
        .quick-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .quick-sign-btn {
          padding: 4px 14px;
          border-radius: 40px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #D0D8FF;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .quick-sign-btn:hover {
          background: rgba(0, 221, 179, 0.1);
          color: #00DDB3;
          border-color: rgba(0, 221, 179, 0.2);
          transform: translateY(-2px);
        }
        .quick-sign-btn.active {
          background: rgba(0, 221, 179, 0.15);
          color: #00DDB3;
          border-color: #00DDB3;
        }

        /* Recent Signs */
        .sign-history-section {
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .sign-history-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .history-icon { font-size: 16px; }
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
        .history-sign { font-size: 22px; }
        .history-word {
          font-size: 13px;
          font-weight: 600;
          color: #D0D8FF;
        }
        .history-meaning {
          font-size: 11px;
          color: #8899CC;
        }

        /* Session History */
        .sign-history-footer {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
        }
        .sign-history-footer .history-title {
          font-size: 12px;
          color: #8899CC;
          margin-bottom: 8px;
        }
        .sign-history-scroll {
          max-height: 80px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sign-history-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .sign-history-scroll::-webkit-scrollbar-thumb {
          background: #00DDB3;
          border-radius: 4px;
        }
        .sign-history-item.session-item {
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: default;
        }
        .history-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00DDB3;
          flex-shrink: 0;
        }
        .history-time {
          font-size: 0.6rem;
          color: #5C628A;
          font-family: monospace;
          margin-left: auto;
        }
        .history-empty {
          font-size: 0.75rem;
          color: #5C628A;
          text-align: center;
          padding: 10px 0;
        }

        /* Guide */
        .sign-guide {
          margin-top: 14px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(68, 136, 255, 0.06);
          border-radius: 12px;
          border-left: 3px solid #4488FF;
        }
        .guide-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
        .guide-text {
          font-size: 12px;
          color: #A0A8D0;
          margin: 0;
          line-height: 1.5;
        }
        .guide-text strong { color: #00DDB3; }

        /* Animations */
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sign-language-card { padding: 16px; }
          .sign-active-content {
            flex-direction: column;
            text-align: center;
            gap: 16px;
          }
          .sign-icon-large { font-size: 64px; }
          .sign-word { font-size: 22px; }
          .sign-word-group { justify-content: center; }
          .sign-description { text-align: center; }
          .sign-waiting-text { font-size: 14px; }
          .quick-grid { justify-content: center; }
          .fingerspell-letter { font-size: 2.8rem; }
          .history-meaning { display: none; }
          .sign-history-item { padding: 4px 12px 4px 8px; }
        }

        @media (max-width: 480px) {
          .sign-language-card { padding: 12px; }
          .sign-icon-large { font-size: 52px; }
          .sign-word { font-size: 18px; }
          .sign-sinhala { font-size: 13px; }
          .quick-sign-btn { font-size: 0.65rem; padding: 3px 10px; }
          .fingerspell-letter { font-size: 2.2rem; }
          .sign-title { font-size: 0.95rem; }
        }
      `}</style>
    </div>
  );
};

export default SignLanguageBox;