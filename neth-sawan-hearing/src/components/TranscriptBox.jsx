// src/components/TranscriptBox.jsx
import React, { useRef, useEffect, useState } from 'react';
import { 
  FiMic, FiMicOff, FiTrash2, FiMaximize2, FiMinimize2, 
  FiCopy, FiCheck, FiInfo, FiActivity, FiGlobe 
} from 'react-icons/fi';
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
  currentLang,
  retryListening,
  microphonePermission,
  recognitionStatus,
  supported,
  onTranscriptChange
}) => {
  const scrollRef = useRef(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [showBraille, setShowBraille] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [typedText, setTypedText] = useState('');

  const languageOptions = [
    { code: 'si-LK', label: 'සිංහල', flag: '🇱🇰' },
    { code: 'en-US', label: 'English', flag: '🇺🇸' },
    { code: 'ta-LK', label: 'தமிழ்', flag: '🇱🇰' }
  ];

  // Auto-scroll to bottom on new transcripts
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, typedText]);

  const handleCopy = async () => {
    const textToCopy = typedText ? `${transcript}\n\n[Typed]: ${typedText}` : transcript;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const changeFontSize = (delta) => {
    setFontSize(prev => Math.max(14, Math.min(36, prev + delta)));
  };

  const convertToBraille = (text) => {
    if (!text) return '';
    const brailleMap = {
      'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠗', 'i': '⠊', 'j': '⠚',
      'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
      'u': '⠥', 'v': '⠪', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵', ' ': ' ', '.': '⠲', ',': '⠂'
    };
    return text.toLowerCase().split('').map(char => brailleMap[char] || char).join('');
  };

  return (
    <div className={`transcript-card ${isListening ? 'listening-active' : ''}`}>
      
      {/* ===== HEADER ===== */}
      <div className="transcript-header">
        <div className="header-left">
          <span className="header-icon">🎤</span>
          <span className="header-title">Live Captioning</span>
          <div className="live-indicator-wrapper">
            <span className={`live-dot ${isListening ? 'pulse' : ''}`}></span>
            <span className="live-text">{isListening ? 'LIVE' : 'OFFLINE'}</span>
          </div>
        </div>

        <div className="header-right">
          {/* Language Selection Dropdown */}
          <div className="lang-select-container">
            <FiGlobe className="globe-icon" />
            <select 
              className="lang-select"
              value={currentLang || 'en-US'} 
              onChange={(e) => setLang(e.target.value)}
            >
              {languageOptions.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>

          <button className={`diag-toggle ${showDiagnostics ? 'active' : ''}`} onClick={() => setShowDiagnostics(!showDiagnostics)} title="Diagnostics">
            <FiActivity />
          </button>
          <button className={`braille-toggle ${showBraille ? 'active' : ''}`} onClick={() => setShowBraille(!showBraille)} title="Braille Mode">
            ⠃
          </button>
          <div className="font-controls">
            <button onClick={() => changeFontSize(-2)} title="Decrease Font"><FiMinimize2 /></button>
            <span className="font-size-display">{fontSize}px</span>
            <button onClick={() => changeFontSize(2)} title="Increase Font"><FiMaximize2 /></button>
          </div>
          <button className="copy-btn" onClick={handleCopy} disabled={!transcript && !typedText} title="Copy All">
            {copySuccess ? <FiCheck style={{ color: '#00FF88' }} /> : <FiCopy />}
          </button>
          <button className="clear-btn" onClick={() => { clearTranscript(); setTypedText(''); }} disabled={!transcript && !typedText} title="Clear">
            <FiTrash2 />
          </button>
        </div>
      </div>

      {/* ===== DIAGNOSTICS ===== */}
      {showDiagnostics && (
        <div className="diagnostics-panel">
          <div className="diag-grid">
            <div className="diag-item"><span className="diag-label">Status:</span> <span className={`diag-val status-${recognitionStatus}`}>{recognitionStatus}</span></div>
            <div className="diag-item"><span className="diag-label">Mic Auth:</span> <span className={`diag-val perm-${microphonePermission}`}>{microphonePermission || 'unknown'}</span></div>
            <div className="diag-item"><span className="diag-label">Engine:</span> <span className="diag-val font-mono">{browserInfo}</span></div>
            <div className="diag-item"><span className="diag-label">Language:</span> <span className="diag-val font-mono">{currentLang}</span></div>
          </div>
        </div>
      )}

      {/* ===== ERROR BANNER ===== */}
      {error && (
        <div className="error-message">
          <div className="error-text">
            <FiInfo className="error-icon" />
            <span>{error}</span>
          </div>
          {microphonePermission === 'denied' && (
            <button className="error-retry-btn" onClick={retryListening}>Retry Access</button>
          )}
        </div>
      )}

      {/* ===== MAIN CAPTION DISPLAY AREA ===== */}
      <div className="transcript-body" ref={scrollRef} style={{ fontSize: `${fontSize}px` }}>
        {!transcript && !typedText ? (
          <div className="placeholder-container">
            <div className="placeholder-icon">🎙️</div>
            <div className="placeholder-text">
              {currentLang === 'si-LK' 
                ? 'කථනය ආරම්භ කරන්න. සජීවී අක්ෂර මෙහි දිස්වනු ඇත...' 
                : 'Click "Start" and speak. Captions will render in real-time...'}
            </div>
          </div>
        ) : (
          <div className="transcript-text-container">
            <p className="transcript-text">
              {showBraille ? convertToBraille(transcript) : transcript}
            </p>
            {typedText && (
              <div className="typed-text-section">
                <span className="typed-tag">Manual Input:</span>
                <p className="typed-content">{showBraille ? convertToBraille(typedText) : typedText}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== FOOTER CONTROLS ===== */}
      <div className="transcript-footer">
        <button 
          className={`action-btn-main ${isListening ? 'stop' : 'start'}`}
          onClick={isListening ? stopListening : startListening}
          disabled={!supported}
        >
          {isListening ? (
            <>
              <FiMicOff className="btn-icon" />
              <span>Stop Captioning</span>
            </>
          ) : (
            <>
              <FiMic className="btn-icon" />
              <span>Start Captioning</span>
            </>
          )}
        </button>
      </div>

      {/* ===== SINHALA MANUAL TYPING COMPONENT ===== */}
      {currentLang === 'si-LK' && (
        <div className="sinhala-typing-extension">
          <div className="extension-header">✍️ සිංහල ටයිපින් සහය (Singlish Transliteration)</div>
          <textarea
            className="sinhala-input"
            placeholder="methana singlish valin type කරන්න... (e.g., ammaa -> අම්මා)"
            value={typedText}
            onChange={(e) => {
              setTypedText(e.target.value);
              if (onTranscriptChange) onTranscriptChange(e.target.value);
            }}
          />
        </div>
      )}

    </div>
  );
};

export default TranscriptBox;