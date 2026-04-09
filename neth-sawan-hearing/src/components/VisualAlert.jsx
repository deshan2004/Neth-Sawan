import React, { useState, useEffect } from 'react';

const VisualAlert = ({ isLoud, volume, soundType, soundHistory, threshold, onThresholdChange }) => {
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (isLoud) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 900);
      return () => clearTimeout(t);
    }
  }, [isLoud]);

  const pct   = Math.min(volume * 100, 100);
  const color = isLoud ? 'var(--red)' : pct > threshold * 70 ? 'var(--amber)' : 'var(--teal)';

  return (
    <div className={`card alert-card ${isLoud ? 'active' : ''}`}>
      <div className="card-head">
        <div className="card-title">
          <span className="card-title-icon icon-teal">🔊</span>
          Sound Analysis
        </div>
      </div>

      <div className="vol-header">
        <span className="vol-label">Current Level</span>
        <span className="vol-num" style={{ color }}>{Math.round(pct)}%</span>
      </div>

      <div className="vol-track">
        <div
          className="vol-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>

      {soundType && (
        <div className={`sound-type-row ${isLoud ? 'loud' : ''}`}>
          <span style={{ fontSize: 16 }}>{isLoud ? '🔊' : '🔈'}</span>
          <span style={{ flex: 1 }}>{soundType}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{Math.round(pct)}%</span>
        </div>
      )}

      {isLoud && (
        <div className={`alert-box ${pop ? 'pop' : ''}`}>
          <span className="alert-icon">⚠</span>
          <div>
            <p className="alert-title">Loud sound detected</p>
            <p className="alert-sub">{soundType || 'Unidentified sound'}</p>
          </div>
        </div>
      )}

      <div className="sensitivity-row" style={{ marginTop: 14 }}>
        <label>Detection threshold — {Math.round(threshold * 100)}%</label>
        <input
          type="range" className="slider"
          min="0.05" max="0.3" step="0.01"
          value={threshold}
          onChange={e => onThresholdChange(parseFloat(e.target.value))}
        />
        <div className="slider-marks">
          <span>Low</span><span>Medium</span><span>High</span>
        </div>
      </div>

      {soundHistory && soundHistory.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-3)', marginBottom: 6 }}>
            Recent
          </div>
          <div className="chips">
            {soundHistory.slice(0, 8).map((s, i) => (
              <span className="chip" key={i} title={new Date(s.time).toLocaleTimeString()}>
                {s.type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualAlert;