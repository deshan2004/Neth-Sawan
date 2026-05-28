import React, { useState, useEffect } from 'react';

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
  const [lastWord, setLastWord] = useState('');

  useEffect(() => {
    if (!transcript) {
      setCurrentSign(null);
      return;
    }

    const words = transcript.toUpperCase().split(/\s+/);
    // Find the first word that exists in dictionary (longest match first)
    let found = null;
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      // remove punctuation
      const clean = w.replace(/[^\w]/g, '');
      if (SIGN_DICTIONARY[clean]) {
        found = { key: clean, data: SIGN_DICTIONARY[clean] };
        break;
      }
    }
    // Also check for multi-word phrases like "THANK YOU"
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
      setLastWord(found.key);
      // auto-hide after 4 seconds if no new speech
      const timer = setTimeout(() => {
        // only clear if no new sign came in
        setCurrentSign(prev => prev === found ? null : prev);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      // If no keyword, keep showing last sign for a while, then clear
      if (currentSign) {
        const timer = setTimeout(() => setCurrentSign(null), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [transcript]);

  return (
    <div className="card sign-language-card">
      <div className="card-head">
        <div className="card-title">
          <span className="card-title-icon icon-amber">🤟</span>
          Sign Language Translator
          <span className="sign-badge">Live from captions</span>
        </div>
      </div>

      <div className="live-mode">
        <div className="current-sign">
          {currentSign ? (
            <div className="sign-animation">
              <div className="sign-hand-large">
                {currentSign.data.asl}
              </div>
              <div className="sign-details">
                <h3 style={{ color: '#00DDB3' }}>{currentSign.data.sinhala}</h3>
                <p><strong>{currentSign.key}</strong> – {currentSign.data.description}</p>
              </div>
            </div>
          ) : (
            <div className="sign-waiting">
              <div className="sign-hand-pulse">🤟</div>
              <p>Speak a word like <strong>HELP</strong>, <strong>WATER</strong>, <strong>THANK YOU</strong> – I'll show the sign</p>
              <div className="example-words">
                {['HELP', 'WATER', 'FOOD', 'POLICE', 'DOCTOR', 'HAPPY'].map(word => (
                  <span key={word}>{word}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="quick-reference">
        <h4>📖 Common Signs</h4>
        <div className="quick-signs">
          {['HELP', 'WATER', 'THANK YOU', 'YES', 'NO', 'EMERGENCY'].map(key => (
            <div key={key} className="quick-sign-item" onClick={() => {
              const data = SIGN_DICTIONARY[key];
              if (data) setCurrentSign({ key, data });
              setTimeout(() => setCurrentSign(null), 4000);
            }}>
              <span className="quick-hand">{SIGN_DICTIONARY[key]?.asl || '🤟'}</span>
              <span className="quick-word">{key}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sign-language-guide">
        <div className="guide-title">💡 How it works</div>
        <p>I listen to your speech (via the Live Captions box) and automatically show the matching sign language. Try saying "help", "water", "police", or "thank you"!</p>
      </div>

      <style>{`
        .sign-badge {
          font-size: 10px;
          background: rgba(245, 200, 66, 0.2);
          color: var(--gold);
          padding: 2px 8px;
          border-radius: 20px;
          margin-left: 8px;
        }
        .sign-animation {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 20px;
          background: linear-gradient(135deg, rgba(0,221,179,0.1), rgba(245,200,66,0.05));
          border-radius: 20px;
          width: 100%;
          animation: slideIn 0.3s ease;
        }
        .sign-hand-large {
          font-size: 70px;
          min-width: 100px;
          text-align: center;
          animation: handWave 1s ease infinite;
        }
        @keyframes handWave {
          0%,100% { transform: rotate(0deg); }
          50% { transform: rotate(5deg); }
        }
        .sign-details h3 {
          font-size: 24px;
          margin-bottom: 5px;
        }
        .sign-details p {
          font-size: 14px;
          color: var(--text-secondary);
        }
        .sign-waiting {
          text-align: center;
          padding: 20px;
        }
        .sign-hand-pulse {
          font-size: 70px;
          animation: pulse 1.5s ease infinite;
        }
        .example-words {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin-top: 15px;
        }
        .example-words span {
          background: var(--bg-card);
          padding: 5px 14px;
          border-radius: 30px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .example-words span:hover {
          background: var(--teal-dim);
          color: var(--teal);
        }
        .quick-reference {
          margin-top: 20px;
          padding: 15px;
          background: rgba(0,0,0,0.2);
          border-radius: 16px;
        }
        .quick-reference h4 {
          margin-bottom: 10px;
          color: var(--teal);
          font-size: 13px;
        }
        .quick-signs {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .quick-sign-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          padding: 8px 12px;
          background: var(--bg-card);
          border-radius: 12px;
          cursor: pointer;
          transition: 0.2s;
        }
        .quick-sign-item:hover {
          background: var(--teal-dim);
          transform: translateY(-2px);
        }
        .quick-hand {
          font-size: 28px;
        }
        .quick-word {
          font-size: 11px;
          font-weight: 600;
        }
        .sign-language-guide {
          margin-top: 15px;
          padding: 12px;
          background: rgba(68,136,255,0.1);
          border-radius: 12px;
          font-size: 12px;
        }
        .guide-title {
          font-weight: 700;
          color: var(--blue);
          margin-bottom: 5px;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
};

export default SignLanguageBox;