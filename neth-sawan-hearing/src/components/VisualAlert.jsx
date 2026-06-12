import React, { useState, useEffect } from 'react';
import './VisualAlert.css';

const VisualAlert = ({ isLoud, volume, soundType, soundHistory, threshold, onThresholdChange }) => {
  const [pop, setPop] = useState(false);
  const pct = Math.min(volume * 100, 100);
  
  // Ensure threshold has a default value (prevent NaN)
  const safeThreshold = threshold ?? 0.15;
  
  let alertColor = '#00CCAA';
  let alertLevel = 'Normal';
  if (pct > safeThreshold * 100) {
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
      const timer = setTimeout(() => setPop(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [isLoud]);

  return (
    <div className="card alert-card">
      <div className="card-head">
        <div className="card-title">
          <span>🔊</span> Sound Monitor
          <span className={`alert-level-badge ${isLoud ? 'critical' : pct > safeThreshold * 100 ? 'warning' : 'normal'}`}>
            {alertLevel}
          </span>
        </div>
      </div>

      <div className="vol-header">
        <span>Volume Level</span>
        <span className="vol-num" style={{ color: alertColor }}>{Math.round(pct)}%</span>
      </div>

      <div className="vol-track">
        <div className="vol-fill" style={{ width: `${pct}%`, background: alertColor }} />
      </div>

      {isLoud && (
        <div className="alert-box">
          <div className="alert-content">
            <span className="alert-icon">⚠️</span>
            <div>
              <div className="alert-title">LOUD SOUND DETECTED!</div>
              <div className="alert-type">{soundType || 'Unknown sound'}</div>
            </div>
          </div>
        </div>
      )}

      <div className="sensitivity-control">
        <label className="sensitivity-label">Sensitivity: {Math.round(safeThreshold * 100)}%</label>
        <input
          type="range"
          className="sensitivity-slider"
          min="0.05"
          max="0.3"
          step="0.01"
          value={safeThreshold}
          onChange={e => onThresholdChange?.(parseFloat(e.target.value))}
        />
        <div className="sensitivity-hint">
          <span>More sensitive</span>
          <span>Less sensitive</span>
        </div>
      </div>

      {soundHistory && soundHistory.length > 0 && (
        <div className="recent-sounds">
          <div className="recent-title">Recent sounds:</div>
          <div className="sound-chips">
            {soundHistory.slice(0, 6).map((s, i) => (
              <span key={i} className="sound-chip">{s.type}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualAlert;