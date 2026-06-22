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
  'NO': { asl: '👎', description: 'Tap index and middle together' },

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
  'CAT': { asl: '🐈', description: 'Fingers stroking whiskers' },
  'BIRD': { asl: '🐦', sinhala: 'කුරුල්ලා', description: 'Fingers at mouth like beak' },
  'FISH': { asl: '🐟', sinhala: 'මාළුවා', description: 'Hand swimming motion' }
};

// Quick sign list for easy access
const QUICK_SIGNS = ['HELP', 'WATER', 'THANK YOU', 'YES', 'NO', 'EMERGENCY', 'POLICE', 'DOCTOR', 'STOP', 'LOVE'];

// ===== SCRIPT DETECTION =====
const isSinhala = (char) => {
  const code = char.charCodeAt(0);
  return code >= 0x0D80 && code <= 0x0DFF;
};

const isLatin = (char) => {
  return /[A-Za-z]/.test(char);
};

const detectScript = (text) => {
  if (!text) return 'unknown';
  const chars = text.replace(/\s/g, '').split('');
  const sinhalaCount = chars.filter(c => isSinhala(c)).length;
  const latinCount = chars.filter(c => isLatin(c)).length;
  if (sinhalaCount > latinCount) return 'sinhala';
  if (latinCount > sinhalaCount) return 'latin';
  return 'unknown';
};

const SignLanguageBox = ({ transcript, currentWord }) => {
  // ===== STATE =====
  const [currentSign, setCurrentSign] = useState(null);
  const [signHistory, setSignHistory] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recentSigns, setRecentSigns] = useState([]);
  const [isFingerspelling, setIsFingerspelling] = useState(false);
  const [lettersArray, setLettersArray] = useState([]);
  const [activeWord, setActiveWord] = useState('');
  const [scrollLeft, setScrollLeft] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [displayMode, setDisplayMode] = useState('sign');

  const lastSignRef = useRef(null);
  const speechRef = useRef(null);
  const historyEndRef = useRef(null);
  const infoScrollRef = useRef(null);
  const rowRef = useRef(null);

  // ===== DETERMINE INPUT SOURCE =====
  const inputText = currentWord || transcript || '';

  // Helper function to remove modifiers / පිලි අකුරු during fingerspelling
  const getBaseLetters = (text) => {
    if (!text) return [];
    const cleanedText = text.toLowerCase().replace(/\s/g, '');
    const singleCharArray = Array.from(cleanedText);
    const modifiers = ['ා', 'ැ', 'ෑ', 'ි', 'ී', 'ු', 'ූ', 'ෘ', 'ෙ', 'ේ', 'ෛ', 'ො', 'ෝ', 'ෞ', '්', 'ෲ', 'ෟ', '්‍ය'];
    return singleCharArray.filter(char => !modifiers.includes(char));
  };

  // ===== UPDATE SIGN BASED ON INPUT =====
  useEffect(() => {
    if (!inputText || !inputText.trim()) {
      setCurrentSign(null);
      setIsFingerspelling(false);
      setDisplayMode('sign');
      return;
    }

    const cleanInput = inputText.trim().toUpperCase();

    // Check if the entire phrase or word exists in dictionary
    let found = null;
    const words = cleanInput.split(/\s+/);

    if (SIGN_DICTIONARY[cleanInput]) {
      found = { key: cleanInput, data: SIGN_DICTIONARY[cleanInput] };
    } else {
      for (const word of words) {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (SIGN_DICTIONARY[cleanWord]) {
          found = { key: cleanWord, data: SIGN_DICTIONARY[cleanWord] };
          break;
        }
      }
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
      setDisplayMode('sign');

      if (lastSignRef.current !== found.key) {
        setRecentSigns(prev => {
          const filtered = prev.filter(item => item.key !== found.key);
          return [{ key: found.key, data: found.data }, ...filtered].slice(0, 8);
        });
        lastSignRef.current = found.key;

        setSignHistory(prev => {
          const newEntry = {
            word: found.key,
            sinhala: found.data.sinhala,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          };
          if (prev.length > 0 && prev[prev.length - 1].word === found.key) return prev;
          return [...prev, newEntry].slice(-10);
        });
      }

      const timer = setTimeout(() => {
        setCurrentSign(prev => prev?.word === found.key ? null : prev);
      }, 5000);
      return () => clearTimeout(timer);
    }

    // ===== NO DICTIONARY MATCH – DECIDE MODE =====
    const script = detectScript(cleanInput);
    const letters = getBaseLetters(inputText);

    // If script is not Latin or Sinhala, just show as text (no fingerspelling)
    if (script === 'unknown' && letters.length > 0) {
      setActiveWord(cleanInput);
      setIsFingerspelling(false);
      setDisplayMode('text');
      setCurrentSign({
        word: cleanInput,
        sinhala: 'Unsupported script',
        description: 'Sign not available for this text',
        asl: '🧩'
      });
      return;
    }

    // If it's Sinhala or Latin, try fingerspelling
    if (letters.length > 0) {
      setActiveWord(cleanInput);
      setLettersArray(letters);
      setIsFingerspelling(true);
      setDisplayMode('fingerspell');
      setCurrentSign({
        word: cleanInput,
        sinhala: 'අකුරු සංඥා කිරීම',
        description: 'Fingerspelling – signing each letter individually',
        asl: '🔤'
      });
      setScrollLeft(0);
      if (rowRef.current) {
        rowRef.current.scrollLeft = 0;
      }
    } else {
      setCurrentSign(null);
      setIsFingerspelling(false);
      setDisplayMode('sign');
    }
  }, [inputText]);

  // ===== UPDATE MAX SCROLL =====
  useEffect(() => {
    if (rowRef.current && isFingerspelling) {
      const { scrollWidth, clientWidth } = rowRef.current;
      setMaxScroll(Math.max(0, scrollWidth - clientWidth));
      setScrollLeft(rowRef.current.scrollLeft);
    }
  }, [lettersArray, isFingerspelling]);

  // ===== SCROLL EVENT LISTENER =====
  useEffect(() => {
    if (rowRef.current && isFingerspelling) {
      const handleScroll = () => {
        setScrollLeft(rowRef.current.scrollLeft);
      };
      const row = rowRef.current;
      row.addEventListener('scroll', handleScroll);
      return () => row.removeEventListener('scroll', handleScroll);
    }
  }, [isFingerspelling]);

  // ===== SCROLL FUNCTION =====
  const scrollRow = (direction) => {
    if (!rowRef.current) return;
    const container = rowRef.current;
    const firstItem = container.querySelector('.fingerspell-item');
    const itemWidth = firstItem ? firstItem.offsetWidth + 12 : 150;
    const scrollAmount = Math.max(itemWidth * 2, 150);
    const newScrollLeft = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    container.scrollTo({
      left: Math.max(0, Math.min(newScrollLeft, maxScroll)),
      behavior: 'smooth'
    });
  };

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
      setDisplayMode('sign');
      speakSign(key);
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
    setDisplayMode('sign');
    speakSign(item.word);
    setTimeout(() => {
      setCurrentSign(prev => prev?.word === item.word ? null : prev);
    }, 4000);
  };

  // ===== RENDER FINGERSPELLING =====
  const renderFingerspelling = () => {
    const isLong = lettersArray.length > 8;

    return (
      <div className="fingerspell-container">
        <div className={`fingerspell-row ${isLong ? 'long' : ''}`} ref={rowRef}>
          {lettersArray.map((char, idx) => {
            const letterChar = char.toLowerCase();
            return (
              <div key={idx} className="fingerspell-item">
                <img
                  src={`/assets/signs/${letterChar}.png`}
                  alt={`Sign for ${letterChar}`}
                  className="fingerspell-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%23F5C842' stroke-width='2'><path d='M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h11z'/><path d='M19 15l4-3-4-3v6z'/></svg>";
                  }}
                />
                <span className="fingerspell-label">{char.toUpperCase()}</span>
              </div>
            );
          })}
        </div>
        {/* Scroll Buttons */}
        {isLong && (
          <div className="fingerspell-scroll-buttons">
            <button 
              className="scroll-btn scroll-left" 
              onClick={() => scrollRow('left')}
              disabled={scrollLeft <= 0}
              aria-label="Scroll left"
            >
              ‹
            </button>
            <button 
              className="scroll-btn scroll-right" 
              onClick={() => scrollRow('right')}
              disabled={scrollLeft >= maxScroll - 1}
              aria-label="Scroll right"
            >
              ›
            </button>
          </div>
        )}
        <div className="fingerspell-hint">
          <span>🔤 {lettersArray.length} letters</span>
        </div>
      </div>
    );
  };

  // ===== RENDER TEXT MODE (for unsupported scripts) =====
  const renderTextMode = () => {
    return (
      <div className="text-mode-container">
        <div className="text-mode-icon">🧩</div>
        <div className="text-mode-word">{activeWord}</div>
        <div className="text-mode-hint">Sign not available for this script</div>
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
        {displayMode === 'fingerspell' && <span className="sign-badge fingerspell">🔤 Fingerspelling</span>}
        {displayMode === 'sign' && currentSign && <span className="sign-badge live">✅ Word</span>}
        {displayMode === 'text' && <span className="sign-badge" style={{ background: 'rgba(255,136,0,0.15)', color: '#FF8800' }}>📝 Text</span>}
      </div>

      {/* ===== MAIN DISPLAY ===== */}
      <div className="sign-display-panel">
        {currentSign ? (
          <div className="sign-active-content">
            <div className="sign-graphic-wrapper">
              {displayMode === 'fingerspell' ? renderFingerspelling() : 
               displayMode === 'text' ? renderTextMode() :
               (
                <div className="sign-avatar-animation">
                  <span className="sign-icon-large">{currentSign.asl}</span>
                  <div className="sign-icon-pulse"></div>
                </div>
              )}
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

      {/* ===== INFO FOOTER ===== */}
      {currentSign && (
        <div className="sign-info-footer" ref={infoScrollRef}>
          <div className="sign-info-scroll">
            <div className="sign-word-group">
              <span className="sign-word">{displayWord}</span>
              <span className="sign-sinhala">{currentSign.sinhala}</span>
            </div>
            <p className="sign-description">
              <strong>How to sign:</strong> {currentSign.description}
            </p>
            {displayMode !== 'text' && (
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
            )}
          </div>
        </div>
      )}

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

      {/* ===== RECENT SIGNS ===== */}
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
          {displayMode === 'fingerspell' && ' 🔤 Words not in dictionary are shown letter by letter.'}
          {displayMode === 'text' && ' 📝 This script is not supported for fingerspelling yet.'}
        </p>
      </div>

    </div>
  );
};

export default SignLanguageBox;