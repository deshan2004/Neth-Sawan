import React, { useState, useRef, useEffect } from 'react';
import { auth } from '../firebase';

// Complete Sign Language Dictionary for Media Detection
const SIGN_DICTIONARY = {
  // Objects & Things
  'PERSON': { asl: '👤', sls: '👤', description: 'Index finger pointing down, then up', handshape: 'Pointing finger', movement: 'Up and down motion' },
  'PEOPLE': { asl: '👥', sls: '👥', description: 'Circle motion with both hands', handshape: 'Flat hands', movement: 'Circular motion' },
  'MAN': { asl: '👨', sls: '👨', description: 'Hand on forehead like hat brim', handshape: 'Flat hand', movement: 'Tap forehead' },
  'WOMAN': { asl: '👩', sls: '👩', description: 'Thumb tracing chin line', handshape: 'Thumb out', movement: 'Trace chin to chest' },
  'CHILD': { asl: '🧒', sls: '🧒', description: 'Hand indicating height', handshape: 'Flat hand', movement: 'Move down to show small' },
  'BABY': { asl: '👶', sls: '👶', description: 'Arms cradling', handshape: 'Arms curved', movement: 'Rocking motion' },
  'CAR': { asl: '🚗', sls: '🚗', description: 'Steering wheel motion', handshape: 'Both hands gripping', movement: 'Turning motion' },
  'VEHICLE': { asl: '🚙', sls: '🚙', description: 'Driving motion', handshape: 'Hands on wheel', movement: 'Forward motion' },
  'HOUSE': { asl: '🏠', sls: '🏠', description: 'Fingers touch to make roof shape', handshape: 'Both hands angled', movement: 'Touch fingertips' },
  'HOME': { asl: '🏡', sls: '🏡', description: 'Fingers touch cheek then thumb', handshape: 'Flat hand', movement: 'Touch cheek then thumb' },
  'BUILDING': { asl: '🏢', sls: '🏢', description: 'Both hands making box shape', handshape: 'Flat hands vertical', movement: 'Move up together' },
  'TREE': { asl: '🌳', sls: '🌳', description: 'Elbow on hand, fingers spread', handshape: 'Hand on elbow', movement: 'Wiggle fingers' },
  'FLOWER': { asl: '🌸', sls: '🌸', description: 'Fingers touching nose then spread', handshape: 'Pinched fingers', movement: 'Open like flower' },
  'ANIMAL': { asl: '🐾', sls: '🐾', description: 'Hands on chest like paws', handshape: 'Claw hands', movement: 'Pat chest' },
  'DOG': { asl: '🐕', sls: '🐕', description: 'Snap fingers then pat leg', handshape: 'Snapping', movement: 'Pat leg' },
  'CAT': { asl: '🐈', sls: '🐈', description: 'Fingers stroking whiskers', handshape: 'Pinched fingers', movement: 'Stroke cheek' },
  'BIRD': { asl: '🐦', sls: '🐦', description: 'Fingers at mouth like beak', handshape: 'Fingers pinched', movement: 'Open and close' },
  'FISH': { asl: '🐟', sls: '🐟', description: 'Hand swimming motion', handshape: 'Flat hand', movement: 'Wavy side motion' },
  'FOOD': { asl: '🍔', sls: '🍔', description: 'Fingers tap mouth', handshape: 'Pinched fingers', movement: 'Tap to mouth' },
  'WATER': { asl: '💧', sls: '💧', description: 'W shape taps chin', handshape: 'W handshape', movement: 'Tap chin' },
  'DRINK': { asl: '🥤', sls: '🥤', description: 'C-shaped hand to mouth', handshape: 'C shape', movement: 'Bring to mouth' },
  'PHONE': { asl: '📱', sls: '📱', description: 'C-shaped hand to ear', handshape: 'C shape', movement: 'Hold to ear' },
  'COMPUTER': { asl: '💻', sls: '💻', description: 'Hands typing motion', handshape: 'Curved hands', movement: 'Typing motion' },
  'BOOK': { asl: '📖', sls: '📖', description: 'Hands opening like book', handshape: 'Flat hands', movement: 'Open motion' },
  'MONEY': { asl: '💰', sls: '💰', description: 'Tap palm then slap', handshape: 'Flat hand', movement: 'Tap and slap' },
  'SCHOOL': { asl: '🏫', sls: '🏫', description: 'Clap hands then flat', handshape: 'Flat hands', movement: 'Clap then hold' },
  'HOSPITAL': { asl: '🏥', sls: '🏥', description: 'Crossed arms on chest', handshape: 'Arms crossed', movement: 'Hold on chest' },
  
  // Actions
  'WALK': { asl: '🚶', sls: '🚶', description: 'Two fingers walking motion', handshape: 'Two fingers', movement: 'Walking motion' },
  'RUN': { asl: '🏃', sls: '🏃', description: 'Two fingers running motion', handshape: 'Two fingers', movement: 'Fast running motion' },
  'SIT': { asl: '🪑', sls: '🪑', description: 'Two fingers over two', handshape: 'Two fingers', movement: 'Place down' },
  'STAND': { asl: '🧍', sls: '🧍', description: 'Two fingers up', handshape: 'Two fingers', movement: 'Up motion' },
  'SLEEP': { asl: '😴', sls: '😴', description: 'Hand over face then cheek', handshape: 'Flat hand', movement: 'Tilt head, hand under' },
  'EAT': { asl: '🍽️', sls: '🍽️', description: 'Fingers to mouth', handshape: 'Pinched fingers', movement: 'Tap mouth' },
  'DRINK': { asl: '🥤', sls: '🥤', description: 'C-shape to mouth', handshape: 'C shape', movement: 'Pour to mouth' },
  'READ': { asl: '📖', sls: '📖', description: 'Hands like holding book', handshape: 'Flat hands', movement: 'Open motion' },
  'WRITE': { asl: '✍️', sls: '✍️', description: 'Writing motion', handshape: 'Pinched fingers', movement: 'Writing motion' },
  'TALK': { asl: '💬', sls: '💬', description: 'Fingers at mouth', handshape: 'Four fingers', movement: 'Waving motion' },
  'HELP': { asl: '🤝👍', sls: '🤝👍', description: 'One hand taps other palm, then thumbs up', handshape: 'Open hand to fist', movement: 'Tap and lift' },
  'EMERGENCY': { asl: '✊✊😟', sls: '✊✊⚠️', description: 'Fists shake, worried face', handshape: 'Fists', movement: 'Shake vigorously' },
  
  // Emotions/Feelings
  'HAPPY': { asl: '😊', sls: '😊', description: 'Pat chest in circular motion', handshape: 'Flat hand', movement: 'Circular pat on chest' },
  'SAD': { asl: '😢', sls: '😢', description: 'Fingers drag down face', handshape: 'Open hand', movement: 'Drag down from eyes' },
  'ANGRY': { asl: '😠', sls: '😠', description: 'Claw hand to face', handshape: 'Claw', movement: 'Pull down face' },
  'SCARED': { asl: '😨', sls: '😨', description: 'Hands on chest, open mouth', handshape: 'Flat hands', movement: 'Pat chest quickly' },
  'LOVE': { asl: '🤟', sls: '🤟', description: 'Cross arms over chest', handshape: 'Fist over heart', movement: 'Cross arms' },
  
  // People
  'DOCTOR': { asl: '👨‍⚕️', sls: '👨‍⚕️', description: 'Wrist pulse motion', handshape: 'Two fingers on wrist', movement: 'Check pulse' },
  'POLICE': { asl: '👮', sls: '👮', description: 'Badge tap on chest', handshape: 'Flat hand', movement: 'Tap chest' },
  'TEACHER': { asl: '👩‍🏫', sls: '👩‍🏫', description: 'Hands together then point', handshape: 'Flat hands', movement: 'Point forward' },
  'FRIEND': { asl: '👫', sls: '👫', description: 'Two fingers hook then pull', handshape: 'Hook fingers', movement: 'Pull together' },
  'FAMILY': { asl: '👨‍👩‍👧', sls: '👨‍👩‍👧', description: 'Circle hands then spread', handshape: 'Circle hands', movement: 'Move outward' },
  
  // Colors
  'RED': { asl: '🔴', sls: '🔴', description: 'Index finger drag down lip', handshape: 'Pointing finger', movement: 'Drag down lip' },
  'BLUE': { asl: '🔵', sls: '🔵', description: 'B handshape shake', handshape: 'B handshape', movement: 'Shake side to side' },
  'GREEN': { asl: '🟢', sls: '🟢', description: 'G handshape shake', handshape: 'G handshape', movement: 'Shake' },
  'YELLOW': { asl: '🟡', sls: '🟡', description: 'Y handshape shake', handshape: 'Y handshape', movement: 'Shake' },
  'BLACK': { asl: '⚫', sls: '⚫', description: 'Index finger across forehead', handshape: 'Pointing finger', movement: 'Draw line' },
  'WHITE': { asl: '⚪', sls: '⚪', description: 'Flat hand on chest', handshape: 'Flat hand', movement: 'Pull out' },
  
  // Numbers
  'ONE': { asl: '☝️', sls: '☝️', description: 'Index finger up', handshape: 'One finger', movement: 'Hold up' },
  'TWO': { asl: '✌️', sls: '✌️', description: 'Two fingers up', handshape: 'Two fingers', movement: 'Hold up' },
  'THREE': { asl: '🤟', sls: '🤟', description: 'Three fingers up', handshape: 'Three fingers', movement: 'Hold up' },
  'FOUR': { asl: '🖖', sls: '🖖', description: 'Four fingers up', handshape: 'Four fingers', movement: 'Hold up' },
  'FIVE': { asl: '🖐️', sls: '🖐️', description: 'Open hand', handshape: 'Open palm', movement: 'Show palm' },
  
  // Common Words
  'HELLO': { asl: '👋', sls: '👋', description: 'Salute motion from forehead', handshape: 'Flat hand', movement: 'Move out and down' },
  'GOODBYE': { asl: '👋', sls: '👋', description: 'Waving hand', handshape: 'Flat hand', movement: 'Wave side to side' },
  'THANK YOU': { asl: '🙏', sls: '🙏', description: 'Fingers to chin, move forward', handshape: 'Flat hand', movement: 'Forward from chin' },
  'PLEASE': { asl: '🤲', sls: '🤲', description: 'Flat hand circles on chest', handshape: 'Flat hand', movement: 'Circular on chest' },
  'SORRY': { asl: '😔', sls: '😔', description: 'Fist circles on chest', handshape: 'Fist', movement: 'Small circle on chest' },
  'YES': { asl: '👍', sls: '👍', description: 'Nodding fist', handshape: 'Fist', movement: 'Nodding motion' },
  'NO': { asl: '👎', sls: '👎', description: 'Tap index and middle together', handshape: 'Two fingers', movement: 'Tap together' }
};

// Scene detection patterns
const SCENE_DETECTION = {
  'BEACH': { signs: ['WATER', 'SUN', 'SAND'], description: 'Beach scene with water and sand' },
  'FOREST': { signs: ['TREE', 'ANIMAL', 'GREEN'], description: 'Forest with trees and nature' },
  'CITY': { signs: ['BUILDING', 'CAR', 'PEOPLE'], description: 'City with buildings and vehicles' },
  'HOME': { signs: ['HOUSE', 'FAMILY', 'HOME'], description: 'Home interior or exterior' },
  'OFFICE': { signs: ['COMPUTER', 'PEOPLE', 'WORK'], description: 'Office workspace' },
  'SCHOOL': { signs: ['SCHOOL', 'BOOK', 'TEACHER'], description: 'Educational setting' },
  'HOSPITAL': { signs: ['HOSPITAL', 'DOCTOR', 'HELP'], description: 'Medical facility' },
  'PARTY': { signs: ['HAPPY', 'PEOPLE', 'MUSIC'], description: 'Celebration with people' },
  'NATURE': { signs: ['TREE', 'FLOWER', 'GREEN'], description: 'Outdoor natural setting' },
  'ROAD': { signs: ['CAR', 'VEHICLE', 'WALK'], description: 'Street or road scene' }
};

const Aivision = ({ showToast }) => {
  const [preview, setPreview] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [signLanguageOutput, setSignLanguageOutput] = useState([]);
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [isPlayingSigns, setIsPlayingSigns] = useState(false);
  const [selectedSignSystem, setSelectedSignSystem] = useState('asl');
  const [detectedScene, setDetectedScene] = useState('');
  const [detectedObjects, setDetectedObjects] = useState([]);
  
  const fileRef = useRef(null);
  const intervalRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const type = file.type.startsWith('image/') ? 'image' : 
                 file.type.startsWith('video/') ? 'video' : null;
    
    if (!type) {
      showToast('Please upload an image or video file', 'error');
      return;
    }

    setMediaFile(file);
    setMediaType(type);
    setPreview(URL.createObjectURL(file));
    setSignLanguageOutput([]);
    setDetectedScene('');
    setDetectedObjects([]);
    
    // Process the media and convert to sign language
    processMediaToSign(file, type);
  };

  const processMediaToSign = async (file, type) => {
    setLoading(true);
    
    try {
      // Simulate AI detection - In production, use actual AI/ML APIs
      // This simulates detecting objects, scenes, and context from the image/video
      
      setTimeout(() => {
        // Generate sign language based on detected content
        const generatedSigns = generateSignsFromMedia(file, type);
        setSignLanguageOutput(generatedSigns);
        setCurrentSignIndex(0);
        setLoading(false);
        showToast('Media converted to sign language!', 'success');
      }, 2000);
      
    } catch (error) {
      console.error('Processing error:', error);
      setLoading(false);
      showToast('Failed to process media', 'error');
    }
  };

  const generateSignsFromMedia = (file, type) => {
    // This simulates AI detection of objects, scenes, and actions
    // In production, this would come from a real ML model
    
    const signs = [];
    const fileName = file.name.toLowerCase();
    
    // Scene detection based on filename (simulation)
    if (fileName.includes('beach') || fileName.includes('sea') || fileName.includes('ocean')) {
      signs.push({ type: 'scene', original: 'BEACH', ...SIGN_DICTIONARY['BEACH'] || SIGN_DICTIONARY['WATER'] });
      signs.push({ type: 'object', original: 'WATER', ...SIGN_DICTIONARY['WATER'] });
      signs.push({ type: 'emotion', original: 'HAPPY', ...SIGN_DICTIONARY['HAPPY'] });
    }
    else if (fileName.includes('forest') || fileName.includes('tree') || fileName.includes('nature')) {
      signs.push({ type: 'scene', original: 'FOREST', ...SIGN_DICTIONARY['TREE'] });
      signs.push({ type: 'object', original: 'TREE', ...SIGN_DICTIONARY['TREE'] });
      signs.push({ type: 'object', original: 'GREEN', ...SIGN_DICTIONARY['GREEN'] });
    }
    else if (fileName.includes('city') || fileName.includes('urban') || fileName.includes('street')) {
      signs.push({ type: 'scene', original: 'CITY', ...SIGN_DICTIONARY['BUILDING'] });
      signs.push({ type: 'object', original: 'CAR', ...SIGN_DICTIONARY['CAR'] });
      signs.push({ type: 'object', original: 'PEOPLE', ...SIGN_DICTIONARY['PEOPLE'] });
    }
    else if (fileName.includes('house') || fileName.includes('home') || fileName.includes('building')) {
      signs.push({ type: 'scene', original: 'HOME', ...SIGN_DICTIONARY['HOUSE'] });
      signs.push({ type: 'object', original: 'HOUSE', ...SIGN_DICTIONARY['HOUSE'] });
      signs.push({ type: 'object', original: 'FAMILY', ...SIGN_DICTIONARY['FAMILY'] });
    }
    else if (fileName.includes('office') || fileName.includes('work')) {
      signs.push({ type: 'scene', original: 'OFFICE', ...SIGN_DICTIONARY['COMPUTER'] });
      signs.push({ type: 'object', original: 'COMPUTER', ...SIGN_DICTIONARY['COMPUTER'] });
      signs.push({ type: 'action', original: 'WORK', ...SIGN_DICTIONARY['WRITE'] });
    }
    else if (fileName.includes('school') || fileName.includes('class')) {
      signs.push({ type: 'scene', original: 'SCHOOL', ...SIGN_DICTIONARY['SCHOOL'] });
      signs.push({ type: 'object', original: 'BOOK', ...SIGN_DICTIONARY['BOOK'] });
      signs.push({ type: 'person', original: 'TEACHER', ...SIGN_DICTIONARY['TEACHER'] });
    }
    else if (fileName.includes('hospital') || fileName.includes('medical')) {
      signs.push({ type: 'scene', original: 'HOSPITAL', ...SIGN_DICTIONARY['HOSPITAL'] });
      signs.push({ type: 'person', original: 'DOCTOR', ...SIGN_DICTIONARY['DOCTOR'] });
      signs.push({ type: 'action', original: 'HELP', ...SIGN_DICTIONARY['HELP'] });
    }
    else if (fileName.includes('party') || fileName.includes('celebration')) {
      signs.push({ type: 'scene', original: 'PARTY', ...SIGN_DICTIONARY['HAPPY'] });
      signs.push({ type: 'emotion', original: 'HAPPY', ...SIGN_DICTIONARY['HAPPY'] });
      signs.push({ type: 'people', original: 'PEOPLE', ...SIGN_DICTIONARY['PEOPLE'] });
    }
    else if (fileName.includes('animal') || fileName.includes('dog') || fileName.includes('cat')) {
      if (fileName.includes('dog')) signs.push({ type: 'animal', original: 'DOG', ...SIGN_DICTIONARY['DOG'] });
      if (fileName.includes('cat')) signs.push({ type: 'animal', original: 'CAT', ...SIGN_DICTIONARY['CAT'] });
      signs.push({ type: 'animal', original: 'ANIMAL', ...SIGN_DICTIONARY['ANIMAL'] });
    }
    else if (fileName.includes('food') || fileName.includes('eat')) {
      signs.push({ type: 'object', original: 'FOOD', ...SIGN_DICTIONARY['FOOD'] });
      signs.push({ type: 'action', original: 'EAT', ...SIGN_DICTIONARY['EAT'] });
    }
    else {
      // Default detection for any image/video
      signs.push({ type: 'greeting', original: 'HELLO', ...SIGN_DICTIONARY['HELLO'] });
      signs.push({ type: 'question', original: 'HOW ARE YOU', ...SIGN_DICTIONARY['HELP'] });
      
      // Detect if it's an image with people
      if (type === 'image') {
        signs.push({ type: 'people', original: 'PEOPLE', ...SIGN_DICTIONARY['PEOPLE'] });
        signs.push({ type: 'scene', original: 'SCENE', ...SIGN_DICTIONARY['PERSON'] });
      }
      
      // Generic content detection
      signs.push({ type: 'general', original: 'CONTENT DETECTED', asl: '📸👁️', sls: '📸👁️', description: 'Visual content detected in media', handshape: 'Pointing', movement: 'Show then point' });
    }
    
    // Add general understanding signs
    signs.push({ type: 'understanding', original: 'UNDERSTAND', asl: '🤔✅', sls: '🤔✅', description: 'I understand what I see', handshape: 'Point to head', movement: 'Tap head then thumbs up' });
    signs.push({ type: 'thanks', original: 'THANK YOU', ...SIGN_DICTIONARY['THANK YOU'] });
    
    return signs;
  };

  const startSignPlayback = () => {
    if (signLanguageOutput.length === 0) return;
    
    setIsPlayingSigns(true);
    setCurrentSignIndex(0);
    
    intervalRef.current = setInterval(() => {
      setCurrentSignIndex(prev => {
        if (prev + 1 >= signLanguageOutput.length) {
          clearInterval(intervalRef.current);
          setIsPlayingSigns(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);
  };

  const stopSignPlayback = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      setIsPlayingSigns(false);
    }
  };

  const currentSign = signLanguageOutput[currentSignIndex];

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className="card vision-card">
      <div className="card-head">
        <div className="card-title">
          <span className="card-title-icon icon-purple">🤟</span>
          Media to Sign Language
        </div>
        <p className="card-subtitle">Upload any photo or video - See it in Sign Language</p>
      </div>

      {/* Upload Area */}
      <div className="upload-area" onClick={() => fileRef.current?.click()}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <div className="upload-icon-large">📸🎬</div>
        <h3>Upload Photo or Video</h3>
        <p>Any image or video will be shown in Sign Language</p>
        <small>Supported: JPG, PNG, MP4, MOV</small>
      </div>

      {/* Media Preview */}
      {preview && (
        <div className="media-preview-container">
          <h4>Your Media</h4>
          <div className="media-preview">
            {mediaType === 'image' ? (
              <img src={preview} alt="Uploaded content" />
            ) : (
              <video src={preview} controls />
            )}
          </div>
        </div>
      )}

      {/* Loading Animation */}
      {loading && (
        <div className="loading-sign-container">
          <div className="loading-animation">
            <div className="sign-hand-animate">🤟</div>
            <div className="sign-hand-animate">👋</div>
            <div className="sign-hand-animate">👍</div>
          </div>
          <p>Converting to Sign Language...</p>
          <small>AI is understanding your media</small>
        </div>
      )}

      {/* Sign Language Output */}
      {signLanguageOutput.length > 0 && !loading && (
        <div className="sign-output-container">
          <div className="sign-header-bar">
            <h3>🤟 Sign Language Translation</h3>
            <button 
              className="sign-system-btn"
              onClick={() => setSelectedSignSystem(selectedSignSystem === 'asl' ? 'sls' : 'asl')}
            >
              {selectedSignSystem === 'asl' ? '🇺🇸 American Sign Language' : '🇱🇰 Sinhala Sign Language'}
            </button>
          </div>

          {/* Current Sign Display */}
          <div className="current-sign-display">
            {currentSign && (
              <div className="sign-card-big">
                <div className="sign-visual">
                  <span className="sign-emoji-big">
                    {selectedSignSystem === 'asl' ? currentSign.asl : currentSign.sls}
                  </span>
                </div>
                <div className="sign-info">
                  <div className="sign-word-big">{currentSign.original}</div>
                  <div className="sign-type-badge">
                    {currentSign.type === 'scene' ? '🌄 Scene' :
                     currentSign.type === 'object' ? '📦 Object' :
                     currentSign.type === 'person' ? '👤 Person' :
                     currentSign.type === 'action' ? '🏃 Action' :
                     currentSign.type === 'emotion' ? '😊 Emotion' :
                     currentSign.type === 'animal' ? '🐾 Animal' : '💬 Word'}
                  </div>
                  <p className="sign-description">{currentSign.description}</p>
                  <div className="sign-details">
                    <span><strong>✋ Handshape:</strong> {currentSign.handshape}</span>
                    <span><strong>🔄 Movement:</strong> {currentSign.movement}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="playback-controls">
            {!isPlayingSigns ? (
              <button className="play-btn" onClick={startSignPlayback}>
                ▶ Play All Signs ({signLanguageOutput.length} signs)
              </button>
            ) : (
              <button className="stop-btn" onClick={stopSignPlayback}>
                ⏹ Stop Playback
              </button>
            )}
            <div className="progress-indicator">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${((currentSignIndex + 1) / signLanguageOutput.length) * 100}%` }}
                />
              </div>
              <span className="progress-text">
                Sign {currentSignIndex + 1} of {signLanguageOutput.length}
              </span>
            </div>
          </div>

          {/* Sign Gallery Timeline */}
          <div className="sign-gallery">
            <h4>📋 All Signs in Order</h4>
            <div className="gallery-scroll">
              {signLanguageOutput.map((sign, idx) => (
                <button
                  key={idx}
                  className={`gallery-card ${idx === currentSignIndex ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentSignIndex(idx);
                    stopSignPlayback();
                  }}
                >
                  <span className="gallery-sign-emoji">
                    {selectedSignSystem === 'asl' ? sign.asl : sign.sls}
                  </span>
                  <span className="gallery-sign-word">{sign.original}</span>
                  <span className="gallery-sign-type">{sign.type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* What the AI Understood */}
          <div className="ai-understanding">
            <h4>🧠 What AI understood from your media</h4>
            <div className="understanding-tags">
              {signLanguageOutput.slice(0, 8).map((sign, idx) => (
                <span key={idx} className="understanding-tag">
                  {sign.original}
                </span>
              ))}
            </div>
            <p className="understanding-note">
              The AI analyzed your {mediaType} and converted what it saw into sign language.
              Each sign represents something detected in your media.
            </p>
          </div>

          {/* Practice Tips */}
          <div className="practice-tips">
            <h4>💡 Learn These Signs</h4>
            <div className="tips-list">
              <p>• Each sign has a specific handshape - practice in front of a mirror</p>
              <p>• The movement shows how to perform the sign correctly</p>
              <p>• Different media will show different signs based on what's detected</p>
              <p>• Try uploading different photos to see different sign language translations</p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions when no media */}
      {!preview && !loading && signLanguageOutput.length === 0 && (
        <div className="instructions">
          <div className="instruction-icon">🤟</div>
          <h3>How it works</h3>
          <div className="steps">
            <div className="step">
              <span className="step-num">1</span>
              <span>Upload a photo or video</span>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <span>AI detects objects, scenes, and actions</span>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <span>Everything is shown in Sign Language</span>
            </div>
            <div className="step">
              <span className="step-num">4</span>
              <span>Watch the signs or play them in sequence</span>
            </div>
          </div>
          <div className="example-scenes">
            <p>📸 Try uploading photos of:</p>
            <div className="example-tags">
              <span>🏠 Houses</span>
              <span>🌳 Nature</span>
              <span>👥 People</span>
              <span>🐕 Animals</span>
              <span>🚗 Cars</span>
              <span>🍔 Food</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .vision-card {
          background: var(--surface);
          border-radius: 24px;
          padding: 24px;
        }
        
        .card-head {
          margin-bottom: 24px;
        }
        
        .card-title {
          font-size: 24px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .card-subtitle {
          color: var(--text-secondary);
          margin-top: 8px;
        }
        
        .upload-area {
          border: 2px dashed var(--border);
          border-radius: 20px;
          padding: 48px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          background: var(--card);
          margin-bottom: 24px;
        }
        
        .upload-area:hover {
          border-color: var(--teal);
          background: var(--teal-dim);
          transform: translateY(-2px);
        }
        
        .upload-icon-large {
          font-size: 64px;
          margin-bottom: 16px;
        }
        
        .upload-area h3 {
          font-size: 20px;
          margin-bottom: 8px;
        }
        
        .upload-area p {
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        
        .upload-area small {
          color: var(--text-muted);
          font-size: 12px;
        }
        
        .media-preview-container {
          margin-bottom: 24px;
        }
        
        .media-preview-container h4 {
          margin-bottom: 12px;
        }
        
        .media-preview {
          border-radius: 16px;
          overflow: hidden;
          background: var(--card);
          text-align: center;
        }
        
        .media-preview img,
        .media-preview video {
          max-width: 100%;
          max-height: 300px;
          border-radius: 12px;
        }
        
        .loading-sign-container {
          text-align: center;
          padding: 48px;
          background: var(--card);
          border-radius: 20px;
          margin-bottom: 24px;
        }
        
        .loading-animation {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .sign-hand-animate {
          font-size: 48px;
          animation: bounce 0.6s ease infinite alternate;
        }
        
        .sign-hand-animate:nth-child(1) { animation-delay: 0s; }
        .sign-hand-animate:nth-child(2) { animation-delay: 0.2s; }
        .sign-hand-animate:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes bounce {
          from { transform: translateY(0px); }
          to { transform: translateY(-20px); }
        }
        
        .sign-output-container {
          animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .sign-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        
        .sign-system-btn {
          padding: 8px 16px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 30px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }
        
        .sign-system-btn:hover {
          background: var(--teal-dim);
          border-color: var(--teal);
        }
        
        .current-sign-display {
          background: linear-gradient(135deg, var(--card), var(--surface));
          border-radius: 24px;
          padding: 32px;
          margin-bottom: 24px;
          border: 1px solid var(--border);
        }
        
        .sign-card-big {
          display: flex;
          align-items: center;
          gap: 40px;
          flex-wrap: wrap;
        }
        
        .sign-visual {
          flex-shrink: 0;
        }
        
        .sign-emoji-big {
          font-size: 120px;
          animation: signPulse 1s ease-in-out infinite;
        }
        
        @keyframes signPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .sign-info {
          flex: 1;
        }
        
        .sign-word-big {
          font-size: 32px;
          font-weight: 800;
          color: var(--teal);
          margin-bottom: 8px;
        }
        
        .sign-type-badge {
          display: inline-block;
          background: rgba(0, 221, 179, 0.1);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          margin-bottom: 12px;
        }
        
        .sign-description {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 12px;
          line-height: 1.5;
        }
        
        .sign-details {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          font-size: 13px;
        }
        
        .sign-details span {
          color: var(--text-secondary);
        }
        
        .playback-controls {
          margin-bottom: 24px;
        }
        
        .play-btn, .stop-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          margin-bottom: 16px;
          transition: all 0.2s;
        }
        
        .play-btn {
          background: var(--teal);
          color: var(--bg);
        }
        
        .play-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 221, 179, 0.3);
        }
        
        .stop-btn {
          background: var(--red);
          color: white;
        }
        
        .progress-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .progress-bar {
          flex: 1;
          height: 6px;
          background: var(--card);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: var(--teal);
          transition: width 0.3s;
        }
        
        .progress-text {
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .sign-gallery {
          margin-bottom: 24px;
        }
        
        .sign-gallery h4 {
          margin-bottom: 12px;
        }
        
        .gallery-scroll {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 8px 0;
        }
        
        .gallery-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 80px;
          padding: 12px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .gallery-card:hover {
          transform: translateY(-2px);
          border-color: var(--teal);
        }
        
        .gallery-card.active {
          border-color: var(--teal);
          background: var(--teal-dim);
          transform: scale(1.05);
        }
        
        .gallery-sign-emoji {
          font-size: 36px;
        }
        
        .gallery-sign-word {
          font-size: 12px;
          font-weight: 600;
          margin-top: 6px;
        }
        
        .gallery-sign-type {
          font-size: 9px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        
        .ai-understanding {
          background: rgba(68, 136, 255, 0.05);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
          border-left: 4px solid var(--blue);
        }
        
        .ai-understanding h4 {
          margin-bottom: 12px;
        }
        
        .understanding-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .understanding-tag {
          background: var(--blue-dim);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          color: var(--blue);
        }
        
        .understanding-note {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        
        .practice-tips {
          background: rgba(245, 200, 66, 0.05);
          border-radius: 16px;
          padding: 20px;
          border-left: 4px solid var(--gold);
        }
        
        .practice-tips h4 {
          margin-bottom: 12px;
          color: var(--gold);
        }
        
        .tips-list p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 8px 0;
          line-height: 1.5;
        }
        
        .instructions {
          text-align: center;
          padding: 48px 24px;
          background: var(--card);
          border-radius: 20px;
        }
        
        .instruction-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }
        
        .instructions h3 {
          margin-bottom: 24px;
        }
        
        .steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }
        
        .step {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--surface);
          border-radius: 12px;
        }
        
        .step-num {
          width: 32px;
          height: 32px;
          background: var(--teal);
          color: var(--bg);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        
        .example-scenes p {
          margin-bottom: 12px;
        }
        
        .example-tags {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
        }
        
        .example-tags span {
          background: var(--bg-card);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
        }
        
        @media (max-width: 768px) {
          .sign-card-big {
            flex-direction: column;
            text-align: center;
          }
          
          .sign-details {
            flex-direction: column;
            text-align: center;
          }
          
          .steps {
            grid-template-columns: 1fr;
          }
          
          .gallery-scroll {
            padding-bottom: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default Aivision;