import React, { useEffect, useRef } from 'react';

const HapticFeedback = ({ isLoud, volume, soundType }) => {
  const ref = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isLoud || !soundType) return;

    if (ref.current) {
      ref.current.classList.add('vibrate');
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        ref.current?.classList.remove('vibrate');
      }, 600);
    }

    if (navigator.vibrate) {
      const isEmergency = /Alarm|Vehicle|Loud/i.test(soundType);
      navigator.vibrate(isEmergency ? [500, 150, 500, 150, 500] : [200]);
    }

    return () => clearTimeout(timerRef.current);
  }, [isLoud, soundType]);

  if (!isLoud) return null;

  return (
    <div className="haptic-bar" ref={ref}>
      <div className="vib-bars">
        {[150, 120, 180, 100, 140].map((h, i) => (
          <div
            key={i}
            className="vib-bar"
            style={{ height: `${Math.min(volume * h, 100)}%`, animationDelay: `${i * 0.05}s` }}
          />
        ))}
      </div>
      <span className="haptic-label">{soundType}</span>
    </div>
  );
};

export default HapticFeedback;