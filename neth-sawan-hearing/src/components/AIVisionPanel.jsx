import React, { useState, useRef, useCallback } from 'react';

const MODES = [
  {
    id: 'describe',
    label: 'Describe',
    prompt: `Describe everything visible in this image thoroughly. Be specific about objects, people, text, colors, and spatial arrangement. Respond in both Sinhala (සිංහල) and English — Sinhala first, then English. Format clearly with "සිංහල:" and "English:" headings.`,
  },
  {
    id: 'text',
    label: 'Read Text',
    prompt: `Extract and transcribe ALL text visible in this image exactly as it appears. Include signs, labels, documents, screens, or any written content. If text is in Sinhala, include it. Present in a clean list format.`,
  },
  {
    id: 'currency',
    label: 'Currency',
    prompt: `Identify all currency (notes and coins) in this image. For each one state: denomination, currency name, country, and any notable security features. If Sri Lankan Rupees (රු / LKR) are present, describe them in both Sinhala and English. If no currency is visible, say so clearly.`,
  },
  {
    id: 'objects',
    label: 'Objects',
    prompt: `List every distinct object in this image. For each object provide: (1) English name, (2) Sinhala name if commonly used in Sri Lanka, (3) brief description of its appearance. Format as a numbered list.`,
  },
  {
    id: 'safety',
    label: 'Safety',
    prompt: `Analyze this image for safety information: warning signs, hazard symbols, safety instructions, danger indicators, or potential risks. Describe what you see and explain any relevant safety implications. Respond in both Sinhala and English.`,
  },
];

const AIVisionPanel = ({ lang, showToast }) => {
  const [mode, setMode] = useState('describe');
  const [imageData, setImageData] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem('neth_anthropic_key') || ''; } catch { return ''; }
  });
  const [showKeyInput, setShowKeyInput] = useState(false);

  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const saveKey = (key) => {
    setApiKey(key);
    try { localStorage.setItem('neth_anthropic_key', key); } catch {}
  };

  const readFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WEBP, GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }
    setError('');
    setResult('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const base64 = dataUrl.split(',')[1];
      setPreview(dataUrl);
      setImageData({ base64, mediaType: file.type });
    };
    reader.onerror = () => setError('Could not read the file.');
    reader.readAsDataURL(file);
  }, []);

  const handleFilePick = (e) => {
    if (e.target.files[0]) readFile(e.target.files[0]);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]);
  };

  const analyze = async () => {
    if (!imageData) return;
    if (!apiKey.trim()) {
      setShowKeyInput(true);
      setError('An Anthropic API key is required to use AI Vision.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    const selectedMode = MODES.find(m => m.id === mode) || MODES[0];

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: imageData.mediaType,
                    data: imageData.base64,
                  },
                },
                {
                  type: 'text',
                  text: selectedMode.prompt,
                },
              ],
            },
          ],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setError('Invalid API key. Please check your Anthropic API key.');
          setShowKeyInput(true);
        } else if (res.status === 429) {
          setError('Rate limit reached. Please wait a moment and try again.');
        } else {
          setError(data.error?.message || `Request failed (${res.status}).`);
        }
        return;
      }

      const text = data.content?.[0]?.text;
      if (text) {
        setResult(text);
      } else {
        setError('No response received from AI.');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const speakResult = () => {
    if (!result || !('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(result);
    utter.lang = 'en-US';
    utter.rate = 0.88;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  };

  const clear = () => {
    setPreview(null);
    setImageData(null);
    setResult('');
    setError('');
  };

  return (
    <div className="card vision-card">
      <div className="card-head">
        <div className="card-title">
          <span className="card-title-icon icon-violet">AI</span>
          AI Vision Analysis
        </div>
        <button
          className="btn btn-ghost btn-xs"
          onClick={() => setShowKeyInput(!showKeyInput)}
          title="API Key Settings"
        >
          Key Settings
        </button>
      </div>

      {(showKeyInput || !apiKey) && (
        <div className="api-key-box">
          <p>
            An Anthropic API key is required.{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--amber)', textDecoration: 'underline' }}
            >
              Get one here
            </a>
          </p>
          <div className="api-key-row">
            <input
              type="password"
              className="api-key-input"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button
              className="btn btn-amber btn-sm"
              onClick={() => {
                saveKey(apiKey);
                setShowKeyInput(false);
                setError('');
                showToast?.('API key saved', 'success');
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div className="vision-mode-bar">
        {MODES.map(m => (
          <button
            key={m.id}
            className={`mode-tab ${mode === m.id ? 'on' : ''}`}
            onClick={() => { setMode(m.id); setResult(''); }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {!preview ? (
        <div
          className={`dropzone ${dragOver ? 'over' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="dz-icon">📷</div>
          <p className="dz-title">Drop an image or click to upload</p>
          <p className="dz-sub">JPG, PNG, WEBP — max 5 MB</p>
        </div>
      ) : (
        <div className="vision-preview">
          <img src={preview} alt="Image for analysis" />
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFilePick} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={handleFilePick} />

      <div className="vision-btns" style={{ marginTop: '10px' }}>
        {!preview ? (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
              Upload Image
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => cameraRef.current?.click()}>
              Use Camera
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn-violet btn-sm"
              onClick={analyze}
              disabled={loading}
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={clear} disabled={loading}>
              Clear
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} disabled={loading}>
              Change Image
            </button>
          </>
        )}
      </div>

      {error && <div className="error-bar" style={{ marginTop:'10px' }}>{error}</div>}

      {loading && (
        <div className="vision-loading">
          <div className="spinner" />
          <span>Analyzing image…</span>
        </div>
      )}

      {result && !loading && (
        <div className="vision-result">
          <div className="result-lbl">
            <span>●</span> AI Response
          </div>
          <div className="result-text">{result}</div>
          {'speechSynthesis' in window && (
            <button
              className="btn btn-outline-teal btn-sm"
              onClick={speakResult}
              style={{ marginTop:'10px' }}
            >
              {speaking ? 'Stop Reading' : 'Read Aloud'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AIVisionPanel;