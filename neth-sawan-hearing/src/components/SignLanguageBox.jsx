import React, { useState, useEffect, useRef } from 'react';

// Complete Sign Language Dictionary with visual descriptions
const SIGN_DICTIONARY = {
  // Letters A-Z
  'A': { description: 'Closed fist, thumb on side', sinhala: 'මිටක්, මාපටැඟිල්ල පැත්තට', handshape: '🤛', videoUrl: null },
  'B': { description: 'Open hand, fingers together, thumb across palm', sinhala: 'විවෘත අත, ඇඟිලි එකට, මාපටැඟිල්ල හරහා', handshape: '🖐️', videoUrl: null },
  'C': { description: 'Hand in C shape, thumb and fingers curved', sinhala: 'C හැඩය, මාපටැඟිල්ල සහ ඇඟිලි වක්‍ර', handshape: '👌', videoUrl: null },
  'D': { description: 'Index finger up, others curled into fist', sinhala: 'දබරැඟිල්ල ඉහළට, අනෙක් ඇඟිලි මිටක්', handshape: '☝️', videoUrl: null },
  'E': { description: 'Hand flat, fingers together, thumb across palm', sinhala: 'අත පැතලි, ඇඟිලි එකට', handshape: '🤚', videoUrl: null },
  'F': { description: 'Thumb and index finger form circle, other fingers up', sinhala: 'මාපටැඟිල්ල සහ දබරැඟිල්ල වටයක්', handshape: '👌', videoUrl: null },
  'G': { description: 'Index finger pointing sideways, thumb parallel', sinhala: 'දබරැඟිල්ල පැත්තට', handshape: '👉', videoUrl: null },
  'H': { description: 'Index and middle fingers up, thumb across', sinhala: 'දබරැඟිල්ල සහ මැද ඇඟිල්ල ඉහළට', handshape: '✌️', videoUrl: null },
  'I': { description: 'Pinky finger up, others curled', sinhala: 'පුංචි ඇඟිල්ල ඉහළට', handshape: '🤙', videoUrl: null },
  'J': { description: 'Pinky traces J shape in air', sinhala: 'J හැඩය අහසේ අඳින්න', handshape: '🤙', videoUrl: null },
  'K': { description: 'Index and middle up, thumb between', sinhala: 'K හැඩය', handshape: '🖖', videoUrl: null },
  'L': { description: 'L shape with thumb and index', sinhala: 'L හැඩය', handshape: '👍', videoUrl: null },
  'M': { description: 'Three fingers over thumb', sinhala: 'ඇඟිලි තුන මාපටැඟිල්ල මත', handshape: '👌', videoUrl: null },
  'N': { description: 'Two fingers over thumb', sinhala: 'ඇඟිලි දෙක මාපටැඟිල්ල මත', handshape: '👌', videoUrl: null },
  'O': { description: 'Fingers touching thumb - O shape', sinhala: 'O හැඩය', handshape: '🤏', videoUrl: null },
  'P': { description: 'Index and middle pointing down', sinhala: 'P හැඩය', handshape: '🖖', videoUrl: null },
  'Q': { description: 'Index and middle pointing down', sinhala: 'Q හැඩය', handshape: '👇', videoUrl: null },
  'R': { description: 'Crossed index and middle fingers', sinhala: 'R හැඩය', handshape: '🤞', videoUrl: null },
  'S': { description: 'Closed fist, thumb over fingers', sinhala: 'මිටක්', handshape: '✊', videoUrl: null },
  'T': { description: 'Fist with thumb between fingers', sinhala: 'T හැඩය', handshape: '✊', videoUrl: null },
  'U': { description: 'Index and middle up together', sinhala: 'U හැඩය', handshape: '☝️', videoUrl: null },
  'V': { description: 'Peace sign, index and middle up', sinhala: 'V හැඩය', handshape: '✌️', videoUrl: null },
  'W': { description: 'Three fingers up', sinhala: 'W හැඩය', handshape: '🤟', videoUrl: null },
  'X': { description: 'Index finger bent like hook', sinhala: 'X හැඩය', handshape: '🤞', videoUrl: null },
  'Y': { description: 'Thumb and pinky out, others curled', sinhala: 'Y හැඩය', handshape: '🤙', videoUrl: null },
  'Z': { description: 'Index finger traces Z in air', sinhala: 'Z හැඩය අහසේ අඳින්න', handshape: '👉', videoUrl: null },
  
  // Common words for deaf users
  'HELP': { description: 'One hand taps other palm, then thumbs up', sinhala: 'උදව්', handshape: '🤝👍', videoUrl: null, isWord: true },
  'EMERGENCY': { description: 'Fists shake, worried face', sinhala: 'හදිසි අවස්ථාව', handshape: '✊✊😟', videoUrl: null, isWord: true },
  'THANK YOU': { description: 'Fingers to chin, move forward', sinhala: 'ස්තුතියි', handshape: '🤚→👤', videoUrl: null, isWord: true },
  'PLEASE': { description: 'Flat hand circles on chest', sinhala: 'කරුණාකර', handshape: '🖐️🔄', videoUrl: null, isWord: true },
  'SORRY': { description: 'Fist circles on chest', sinhala: 'සමාවෙන්න', handshape: '✊🔄', videoUrl: null, isWord: true },
  'YES': { description: 'Nodding fist', sinhala: 'ඔව්', handshape: '✊⬇️⬆️', videoUrl: null, isWord: true },
  'NO': { description: 'Tap index and middle together', sinhala: 'නැහැ', handshape: '✌️👆', videoUrl: null, isWord: true },
  'HOME': { description: 'Fingers touch cheek then thumb', sinhala: 'ගෙදර', handshape: '👋😊', videoUrl: null, isWord: true },
  'WATER': { description: 'W shape taps chin', sinhala: 'වතුර', handshape: '🤟👇', videoUrl: null, isWord: true },
  'FOOD': { description: 'Fingers tap mouth', sinhala: 'කෑම', handshape: '👌👄', videoUrl: null, isWord: true },
  'DOCTOR': { description: 'Wrist pulse motion', sinhala: 'වෛද්‍යවරයා', handshape: '✋💓', videoUrl: null, isWord: true },
  'POLICE': { description: 'Badge tap on chest', sinhala: 'පොලිස්', handshape: '🖐️⬇️', videoUrl: null, isWord: true },
};

const SignLanguageBox = ({ transcript }) => {
  const [learningMode, setLearningMode] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState('A');
  const [currentWord, setCurrentWord] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);
  const [currentSign, setCurrentSign] = useState(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Extract last letter from transcript
  const lastLetter = (() => {
    const match = (transcript || '').match(/[a-zA-Z]/g);
    return match ? match[match.length - 1].toUpperCase() : null;
  })();

  // Extract last word for word-sign detection
  const lastWord = (() => {
    if (!transcript) return null;
    const words = transcript.trim().split(/\s+/);
    const last = words[words.length - 1];
    return last ? last.toUpperCase() : null;
  })();

  useEffect(() => {
    if (lastWord && SIGN_DICTIONARY[lastWord] && SIGN_DICTIONARY[lastWord].isWord) {
      setCurrentSign(SIGN_DICTIONARY[lastWord]);
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 3000);
      return () => clearTimeout(timer);
    } else if (lastLetter && SIGN_DICTIONARY[lastLetter]) {
      setCurrentSign(SIGN_DICTIONARY[lastLetter]);
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastLetter, lastWord]);

  // Animated hand drawing on canvas
  useEffect(() => {
    if (!learningMode || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    
    const drawHand = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw palm outline
      ctx.beginPath();
      ctx.arc(canvas.width/2, canvas.height/2 - 20, 30, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 224, 178, 0.3)';
      ctx.fill();
      ctx.strokeStyle = '#00DDB3';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw fingers based on selected letter
      const letter = selectedLetter;
      const fingers = getFingerPositions(letter, frame);
      
      fingers.forEach(finger => {
        ctx.beginPath();
        ctx.moveTo(canvas.width/2 + finger.x1, canvas.height/2 - 20 + finger.y1);
        ctx.lineTo(canvas.width/2 + finger.x2, canvas.height/2 - 20 + finger.y2);
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#F5C842';
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(canvas.width/2 + finger.x2, canvas.height/2 - 20 + finger.y2, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#F5C842';
        ctx.fill();
      });
      
      frame = (frame + 1) % 60;
      animationRef.current = requestAnimationFrame(drawHand);
    };
    
    drawHand();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [learningMode, selectedLetter]);

  const getFingerPositions = (letter, frame) => {
    const positions = {
      'A': [{ x1: -20, y1: 0, x2: -20, y2: -10 }, { x1: -5, y1: 0, x2: -5, y2: -10 }, { x1: 10, y1: 0, x2: 10, y2: -10 }, { x1: 25, y1: 0, x2: 25, y2: -10 }],
      'B': [{ x1: -20, y1: 0, x2: -20, y2: -30 }, { x1: -5, y1: 0, x2: -5, y2: -30 }, { x1: 10, y1: 0, x2: 10, y2: -30 }, { x1: 25, y1: 0, x2: 25, y2: -30 }],
      'C': [{ x1: -20, y1: 0, x2: -30, y2: -15 }, { x1: -5, y1: 0, x2: -15, y2: -20 }, { x1: 10, y1: 0, x2: 0, y2: -20 }, { x1: 25, y1: 0, x2: 15, y2: -15 }],
      'L': [{ x1: -20, y1: 0, x2: -30, y2: -40 }, { x1: -5, y1: 0, x2: -5, y2: -10 }, { x1: 10, y1: 0, x2: 10, y2: -10 }, { x1: 25, y1: 0, x2: 25, y2: -10 }],
      'V': [{ x1: -20, y1: 0, x2: -25, y2: -35 }, { x1: 0, y1: 0, x2: -5, y2: -35 }, { x1: 10, y1: 0, x2: 10, y2: -10 }, { x1: 25, y1: 0, x2: 25, y2: -10 }],
      'W': [{ x1: -20, y1: 0, x2: -25, y2: -30 }, { x1: -5, y1: 0, x2: -10, y2: -30 }, { x1: 10, y1: 0, x2: 5, y2: -30 }, { x1: 25, y1: 0, x2: 20, y2: -30 }],
    };
    return positions[letter] || positions['A'];
  };

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="card sign-language-card">
      <div className="card-head">
        <div className="card-title">
          <span className="card-title-icon icon-amber">🤟</span>
          Sign Language Translator
          <span className="sign-badge">ASL + Sinhala Sign</span>
        </div>
        <button
          className={`mode-toggle ${learningMode ? 'active' : ''}`}
          onClick={() => setLearningMode(!learningMode)}
        >
          {learningMode ? '📖 Learning Mode' : '🔤 Live Mode'}
        </button>
      </div>

      {learningMode ? (
        <div className="learning-mode">
          <div className="alphabet-selector">
            <div className="alphabet-grid">
              {alphabet.map(letter => (
                <button
                  key={letter}
                  className={`letter-btn ${selectedLetter === letter ? 'selected' : ''}`}
                  onClick={() => setSelectedLetter(letter)}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          <div className="sign-display-large">
            <canvas ref={canvasRef} width={200} height={150} className="sign-canvas" />
            <div className="sign-info">
              <h3>Letter: {selectedLetter}</h3>
              <p className="sign-desc">{SIGN_DICTIONARY[selectedLetter]?.description || 'Learning sign language'}</p>
              <p className="sign-sinhala">{SIGN_DICTIONARY[selectedLetter]?.sinhala || 'සංඥා භාෂාව'}</p>
              <div className="handshape-demo">
                <span className="handshape-icon">{SIGN_DICTIONARY[selectedLetter]?.handshape || '🤟'}</span>
                <span>Handshape demonstration</span>
              </div>
            </div>
          </div>

          <div className="practice-tip">
            <p>💡 <strong>Practice Tip:</strong> Form your hand as shown in the animation. The highlighted fingers show the correct position for letter {selectedLetter}.</p>
          </div>
        </div>
      ) : (
        <div className="live-mode">
          <div className="current-sign">
            {showAnimation && currentSign ? (
              <div className="sign-animation">
                <div className="sign-hand-large">{currentSign.handshape}</div>
                <div className="sign-details">
                  <span className="sign-letter">{lastLetter || '?'}</span>
                  <span className="sign-word">{lastWord || 'Listening...'}</span>
                  <p className="sign-description">{currentSign.description}</p>
                  <p className="sign-sinhala-translation">{currentSign.sinhala}</p>
                </div>
              </div>
            ) : (
              <div className="sign-waiting">
                <div className="sign-hand-pulse">🤟</div>
                <p>Speak a letter or word to see its sign language equivalent</p>
                <div className="example-words">
                  <span>Try: HELP</span>
                  <span>THANK YOU</span>
                  <span>EMERGENCY</span>
                  <span>WATER</span>
                </div>
              </div>
            )}
          </div>

          <div className="quick-reference">
            <h4>Quick Sign Reference</h4>
            <div className="quick-signs">
              {['HELP', 'YES', 'NO', 'THANK YOU', 'PLEASE', 'EMERGENCY'].map(word => (
                <div key={word} className="quick-sign-item" onClick={() => {
                  setCurrentSign(SIGN_DICTIONARY[word]);
                  setShowAnimation(true);
                  setTimeout(() => setShowAnimation(false), 3000);
                }}>
                  <span className="quick-hand">{SIGN_DICTIONARY[word]?.handshape || '🤟'}</span>
                  <span className="quick-word">{word}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sign-language-guide">
            <p className="guide-title">📚 About Sign Language</p>
            <p>American Sign Language (ASL) and Sri Lankan Sign Language (SLS) use hand shapes, positions, and movements to communicate. This tool translates spoken words into visual sign representations to help deaf users understand conversations.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignLanguageBox;