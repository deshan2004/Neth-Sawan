import React, { useRef, useEffect, useState } from 'react';
import './TranscriptBox.css';

const TranscriptBox = ({ 
  transcript, 
  isListening, 
  startListening, 
  stopListening, 
  clearTranscript, 
  error,
  browserInfo,
  setLang,
  currentLang
}) => {
  const scrollRef = useRef(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [showBraille, setShowBraille] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const languageOptions = [
    { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
    { code: 'si-LK', label: 'Sinhala (සිංහල)', flag: '🇱🇰' },
    { code: 'te-IN', label: 'Telugu (తెలుగు)', flag: '🇮🇳' }
  ];

  useEffect(() => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const copyToClipboard = async () => {
    if (!transcript) return;
    try {
      await navigator.clipboard.writeText(transcript);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toBraille = (text) => {
    const brailleMap = {
      'A': '⠁', 'B': '⠃', 'C': '⠉', 'D': '⠙', 'E': '⠑', 'F': '⠋', 'G': '⠛', 'H': '⠓', 'I': '⠊', 'J': '⠚',
      'K': '⠅', 'L': '⠇', 'M': '⠍', 'N': '⠝', 'O': '⠕', 'P': '⠏', 'Q': '⠟', 'R': '⠗', 'S': '⠎', 'T': '⠞',
      'U': '⠥', 'V': '⠧', 'W': '⠺', 'X': '⠭', 'Y': '⠽', 'Z': '⠵',
      'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
      'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
      'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
      '0': '⠴', '1': '⠂', '2': '⠆', '3': '⠒', '4': '⠲', '5': '⠢', '6': '⠖', '7': '⠶', '8': '⠦', '9': '⠔',
      ' ': ' ', '.': '⠲', ',': '⠂', '?': '⠦', '!': '⠖', ';': '⠰', ':': '⠒', "'": '⠄', '"': '⠦⠄'
    };
    return text.split('').map(char => brailleMap[char] || char).join('');
  };

  const lastWords = transcript.split(' ').slice(-5).join(' ');

  return (
    <div className="transcript-card">
      <div className="transcript-header">
        <div className="header-left">
          <span className="header-icon">🎤</span>
          <span className="header-title">Live Captions</span>
          {isListening && <div className="live-badge"><span className="pulse-dot"></span><span>LIVE</span></div>}
        </div>
        <div className="header-right">
          <select 
            className="lang-selector"
            value={currentLang}
            onChange={(e) => setLang(e.target.value)}
            disabled={isListening}
          >
            {languageOptions.map(opt => (
              <option key={opt.code} value={opt.code}>{opt.flag} {opt.label}</option>
            ))}
          </select>
          <button className={`header-btn ${showBraille ? 'active' : ''}`} onClick={() => setShowBraille(!showBraille)} title="Braille">⠿</button>
          {transcript && <button className="header-btn" onClick={copyToClipboard} title="Copy">{copySuccess ? '✓' : '📋'}</button>}
          {transcript && <button className="header-btn clear" onClick={clearTranscript} title="Clear">✕</button>}
        </div>
      </div>

      <div className="transcript-content" ref={scrollRef}>
        {transcript ? (
          <div className="transcript-text-wrapper">
            <p className="transcript-text" style={{ fontSize: `${fontSize}px` }}>{transcript}</p>
            <div className="transcript-stats">
              <span>📊 {transcript.split(/\s+/).filter(w => w.trim()).length} words</span>
              <span>🔤 {transcript.length} characters</span>
            </div>
          </div>
        ) : (
          <div className="placeholder-container">
            <div className="placeholder-icon">🎤</div>
            <p className="placeholder-text">{isListening ? 'Listening... Speak clearly' : 'Press "Start Listening" below'}</p>
          </div>
        )}
      </div>

      {showBraille && transcript && (
        <div className="braille-display">
          <div className="braille-header"><span className="braille-icon">⠿</span><span>Braille (Grade 1, English letters)</span></div>
          <div className="braille-text">{toBraille(transcript.slice(-200))}</div>
          <div className="braille-note"><small>Last 200 characters (English letters only)</small></div>
        </div>
      )}

      {transcript && (
        <div className="font-controls">
          <span className="font-label">Text size:</span>
          <button className="font-btn" onClick={() => setFontSize(Math.max(12, fontSize - 2))} disabled={fontSize <= 12}>A-</button>
          <span className="font-value">{fontSize}px</span>
          <button className="font-btn" onClick={() => setFontSize(Math.min(28, fontSize + 2))} disabled={fontSize >= 28}>A+</button>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="transcript-controls">
        {!isListening ? (
          <button className="btn-start" onClick={startListening}>
            <span className="btn-icon">🎤</span>
            <span className="btn-text">Start Listening</span>
            <span className="btn-hint">Microphone required</span>
          </button>
        ) : (
          <button className="btn-stop" onClick={stopListening}>
            <span className="btn-icon">⏹️</span>
            <span className="btn-text">Stop Listening</span>
            <span className="btn-hint">Click to end</span>
          </button>
        )}
      </div>

      {isListening && (
        <div className="listening-status">
          <div className="wave-animation"><span></span><span></span><span></span><span></span><span></span></div>
          <div className="status-info"><span className="status-text">Microphone active</span><span className="status-subtext">Speak clearly</span></div>
        </div>
      )}

      {lastWords && lastWords !== ' ' && (
        <div className="quick-actions">
          <span className="quick-label">Last spoken:</span>
          <div className="quick-words"><span className="last-words">"{lastWords}"</span></div>
        </div>
      )}
    </div>
  );
};

export default TranscriptBox;