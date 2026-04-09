import React from 'react';

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

export const SoundHistory = ({ soundHistory }) => (
  <div className="card">
    <div className="card-head">
      <div className="card-title">
        <span className="card-title-icon icon-amber">📜</span>
        Sound History
      </div>
      {soundHistory.length > 0 && (
        <span style={{ fontSize:11, color:'var(--teal)', fontWeight:600 }}>
          {soundHistory.length} events
        </span>
      )}
    </div>

    <div className="history-list">
      {soundHistory.length === 0 ? (
        <div className="history-empty">
          <div className="big">🔇</div>
          <p style={{ fontSize:13, color:'var(--text-3)' }}>No sounds detected yet.</p>
          <p style={{ fontSize:11, color:'var(--text-3)', opacity:0.6 }}>Sound events will appear here in real time.</p>
        </div>
      ) : (
        soundHistory.map((item, i) => (
          <div key={i} className="history-row">
            <span className="h-icon">{getIcon(item.type)}</span>
            <div className="h-type">
              {item.type}
              {item.volume && (
                <span className="h-vol" style={{ marginLeft:6 }}>
                  {Math.round(item.volume * 100)}%
                </span>
              )}
            </div>
            <span className="h-time">{relTime(item.time)}</span>
          </div>
        ))
      )}
    </div>
  </div>
);

export default SoundHistory;