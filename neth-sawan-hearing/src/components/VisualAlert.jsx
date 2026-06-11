import React, { useState, useEffect } from 'react';

const VisualAlert = ({ isLoud, volume, soundType, soundHistory, threshold, onThresholdChange }) => {
  const [pop, setPop] = useState(false);
  const pct = Math.min(volume * 100, 100);
  let alertColor = '#00CCAA';
  let alertLevel = 'Normal';
  if (pct > threshold * 100) {
    alertColor = '#FF8800';
    alertLevel = 'Warning';
  }
  if (isLoud) {
    alertColor = '#FF0033';
    alertLevel = 'CRITICAL!';
  }

  useEffect(() => {
    if (isLoud) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 1200);
      return () => clearTimeout(t);
    }
  }, [isLoud]);

  return (
    <div className="card alert-card">
      <div className="card-head">
        <div className="card-title">
          <span>🔊</span> Sound Monitor
          <span style={{ background: alertColor, color: '#000', padding: '4px 12px', borderRadius: '40px', marginLeft: '12px', fontWeight: 'bold' }}>
            {alertLevel}
          </span>
        </div>
      </div>

      <div className="vol-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span>Volume Level</span>
        <span style={{ fontSize: '28px', fontWeight: 'bold', color: alertColor }}>{Math.round(pct)}%</span>
      </div>

      <div className="vol-track" style={{ height: '16px', background: '#2A2F55', borderRadius: '8px', overflow: 'hidden' }}>
        <div className="vol-fill" style={{ width: `${pct}%`, background: alertColor, height: '100%' }} />
      </div>

      {isLoud && (
        <div className="alert-box" style={{ marginTop: '20px', padding: '16px', background: '#FF003320', borderLeft: '8px solid #FF0033', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '40px' }}>⚠️</span>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FF0033' }}>LOUD SOUND DETECTED!</div>
              <div style={{ fontSize: '18px' }}>{soundType || 'Unknown sound'}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <label style={{ fontWeight: 'bold' }}>Sensitivity: {Math.round(threshold * 100)}%</label>
        <input
          type="range"
          min="0.05"
          max="0.3"
          step="0.01"
          value={threshold}
          onChange={e => onThresholdChange(parseFloat(e.target.value))}
          style={{ width: '100%', height: '8px', marginTop: '8px' }}
        />
      </div>

      {soundHistory && soundHistory.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Recent sounds:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {soundHistory.slice(0, 6).map((s, i) => (
              <span key={i} style={{ background: '#2A2F55', padding: '6px 12px', borderRadius: '40px', fontSize: '14px' }}>{s.type}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualAlert;