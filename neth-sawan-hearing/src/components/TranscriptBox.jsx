import React, { useEffect, useRef, useState } from 'react';

const BRAILLE = {
  A:'⠁',B:'⠃',C:'⠉',D:'⠙',E:'⠑',F:'⠋',G:'⠛',H:'⠓',I:'⠊',J:'⠚',
  K:'⠅',L:'⠇',M:'⠍',N:'⠝',O:'⠕',P:'⠏',Q:'⠟',R:'⠗',S:'⠎',T:'⠞',
  U:'⠥',V:'⠧',W:'⠺',X:'⠭',Y:'⠽',Z:'⠵',
  ' ':'⠀','.':'⠲',',':'⠂','?':'⠦','!':'⠖',
};

const toBraille = (text) =>
  text.toUpperCase().split('').map(c => BRAILLE[c] || c).join('');

const TranscriptBox = ({
  transcript, isListening,
  startListening, stopListening,
  clearTranscript, error,
}) => {
  const scrollRef = useRef(null);
  const [braille, setBraille] = useState(false);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [transcript]);

  const copy = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript).then(() =>
      alert('Transcript copied to clipboard.')
    );
  };

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <span className="card-title-icon icon-teal">📝</span>
          Live Transcript
          {isListening && <span style={{ fontSize:11, color:'var(--teal)', marginLeft:6, fontWeight:400 }}>listening…</span>}
        </div>
        <div className="card-actions">
          <button
            className="btn-icon"
            onClick={() => setBraille(b => !b)}
            title="Toggle Braille Display"
            style={braille ? { background:'var(--teal-lt)', color:'var(--teal)', borderColor:'rgba(0,207,168,0.4)' } : {}}
          >
            ⠿
          </button>
          {transcript && (
            <button className="btn-icon" onClick={copy} title="Copy transcript">
              ⎘
            </button>
          )}
          <button className="btn-icon danger" onClick={clearTranscript} title="Clear">
            ✕
          </button>
        </div>
      </div>

      <div className="transcript-body" ref={scrollRef}>
        {transcript ? (
          <p className="transcript-text">{transcript}</p>
        ) : (
          <p className="placeholder-text">
            {isListening
              ? 'Listening — speak clearly…'
              : 'Press "Start Listening" below, then speak.'}
          </p>
        )}
      </div>

      {braille && transcript && (
        <div className="braille-box">
          <span className="braille-lbl">Braille Output — Grade 1</span>
          <div className="braille-chars">{toBraille(transcript.slice(-100))}</div>
        </div>
      )}

      {error && <div className="error-bar">{error}</div>}

      <div className="controls-row">
        {!isListening ? (
          <button
            className="btn btn-teal btn-full"
            onClick={startListening}
            disabled={!!(error && error.includes('not supported'))}
          >
            Start Listening
          </button>
        ) : (
          <button className="btn btn-red btn-full" onClick={stopListening}>
            Stop Listening
          </button>
        )}
      </div>

      {isListening && (
        <div className="hint-row">
          <span>Speak clearly and at a moderate pace.</span>
        </div>
      )}
    </div>
  );
};

export default TranscriptBox;