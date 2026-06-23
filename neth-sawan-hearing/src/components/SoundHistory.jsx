// src/components/SoundHistory.jsx
import React, { useRef, useState } from 'react';
import './SoundHistory.css';

const ICONS = {
  'Alarm': '🔔',
  'Vehicle': '🚗',
  'Phone': '📞',
  'Voice': '👤',
  'Loud': '💥',
};

const getIcon = (type) => {
  for (const k of Object.keys(ICONS)) {
    if (type.includes(k)) return ICONS[k];
  }
  return '🔊';
};

const relTime = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(date).toLocaleDateString();
};

const SoundHistory = ({ soundHistory, onClear }) => {
  const [playingId, setPlayingId] = useState(null);
  const [playError, setPlayError] = useState(null);
  const audioRef = useRef(null);

  const handlePlay = (item) => {
    // Stop previous playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayError(null);

    // Check if we have audio URL
    if (!item.audioUrl) {
      setPlayError('⚠️ No audio recorded. Please try again with a louder sound.');
      return;
    }

    // Check if URL is valid
    if (!item.audioUrl.startsWith('blob:')) {
      setPlayError('⚠️ Invalid audio data. Please try again.');
      return;
    }

    try {
      const audio = new Audio(item.audioUrl);
      audioRef.current = audio;
      setPlayingId(item.id);

      // Success handlers
      audio.oncanplay = () => {
        console.log('✅ Audio loaded, playing...');
      };

      audio.onended = () => {
        setPlayingId(null);
        audioRef.current = null;
        try {
          URL.revokeObjectURL(item.audioUrl);
        } catch (e) {}
      };

      audio.onerror = (e) => {
        console.error('❌ Playback error:', e);
        setPlayError('❌ Cannot play audio. The file may be corrupted.');
        setPlayingId(null);
        audioRef.current = null;
      };

      // Start playback
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error('❌ Play failed:', err);
          setPlayError('❌ Cannot play audio. Please try again.');
          setPlayingId(null);
          audioRef.current = null;
        });
      }
    } catch (err) {
      console.error('❌ Audio creation error:', err);
      setPlayError('⚠️ Failed to load audio.');
      setPlayingId(null);
      audioRef.current = null;
    }
  };

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <span className="card-title-icon icon-amber">📜</span>
          Sound History
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {soundHistory.length > 0 && (
            <span style={{ fontSize: 11, color: '#00DDB3', fontWeight: 600 }}>
              {soundHistory.length} events
            </span>
          )}
          {soundHistory.length > 0 && onClear && (
            <button
              className="btn btn-outline-red btn-sm"
              onClick={onClear}
              style={{ padding: '2px 12px', fontSize: '11px', cursor: 'pointer' }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      <div className="history-list">
        {soundHistory.length === 0 ? (
          <div className="history-empty">
            <div className="big">🔇</div>
            <p style={{ fontSize: 13, color: '#8899CC' }}>No sounds detected yet.</p>
            <p style={{ fontSize: 11, color: '#8899CC', opacity: 0.6 }}>
              Make a loud sound to see it here.
            </p>
          </div>
        ) : (
          soundHistory.map((item) => {
            const isPlaying = playingId === item.id;
            const hasAudio = !!item.audioUrl;
            return (
              <div key={item.id} className="history-row">
                <span className="h-icon">{getIcon(item.type)}</span>
                <div className="h-type">
                  {item.type}
                  {item.volume && (
                    <span className="h-vol" style={{ marginLeft: 6 }}>
                      {Math.round(item.volume * 100)}%
                    </span>
                  )}
                </div>
                <span className="h-time">{relTime(item.time)}</span>

                <button
                  className={`playback-btn ${isPlaying ? 'playing' : ''}`}
                  onClick={() => handlePlay(item)}
                  disabled={isPlaying || !hasAudio}
                  title={hasAudio ? 'Play this sound' : 'No audio recorded'}
                >
                  {isPlaying ? '⏹' : '▶'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {playError && (
        <div style={{
          padding: '10px 16px',
          marginTop: '12px',
          background: 'rgba(255,51,85,0.15)',
          borderLeft: '4px solid #FF3355',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#FF6B8A'
        }}>
          {playError}
        </div>
      )}
    </div>
  );
};

export default SoundHistory;