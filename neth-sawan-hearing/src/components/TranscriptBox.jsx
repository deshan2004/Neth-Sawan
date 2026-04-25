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
  const [fontSize, setFontSize] = useState(16);
  const [showBraille, setShowBraille] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [micPermission, setMicPermission] = useState(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    checkMobile();
  }, []);

  // Auto-scroll to bottom when new text arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Check microphone permission on mobile
  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      return true;
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setMicPermission('denied');
      } else if (err.name === 'NotFoundError') {
        setMicPermission('notfound');
      } else {
        setMicPermission('error');
      }
      return false;
    }
  };

  // Copy transcript to clipboard
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

  // Enhanced start listening for mobile
  const handleStartListening = async () => {
    // On mobile, request permission first
    if (isMobile) {
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) {
        if (micPermission === 'denied') {
          alert('Microphone access is blocked. Please enable it in your browser settings.');
        } else if (micPermission === 'notfound') {
          alert('No microphone found on your device.');
        } else {
          alert('Please allow microphone access to use speech recognition.');
        }
        return;
      }
    }
    
    // Call the parent startListening
    await startListening();
  };

  // Braille conversion (Grade 1 Braille for English letters)
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

  // Get last few words for quick actions
  const lastWords = transcript.split(' ').slice(-5).join(' ');

  return (
    <div className="transcript-card">
      {/* Header Section */}
      <div className="transcript-header">
        <div className="header-left">
          <span className="header-icon">📝</span>
          <span className="header-title">Live Captions & Transcription</span>
          {isListening && (
            <div className="live-badge">
              <span className="pulse-dot"></span>
              <span>LIVE</span>
            </div>
          )}
        </div>
        <div className="header-right">
          {/* Braille Toggle Button */}
          <button 
            className={`header-btn ${showBraille ? 'active' : ''}`}
            onClick={() => setShowBraille(!showBraille)}
            title="Toggle Braille Display"
          >
            ⠿
          </button>
          
          {/* Copy Button */}
          {transcript && (
            <button 
              className="header-btn" 
              onClick={copyToClipboard}
              title="Copy to clipboard"
            >
              {copySuccess ? '✓' : '⎘'}
            </button>
          )}
          
          {/* Clear Button */}
          {transcript && (
            <button 
              className="header-btn clear" 
              onClick={clearTranscript}
              title="Clear all text"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Transcript Content */}
      <div className="transcript-content" ref={scrollRef}>
        {transcript ? (
          <div className="transcript-text-wrapper">
            <p className="transcript-text" style={{ fontSize: `${fontSize}px` }}>
              {transcript}
            </p>
            
            {/* Word Count */}
            <div className="transcript-stats">
              <span>📊 {transcript.split(/\s+/).filter(w => w.trim()).length} words</span>
              <span>🔤 {transcript.length} characters</span>
            </div>
          </div>
        ) : (
          <div className="placeholder-container">
            <div className="placeholder-icon">🎤</div>
            <p className="placeholder-text">
              {isListening
                ? 'Listening... Speak clearly and the text will appear here'
                : isMobile 
                  ? 'Tap "Start Listening" and speak into your phone\'s microphone'
                  : 'Press "Start Listening" below, then speak to see captions'}
            </p>
            <div className="example-phrases">
              <small>Try saying: "Hello, how are you?" or "I need help please"</small>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Warning / Info */}
      {isMobile && !isListening && !transcript && micPermission !== 'granted' && (
        <div className="mobile-warning">
          <span>📱</span>
          <div>
            <strong>Mobile Microphone Required</strong>
            <small>When you tap "Start Listening", your browser will ask for microphone permission. Please allow it for speech recognition to work.</small>
          </div>
        </div>
      )}

      {/* Braille Display */}
      {showBraille && transcript && (
        <div className="braille-display">
          <div className="braille-header">
            <span className="braille-icon">⠿</span>
            <span>Braille Translation (Grade 1)</span>
          </div>
          <div className="braille-text">
            {toBraille(transcript.slice(-200))}
          </div>
          <div className="braille-note">
            <small>Last 200 characters shown in Braille</small>
          </div>
        </div>
      )}

      {/* Font Size Controls */}
      {transcript && (
        <div className="font-controls">
          <span className="font-label">Text size:</span>
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
            onClick={() => setFontSize(Math.min(28, fontSize + 2))}
            disabled={fontSize >= 28}
          >
            A+
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Control Buttons */}
      <div className="transcript-controls">
        {!isListening ? (
          <button className="btn-start" onClick={handleStartListening}>
            <span className="btn-icon">🎤</span>
            <span className="btn-text">Start Listening</span>
            <span className="btn-hint">Microphone required</span>
          </button>
        ) : (
          <button className="btn-stop" onClick={stopListening}>
            <span className="btn-icon">⏹️</span>
            <span className="btn-text">Stop Listening</span>
            <span className="btn-hint">Click to end session</span>
          </button>
        )}
      </div>

      {/* Listening Status Indicator */}
      {isListening && (
        <div className="listening-status">
          <div className="wave-animation">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="status-info">
            <span className="status-text">Microphone is active</span>
            <span className="status-subtext">Speak clearly at moderate pace</span>
          </div>
          <div className="volume-indicator">
            <div className="volume-bar"></div>
          </div>
        </div>
      )}

      {/* Quick Actions - Last spoken words */}
      {lastWords && lastWords !== ' ' && (
        <div className="quick-actions">
          <span className="quick-label">Last spoken:</span>
          <div className="quick-words">
            <span className="last-words">"{lastWords}"</span>
          </div>
        </div>
      )}

      {/* Tips for better recognition */}
      {!isListening && !transcript && (
        <div className="tips-section">
          <div className="tips-header">
            <span>💡 Tips for better speech recognition</span>
          </div>
          <div className="tips-list">
            <span>• Speak clearly and at a normal pace</span>
            <span>• Reduce background noise</span>
            <span>• Hold phone closer to your mouth</span>
            <span>• Speak in short phrases</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptBox;