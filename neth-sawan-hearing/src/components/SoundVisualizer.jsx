import React, { useEffect, useRef } from 'react';

const SoundVisualizer = ({ volume, isLoud, soundType }) => {
  const canvasRef  = useRef(null);
  const animRef    = useRef(null);
  const historyRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx   = canvas.getContext('2d');
    const W     = canvas.width;
    const H     = canvas.height;

    historyRef.current = [volume, ...historyRef.current.slice(0, 59)];

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      ctx.setLineDash([2, 4]);
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath();
        ctx.moveTo(0, (H / 4) * i);
        ctx.lineTo(W, (H / 4) * i);
        ctx.stroke();
      }

      ctx.setLineDash([]);

      const bw = W / historyRef.current.length;
      historyRef.current.forEach((v, i) => {
        const bh = Math.max(v * H * 2, 1);
        const x  = W - (i + 1) * bw;
        const y  = H - bh;

        const grad = ctx.createLinearGradient(x, y, x, H);
        if (isLoud) {
          grad.addColorStop(0, '#E8344A');
          grad.addColorStop(1, 'rgba(232,52,74,0.3)');
        } else {
          grad.addColorStop(0, '#00CFA8');
          grad.addColorStop(1, 'rgba(0,207,168,0.2)');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, Math.max(bw - 1.5, 1), bh);
      });

      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.7);
      ctx.lineTo(W, H * 0.7);
      ctx.stroke();
      ctx.setLineDash([]);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [volume, isLoud]);

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="card-head" style={{ marginBottom: 10 }}>
        <div className="card-title" style={{ fontSize: 13 }}>
          <span className="card-title-icon icon-teal" style={{ width: 24, height: 24, fontSize: 12 }}>~</span>
          Waveform
        </div>
      </div>

      <div className="canvas-wrap">
        <canvas ref={canvasRef} width={400} height={80} />
      </div>

      {soundType && (
        <div className="viz-info">
          <span className="viz-icon">{isLoud ? '🔊' : '🔈'}</span>
          <span className="viz-type">{soundType}</span>
          <span className={`viz-pct ${isLoud ? 'loud' : ''}`}>
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default SoundVisualizer;