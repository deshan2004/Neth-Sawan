import React, { useState } from 'react';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const getUrl = (letter) =>
  `https://raw.githubusercontent.com/fawwaz/asl-alphabet/master/assets/alphabet/${letter}.png`;

const SignLanguageBox = ({ transcript }) => {
  const [learning, setLearning] = useState(false);
  const [selected, setSelected] = useState('A');
  const [errors, setErrors]     = useState({});

  const onError = (letter) => setErrors(p => ({ ...p, [letter]: true }));

  const lastLetter = (() => {
    const m = (transcript || '').match(/[a-zA-Z]/g);
    return m ? m[m.length - 1].toUpperCase() : null;
  })();

  return (
    <div className="card">
      <div className="sign-head card-head">
        <div className="card-title">
          <span className="card-title-icon icon-amber">✋</span>
          Sign Language
        </div>
        <button
          className={`btn btn-xs ${learning ? 'btn-outline-amber' : 'btn-ghost'}`}
          onClick={() => setLearning(l => !l)}
        >
          {learning ? 'Learning Mode' : 'Normal Mode'}
        </button>
      </div>

      {learning ? (
        <>
          <div className="abc-grid">
            {ALPHABET.map(l => (
              <button
                key={l}
                className={`abc-btn ${selected === l ? 'sel' : ''}`}
                onClick={() => setSelected(l)}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="sign-learn-panel">
            {!errors[selected] ? (
              <img
                src={getUrl(selected)}
                alt={`ASL sign for ${selected}`}
                className="sign-img-lg"
                onError={() => onError(selected)}
              />
            ) : (
              <div className="sign-placeholder-lg">
                <span className="big-letter">{selected}</span>
                <span>No image available</span>
              </div>
            )}
            <p className="sign-hint-text">Sign for the letter "{selected}"</p>
          </div>
        </>
      ) : (
        <div className="sign-display">
          {lastLetter ? (
            <div className="sign-frame">
              {!errors[lastLetter] ? (
                <img
                  src={getUrl(lastLetter)}
                  alt={`ASL ${lastLetter}`}
                  className="sign-img"
                  onError={() => onError(lastLetter)}
                />
              ) : (
                <div style={{
                  width: 110, height: 110, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: 'rgba(0,0,0,0.18)',
                  borderRadius: 10, border: '1px dashed var(--border-base)',
                }}>
                  <span style={{ fontSize: 48, fontWeight: 800, color: 'var(--teal)', opacity: 0.35 }}>
                    {lastLetter}
                  </span>
                </div>
              )}
              <div className="sign-char-badge">{lastLetter}</div>
              <p className="sign-hint-text">Last spoken letter</p>
            </div>
          ) : (
            <div className="sign-empty">
              <div className="big-icon">✋</div>
              <p style={{ fontSize:13 }}>Speak a letter A–Z to see its sign.</p>
              <p style={{ fontSize:11, marginTop:4 }}>Or switch to Learning Mode to explore.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SignLanguageBox;