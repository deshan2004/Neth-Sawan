import { useState, useEffect, useRef } from 'react';

export const useVolume = (initialThreshold = 0.15) => {
  const [isLoud, setIsLoud] = useState(false);
  const [volume, setVolume] = useState(0);
  const [soundType, setSoundType] = useState('');
  const [soundHistory, setSoundHistory] = useState([]);
  const [audioError, setAudioError] = useState('');
  const [threshold, setThreshold] = useState(initialThreshold);
  const contextRef = useRef(null);
  const lastSoundRef = useRef('');
  const lastSoundTimeRef = useRef(0);

  useEffect(() => {
    let audioContext, analyser, microphone, source;

    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        contextRef.current = audioContext;

        analyser = audioContext.createAnalyser();
        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        await audioContext.resume();

        const processAudio = () => {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length / 255;

          setVolume(avg);
          setIsLoud(avg > threshold);

          if (avg > threshold) {
            const type = classifySound(dataArray);
            setSoundType(type);

            const now = Date.now();
            if (type !== lastSoundRef.current || now - lastSoundTimeRef.current > 2000) {
              lastSoundRef.current = type;
              lastSoundTimeRef.current = now;
              setSoundHistory(prev => [{ type, time: new Date(), volume: avg }, ...prev].slice(0, 30));
            }
          } else if (avg <= threshold * 0.5) {
            setSoundType('');
          }

          requestAnimationFrame(processAudio);
        };

        processAudio();
        setAudioError('');
      } catch (err) {
        if (err.name === 'NotAllowedError') {
          setAudioError('Microphone access denied. Sound detection disabled.');
        } else {
          setAudioError('Could not access microphone.');
        }
      }
    };

    setup();

    return () => {
      try { 
        audioContext?.close(); 
        source?.disconnect();
      } catch {}
    };
  }, [threshold]);

  const classifySound = (freqData) => {
    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const low = avg(Array.from(freqData.slice(0, 50)));
    const mid = avg(Array.from(freqData.slice(50, 150)));
    const high = avg(Array.from(freqData.slice(150, 250)));

    if (high > 180 && mid > 100) return '🔔 Alarm / Alert';
    if (mid > 160 && low > 130) return '🚗 Vehicle / Motor';
    if (low > 180 && mid < 100) return '📞 Phone Ring';
    if (mid > 140 && high < 100) return '🗣️ Voice / Speech';
    if (low > 200) return '💥 Loud Noise';
    return '🔊 Sound Detected';
  };

  return { isLoud, volume, soundType, soundHistory, audioError, threshold, setThreshold };
};