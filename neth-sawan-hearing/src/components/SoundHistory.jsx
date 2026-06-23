// src/components/SoundHistory.jsx
import React, { useRef, useState } from 'react';
import './SoundHistory.css';

const ICONS = {
  'Alarm':   '🔔',
  'Vehicle': '🚗',
  'Phone':   '📞',
  'Voice':   '👤',
  'Loud':    '💥',
};

const getIcon = (type) => {
  for (const k of Object.keys(ICONS)) {
    if (type.includes(k)) return ICONS[k];
  }
  return '🔊';
};

const relTime = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60000)   return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000)return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(date).toLocaleDateString();
};

const SoundHistory = ({ soundHistory, onClear }) => {
  const [playingId, setPlayingId] = useState(null);
  const [playError, setPlayError] = useState(null);
  const audioRef = useRef(null);

  const handlePlay = (item) => {
    // පෙර Playback එක නවත්වන්න
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayError(null);

    // audioUrl එක පරීක්ෂා කරන්න
    if (!item.audioUrl) {
      setPlayError('⚠️ No audio recorded for this event. Try again with louder sound.');
      return;
    }

    // URL එක වලංගු දැයි පරීක්ෂා කරන්න (Blob URL එකක් විය යුතුයි)
    if (!item.audioUrl.startsWith('blob:')) {
      setPlayError('⚠️ Invalid audio data. Please try again.');
      return;
    }

    try {
      const audio = new Audio(item.audioUrl);
      audioRef.current = audio;
      setPlayingId(item.id);

      // Playback සාර්ථක වූ විට
      audio.oncanplay = () => {
        console.log('✅ Audio loaded, playing...');
      };

      audio.onended = () => {
        setPlayingId(null);
        audioRef.current = null;
        // URL එක Revoke කරන්න (මතකය හිස් කිරීමට)
        try {
          URL.revokeObjectURL(item.audioUrl);
        } catch (e) {}
      };

      audio.onerror = (e) => {
        console.error('Playback error:', e);
        setPlayError('❌ Cannot play audio. The file may be corrupted.');
        setPlayingId(null);
        audioRef.current = null;
      };

      // Playback ආරම්භ කරන්න
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error('Play failed:', err);
          setPlayError('❌ Cannot play audio. Please try again.');
          setPlayingId(null);
          audioRef.current = null;
        });
      }
    } catch (err) {
      console.error('Audio creation error:', err);
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
              Sound events will appear here in real time.
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

                {/* 🎵 Playback Button */}
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

      {/* දෝෂ පණිවිඩය */}
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