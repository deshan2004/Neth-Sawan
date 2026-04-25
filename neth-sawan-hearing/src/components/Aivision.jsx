import React, { useState, useRef } from 'react';
import { auth } from '../firebase'; // auth ලබා ගැනීම

// Prompts යාවත්කාලීන කර ඇත (ශ්‍රවණාබාධිත අයට ගැළපෙන පරිදි)
const MODES = [
  {
    id: 'describe',
    label: 'Describe',
    icon: '🔍',
    prompt: `Describe everything visible in this image thoroughly. Be specific about objects, people, colors, and spatial arrangement. This is for a hearing-impaired user, so focus on visual details that might produce sound or indicate an event (e.g., people talking, a phone ringing visually, alarms flashing). Respond in both Sinhala (සිංහල) and English — Sinhala first, then English.`,
  },
  {
    id: 'text',
    label: 'Read Text',
    icon: '📝',
    prompt: `Extract and transcribe ALL text visible in this image. If text is in Sinhala, include it. Present in a clean list format.`,
  },
  {
    id: 'currency',
    label: 'Currency',
    icon: '💵',
    prompt: `Identify all currency notes and coins in this image. For each, state the denomination and currency name (e.g. 100 LKR). Respond in Sinhala and English.`,
  },
  {
    id: 'safety',
    label: 'Safety',
    icon: '🛡️',
    prompt: `Analyze this image for any potential visual indicators of danger or alerts that a hearing-impaired person might miss (e.g., flashing fire alarms, people shouting, approaching emergency vehicles with lights on). Warn clearly in Sinhala and English.`,
  }
];

const Aivision = () => {
  const [preview, setPreview] = useState(null);
  const [activeModeId, setActiveModeId] = useState('describe');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const fileRef = useRef(null);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
      setResult('');
      setError(null);
    }
  };

  const analyze = async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);
    setResult('');

    try {
      // ලොග් වී ඇති පරිශීලකයාගේ ID එක ලබා ගැනීම
      const currentUser = auth.currentUser;
      const userId = currentUser ? currentUser.uid : 'anonymous';

      const response = await fetch('http://localhost:5000/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: preview,
          prompt: MODES.find(m => m.id === activeModeId).prompt,
          mode: activeModeId,
          userId: userId // Backend එකට යැවීම
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Connection failed");
      
      setResult(data.result);
    } catch (err) {
      setError(err.message);
      console.error("Frontend Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const speakResult = () => {
    if (!result) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(result);
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="card vision-card">
      <div className="card-head">
        <div className="card-title">👁️ AI Vision Assistant</div>
      </div>

      <div className="vision-modes" style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {MODES.map(mode => (
          <button
            key={mode.id}
            className={`mode-btn ${activeModeId === mode.id ? 'active' : ''}`}
            onClick={() => setActiveModeId(mode.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-card)',
              background: activeModeId === mode.id ? 'var(--purple-dim)' : 'var(--bg-card)',
              color: activeModeId === mode.id ? 'var(--purple)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {mode.icon} {mode.label}
          </button>
        ))}
      </div>

      <div 
        className="vision-upload-zone" 
        onClick={() => fileRef.current?.click()}
        style={{
          border: '2px dashed var(--border-card)',
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center',
          cursor: 'pointer',
          background: 'var(--purple-dim)',
          marginBottom: '16px'
        }}
      >
        <input type="file" hidden ref={fileRef} onChange={onFileChange} accept="image/*" />
        {preview ? (
          <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '12px' }} />
        ) : (
          <p>📸 Tap to Upload Photo</p>
        )}
      </div>

      <div className="vision-actions">
        {preview && (
          <button 
            className="btn btn-violet btn-full" 
            onClick={analyze} 
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #9B6DFF, #7B4DFF)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze Image'}
          </button>
        )}
      </div>

      {error && (
        <div style={{
          background: 'rgba(255, 51, 85, 0.1)',
          border: '1px solid #FF3355',
          borderRadius: '8px',
          padding: '12px',
          marginTop: '12px',
          color: '#FF3355'
        }}>
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div style={{
          marginTop: '16px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontWeight: 'bold' }}>Result</span>
            <button 
              onClick={speakResult}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                borderRadius: '8px',
                padding: '4px 12px',
                cursor: 'pointer'
              }}
            >
              {speaking ? '🛑 Stop' : '🔊 Speak'}
            </button>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{result}</div>
        </div>
      )}
    </div>
  );
};

export default Aivision;