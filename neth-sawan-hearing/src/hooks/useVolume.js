// src/hooks/useVolume.js
import { useState, useEffect, useRef } from 'react';

export const useVolume = (threshold = 0.15) => {
  const [isLoud, setIsLoud] = useState(false);
  const [volume, setVolume] = useState(0);
  const [soundType, setSoundType] = useState('');
  const [soundHistory, setSoundHistory] = useState([]);
  const [audioError, setAudioError] = useState('');

  const contextRef = useRef(null);
  const lastSoundRef = useRef('');
  const lastSoundTimeRef = useRef(0);
  const wasLoudRef = useRef(false);

  // MediaRecorder සඳහා refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const isRecordingRef = useRef(false);

  // ── ශබ්දය ග්‍රහණය කර ගැනීම (Capture) ──
  const captureRecentAudio = () => {
    try {
      if (audioChunksRef.current.length === 0) {
        console.warn('No audio chunks available');
        return null;
      }

      // Blob එකක් සාදන්න
      const blob = new Blob(audioChunksRef.current, { 
        type: 'audio/webm;codecs=opus' 
      });

      // අවම වශයෙන් 1KB ශබ්දයක් තිබේදැයි පරීක්ෂා කරන්න
      if (blob.size < 1024) {
        console.warn('Audio too small, skipping playback');
        return null;
      }

      // URL එක සාදන්න
      const url = URL.createObjectURL(blob);
      console.log('✅ Audio URL created:', url, 'Size:', blob.size, 'bytes');
      return url;
    } catch (err) {
      console.error('Audio capture error:', err);
      return null;
    }
  };

  // ── MediaRecorder Setup ──
  useEffect(() => {
    let analyser, microphone, scriptNode;

    const setup = async () => {
      try {
        // 1. මයික්‍රෆෝනය ලබා ගන්න
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: false, 
            noiseSuppression: false, 
            autoGainControl: false,
            sampleRate: 44100
          } 
        });
        streamRef.current = stream;

        // 2. AudioContext එක සාදන්න (Volume Detection සඳහා)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
        contextRef.current = audioContext;

        analyser = audioContext.createAnalyser();
        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        microphone = audioContext.createMediaStreamSource(stream);
        scriptNode = audioContext.createScriptProcessor(2048, 1, 1);

        microphone.connect(analyser);
        analyser.connect(scriptNode);
        scriptNode.connect(audioContext.destination);

        scriptNode.onaudioprocess = () => {
          const freqData = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(freqData);

          let sum = 0;
          for (let i = 0; i < freqData.length; i++) sum += freqData[i];
          const avg = sum / freqData.length / 255;

          setVolume(avg);
          const loud = avg > threshold;
          setIsLoud(loud);

          // 🎯 ශබ්දය හඳුනාගත් විට Playback URL එක Save කරන්න
          if (loud && !wasLoudRef.current) {
            wasLoudRef.current = true;
            
            // අවසන් තත්පර 2-3ක ශබ්දය ගන්න
            const audioUrl = captureRecentAudio();
            const type = classifySound(freqData);
            setSoundType(type);

            const now = Date.now();
            if (type !== lastSoundRef.current || now - lastSoundTimeRef.current > 3000) {
              lastSoundRef.current = type;
              lastSoundTimeRef.current = now;
              
              // History එකට එකතු කරන්න
              const newEntry = { 
                id: now,
                type, 
                time: new Date(), 
                volume: avg,
                audioUrl: audioUrl // මෙය null විය හැක
              };
              
              setSoundHistory(prev => [newEntry, ...prev].slice(0, 20));
              console.log('✅ Sound detected:', type, 'Audio URL:', audioUrl ? 'Yes' : 'No');
            }
          } else if (!loud) {
            wasLoudRef.current = false;
            if (avg <= threshold * 0.5) {
              setSoundType('');
            }
          }
        };

        // 3. MediaRecorder (ශබ්දය පටිගත කිරීම)
        try {
          let mimeType = 'audio/webm;codecs=opus';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/webm';
          }
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/mp4';
          }
          
          mediaRecorderRef.current = new MediaRecorder(stream, { 
            mimeType: mimeType,
            audioBitsPerSecond: 128000
          });
          
          console.log('✅ MediaRecorder created with:', mimeType);
        } catch (err) {
          console.warn('MediaRecorder fallback:', err);
          mediaRecorderRef.current = new MediaRecorder(stream);
        }

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
            // අවසන් තත්පර 4-5 පමණක් තබා ගන්න
            // (තත්පර 1කට එක chunk එකක්, එනිසා chunks 5ක් පමණ)
            if (audioChunksRef.current.length > 6) {
              audioChunksRef.current.shift();
            }
          }
        };

        // තත්පර 1කට වරක් Chunk එකක් ගන්න
        mediaRecorderRef.current.start(1000);
        isRecordingRef.current = true;
        console.log('✅ MediaRecorder started');

        setAudioError('');
      } catch (err) {
        console.error('Setup error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setAudioError('Microphone access denied. Please allow microphone in browser settings.');
        } else if (err.name === 'NotFoundError') {
          setAudioError('No microphone found. Please connect a microphone.');
        } else {
          setAudioError('Could not access microphone: ' + err.message);
        }
      }
    };

    setup();

    // ── Cleanup ──
    return () => {
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
        audioChunksRef.current = [];
        isRecordingRef.current = false;
      } catch (err) {
        console.warn('Cleanup error:', err);
      }
    };
  }, [threshold]);

  // ── ශබ්ද වර්ගීකරණය ──
  const classifySound = (freqData) => {
    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const low  = avg(Array.from(freqData.slice(0,  50)));
    const mid  = avg(Array.from(freqData.slice(50, 150)));
    const high = avg(Array.from(freqData.slice(150, 250)));

    if (high > 180 && mid > 100) return 'Alarm / Alert';
    if (mid > 160 && low > 130)  return 'Vehicle / Motor';
    if (low > 180 && mid < 100)  return 'Phone Ring';
    if (mid > 140 && high < 100) return 'Voice / Speech';
    if (low > 200)               return 'Loud Noise';
    return 'Sound Detected';
  };

  return { 
    isLoud, 
    volume, 
    soundType, 
    soundHistory, 
    audioError,
    setSoundHistory
  };
};