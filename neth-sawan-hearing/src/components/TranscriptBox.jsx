// src/components/TranscriptBox.jsx
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
  currentLang,
  retryListening,        // 👈 For mobile retry
  microphonePermission,  // 👈 Shows mic status
  recognitionStatus,     // 👈 Shows recognition state
  supported              // 👈 Shows if browser supports speech
}) => {
  const scrollRef = useRef(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [showBraille, setShowBraille] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const languageOptions = [
    { code: 'si-LK', label: 'සිංහල', flag: '🇱🇰' },
    { code: 'en-US', label: 'English', flag: '🇺🇸' },
    { code: 'ta-LK', label: 'தமிழ்', flag: '🇱🇰' },
    { code: 'te-IN', label: 'తెలుగు', flag: '🇮🇳' },
    { code: 'hi-IN', label: 'हिंदी', flag: '🇮🇳' }
  ];

  // Auto-scroll to bottom when new transcript arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Copy transcript to clipboard
  const copyToClipboard = async () => {
    if (!transcript) return;
    try {
      await navigator.clipboard.writeText(transcript);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Simple Braille conversion (English letters only)
  const toBraille = (text) => {
    const brailleMap = {
      'A': '⠁', 'B': '⠃', 'C': '⠉', 'D': '⠙', 'E': '⠑',
      'F': '⠋', 'G': '⠛', 'H': '⠓', 'I': '⠊', 'J': '⠚',
      'K': '⠅', 'L': '⠇', 'M': '⠍', 'N': '⠝', 'O': '⠕',
      'P': '⠏', 'Q': '⠟', 'R': '⠗', 'S': '⠎', 'T': '⠞',
      'U': '⠥', 'V': '⠧', 'W': '⠺', 'X': '⠭', 'Y': '⠽',
      'Z': '⠵', 'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙',
      'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊',
      'j': '⠚', 'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝',
      'o': '⠕', 'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎',
      't': '⠞', 'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭',
      'y': '⠽', 'z': '⠵',
      ' ': ' ', '.': '⠲', ',': '⠂', '?': '⠦', '!': '⠖'
    };
    return text.split('').map(char => brailleMap[char] || char).join('');
  };

  const brailleText = transcript ? toBraille(transcript.slice(-200)) : '';

  // Get status text for display
  const getStatusText = () => {
    if (isListening) return '🎤 සවන් දෙමින්...';
    if (recognitionStatus === 'starting') return '⏳ ආරම්භ වෙමින්...';
    if (error) return '⚠️ දෝෂයකි';
    return '⏹ නවතා ඇත';
  };

  return (
    <div className="transcript-card">

      {/* ===== HEADER ===== */}
      <div className="transcript-header">
        <div className="header-left">
          <span className="header-icon">📝</span>
          <span className="header-title">සජීවී පිටපත්</span>
          {isListening && (
            <div className="live-badge">
              <span className="live-dot"></span>
              <span>සජීවී</span>
            </div>
          )}
          {recognitionStatus === 'starting' && (
            <span className="status-badge">⏳ ආරම්භ...</span>
          )}
        </div>
        <div className="header-right">
          <div className="lang-selector-wrapper">
            <span className="lang-icon">🌐</span>
            <select
              className="lang-select"
              value={currentLang || 'si-LK'}
              onChange={(e) => setLang(e.target.value)}
              disabled={isListening}
            >
              {languageOptions.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>
          <button
            className={`diag-toggle ${showDiagnostics ? 'active' : ''}`}
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            title="රෝග විනිශ්චය"
          >
            🔧
          </button>
          <button
            className={`braille-toggle ${showBraille ? 'active' : ''}`}
            onClick={() => setShowBraille(!showBraille)}
            title="බ්‍රේල්"
          >
            ⠿
          </button>
          <button
            className={`copy-btn ${copySuccess ? 'success' : ''}`}
            onClick={copyToClipboard}
            disabled={!transcript}
            title="පිටපත් කරන්න"
          >
            {copySuccess ? '✓' : '📋'}
          </button>
          <button
            className="clear-btn"
            onClick={clearTranscript}
            disabled={!transcript}
            title="හිස් කරන්න"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ===== DIAGNOSTICS PANEL ===== */}
      {showDiagnostics && (
        <div className="diagnostic-panel">
          <h4>🔧 රෝග විනිශ්චය</h4>
          <div className="diagnostic-grid">
            <div className="diagnostic-item">
              <span className="diag-label">බ්‍රවුසරය:</span>
              <span className="diag-value">{browserInfo || 'නොදනී'}</span>
            </div>
            <div className="diagnostic-item">
              <span className="diag-label">කථන හඳුනාගැනීම:</span>
              <span className={`diag-value ${supported ? 'success' : 'danger'}`}>
                {supported ? '✅ සහාය දක්වයි' : '❌ සහාය නැත'}
              </span>
            </div>
            <div className="diagnostic-item">
              <span className="diag-label">මයික්‍රෆෝනය:</span>
              <span className={`diag-value ${microphonePermission === 'granted' ? 'success' : 'danger'}`}>
                {microphonePermission === 'granted' ? '✅ අවසර ලැබී ඇත' :
                 microphonePermission === 'denied' ? '❌ ප්‍රතික්ෂේප කර ඇත' : '⏳ පරීක්ෂා වෙමින්'}
              </span>
            </div>
            <div className="diagnostic-item">
              <span className="diag-label">තත්ත්වය:</span>
              <span className="diag-value highlight">{getStatusText()}</span>
            </div>
            <div className="diagnostic-item">
              <span className="diag-label">HTTPS:</span>
              <span className={`diag-value ${window.location.protocol === 'https:' ? 'success' : 'danger'}`}>
                {window.location.protocol === 'https:' ? '✅' : '❌ (අවශ්‍ය)'}
              </span>
            </div>
          </div>
          <div className="diagnostic-actions">
            <button className="diag-retry-btn" onClick={retryListening}>
              🔄 නැවත උත්සාහ කරන්න
            </button>
            <button className="diag-close-btn" onClick={() => setShowDiagnostics(false)}>
              වසන්න
            </button>
          </div>
        </div>
      )}

      {/* ===== TRANSCRIPT CONTENT ===== */}
      <div className="transcript-content" ref={scrollRef}>
        {showBraille ? (
          <div className="braille-display">
            <div className="braille-header">
              <span>⠿</span>
              <span>බ්‍රේල් (අවසන් අකුරු 200)</span>
            </div>
            <div className="braille-text">{brailleText || 'බ්‍රේල් පෙළක් නැත'}</div>
          </div>
        ) : (
          <div className="transcript-text-wrapper">
            {transcript ? (
              <p className="transcript-text" style={{ fontSize: `${fontSize}px` }}>
                {transcript}
              </p>
            ) : (
              <div className="placeholder-container">
                <div className="placeholder-icon">🎤</div>
                <p className="placeholder-text">
                  {isListening ? 'සවන් දෙමින්... පැහැදිලිව කතා කරන්න' : 'පහත "සවන් දීම ආරම්භ කරන්න" ඔබන්න'}
                </p>
                {!supported && (
                  <p className="placeholder-error">⚠️ මෙම බ්‍රවුසරය කථන හඳුනාගැනීමට සහාය නොදක්වයි.</p>
                )}
                {microphonePermission === 'denied' && (
                  <p className="placeholder-error">🔇 මයික්‍රෆෝන අවසරය ප්‍රතික්ෂේප කර ඇත. "නැවත උත්සාහ කරන්න" ඔබන්න.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== FONT CONTROLS ===== */}
      {transcript && !showBraille && (
        <div className="font-controls">
          <span className="font-label">අකුරු ප්‍රමාණය:</span>
          <button
            className="font-btn"
            onClick={() => setFontSize(Math.max(12, fontSize - 2))}
            disabled={fontSize <= 12}
          >
            A-
          </button>
          <span className="font-value">{fontSize}px</span>
          <button
            className="font-btn"
            onClick={() => setFontSize(Math.min(32, fontSize + 2))}
            disabled={fontSize >= 32}
          >
            A+
          </button>
          <span className="word-count">
            📊 {transcript.split(/\s+/).filter(w => w.trim()).length} වචන
          </span>
          <span className="char-count">
            🔤 {transcript.length} අකුරු
          </span>
        </div>
      )}

      {/* ===== ERROR MESSAGE ===== */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          {(error.includes('denied') || error.includes('service-not-allowed') || 
            error.includes('permission') || error.includes('Microphone')) && (
            <button className="error-retry-btn" onClick={retryListening}>
              🔄 නැවත උත්සාහ කරන්න
            </button>
          )}
        </div>
      )}

      {/* ===== START/STOP CONTROLS ===== */}
      <div className="transcript-controls">
        {!isListening ? (
          <button
            className="btn-start"
            onClick={startListening}
            disabled={!supported}
          >
            <span className="btn-icon">🎤</span>
            <span className="btn-text">සවන් දීම ආරම්භ කරන්න</span>
            <span className="btn-hint">මයික්‍රෆෝනය අවශ්‍යයි</span>
          </button>
        ) : (
          <button className="btn-stop" onClick={stopListening}>
            <span className="btn-icon">⏹️</span>
            <span className="btn-text">සවන් දීම නවත්වන්න</span>
            <span className="btn-hint">අවසන් කිරීමට ඔබන්න</span>
          </button>
        )}
      </div>

      {/* ===== LISTENING STATUS ===== */}
      {isListening && (
        <div className="listening-status">
          <div className="wave-animation">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <div className="status-info">
            <span className="status-text">මයික්‍රෆෝනය ක්‍රියාකාරීයි</span>
            <span className="status-subtext">පැහැදිලිව කතා කරන්න</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptBox;