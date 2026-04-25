import React, { useRef, useEffect, useState } from 'react';

const TranscriptBox = ({ 
  transcript, 
  isListening, 
  startListening, 
  stopListening, 
  clearTranscript, 
  error 
}) => {
  const scrollRef = useRef(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [showBraille, setShowBraille] = useState(false);

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
      ' ': '⠀', '.': '⠲', ',': '⠂', '?': '⠦', '!': '⠖', ';': '⠰', ':': '⠒', "'": '⠄', '"': '⠦⠄'
    };
    return text.split('').map(char => brailleMap[char] || char).join('');
  };

  return (
    <div className="transcript-card">
      <div className="transcript-header">
        <div className="header-left">
          <span className="header-icon">📝</span>
          <span className="header-title">Live Captions</span>
          {isListening && (
            <div className="live-badge">
              <span className="pulse-dot"></span>
              <span>LIVE</span>
            </div>
          )}
        </div>
        <div className="header-right">
          <button 
            className={`header-btn ${showBraille ? 'active' : ''}`}
            onClick={() => setShowBraille(!showBraille)}
            title="Braille"
          >
            ⠿
          </button>
          {transcript && (
            <button className="header-btn" onClick={copyToClipboard} title="Copy">
              {copySuccess ? '✓' : '⎘'}
            </button>
          )}
          {transcript && (
            <button className="header-btn clear" onClick={clearTranscript} title="Clear">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="transcript-content" ref={scrollRef}>
        {transcript ? (
          <p className="transcript-text" style={{ fontSize: `${fontSize}px` }}>
            {transcript}
          </p>
        ) : (
          <div className="placeholder-container">
            <div className="placeholder-icon">🎤</div>
            <p className="placeholder-text">
              {isListening
                ? '👂 Listening... Speak clearly'
                : '🎙️ Press "Start Listening" below'}
            </p>
          </div>
        )}
      </div>

      {showBraille && transcript && (
        <div className="braille-display">
          <div className="braille-header">
            <span>⠿ Braille</span>
          </div>
          <div className="braille-text">{toBraille(transcript.slice(-150))}</div>
        </div>
      )}

      <div className="font-controls">
        <button className="font-btn" onClick={() => setFontSize(Math.max(14, fontSize - 2))}>A-</button>
        <span className="font-value">{fontSize}px</span>
        <button className="font-btn" onClick={() => setFontSize(Math.min(28, fontSize + 2))}>A+</button>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="transcript-controls">
        {!isListening ? (
          <button className="btn-start" onClick={startListening}>
            🎤 Start Listening
          </button>
        ) : (
          <button className="btn-stop" onClick={stopListening}>
            ⏹️ Stop Listening
          </button>
        )}
      </div>

      {isListening && (
        <div className="listening-status">
          <div className="wave-animation">
            <span></span><span></span><span></span><span></span>
          </div>
          <span>Microphone active - Speak now</span>
        </div>
      )}
    </div>
  );
};

export default TranscriptBox;