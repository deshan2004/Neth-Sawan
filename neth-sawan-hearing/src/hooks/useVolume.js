// src/hooks/useVolume.js
import { useState, useEffect, useRef } from 'react';
import { auth, db, addDoc, collection, serverTimestamp } from '../firebase';

export const useVolume = (threshold = 0.15) => {
  const [isLoud, setIsLoud] = useState(false);
  const [volume, setVolume] = useState(0);
  const [soundType, setSoundType] = useState('');
  const [soundHistory, setSoundHistory] = useState([]);
  const [audioError, setAudioError] = useState('');

  const contextRef = useRef(null);
  const analyserRef = useRef(null);
  const lastSoundRef = useRef('');
  const lastSoundTimeRef = useRef(0);
  const wasLoudRef = useRef(false);

  // ── Audio Recording Refs ──
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const isRecordingRef = useRef(false);

  // ── Save sound to Firestore (for logged‑in users) ──
  const saveSoundToFirestore = async (soundData) => {
    const user = auth.currentUser;
    if (!user) return; // Guest mode – skip

    try {
      await addDoc(collection(db, 'users', user.uid, 'sound_history'), {
        type: soundData.type,
        volume: soundData.volume,
        timestamp: serverTimestamp(),
        detectedBy: 'microphone',
        location: null // optional – could add GPS here
      });
      console.log('✅ Sound saved to Firestore');
    } catch (err) {
      console.error('Failed to save sound to Firestore:', err);
    }
  };

  // ── Get Audio URL from chunks ──
  const getAudioUrl = () => {
    try {
      if (audioChunksRef.current.length === 0) {
        console.warn('⚠️ No audio chunks available');
        return null;
      }

      const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
      if (totalSize < 1024) {
        console.warn('⚠️ Audio too small:', totalSize, 'bytes');
        return null;
      }

      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      console.log('✅ Audio URL created:', url);
      return url;
    } catch (err) {
      console.error('❌ Error creating audio URL:', err);
      return null;
    }
  };

  const clearAudioChunks = () => {
    audioChunksRef.current = [];
  };

  const startRecording = (stream) => {
    try {
      clearAudioChunks();

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          if (audioChunksRef.current.length > 6) {
            audioChunksRef.current.shift();
          }
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      isRecordingRef.current = true;
      console.log('✅ MediaRecorder started with:', mimeType);
      return true;
    } catch (err) {
      console.error('❌ Failed to start MediaRecorder:', err);
      return false;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Stop recording error:', err);
      }
    }
    isRecordingRef.current = false;
  };

  const captureRecentAudio = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const url = getAudioUrl();
        clearAudioChunks();
        resolve(url);
      }, 300);
    });
  };

  // ── Setup Audio Context ──
  useEffect(() => {
    let audioContext = null;
    let analyser = null;
    let scriptNode = null;
    let stream = null;

    const setup = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: 44100
          }
        });
        streamRef.current = stream;

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        contextRef.current = audioContext;
        await audioContext.resume();

        analyser = audioContext.createAnalyser();
        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        scriptNode = audioContext.createScriptProcessor(2048, 1, 1);
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

          if (loud && !wasLoudRef.current) {
            wasLoudRef.current = true;
            const type = classifySound(freqData);
            setSoundType(type);

            const now = Date.now();
            if (type !== lastSoundRef.current || now - lastSoundTimeRef.current > 3000) {
              lastSoundRef.current = type;
              lastSoundTimeRef.current = now;

              // 🔥 Save to Firestore (logged‑in users)
              saveSoundToFirestore({ type, volume: avg });

              captureRecentAudio().then((audioUrl) => {
                const newEntry = {
                  id: now,
                  type: type,
                  time: new Date(),
                  volume: avg,
                  audioUrl: audioUrl
                };
                setSoundHistory(prev => [newEntry, ...prev].slice(0, 20));
                console.log('✅ Sound detected:', type, 'Audio URL:', audioUrl ? 'Yes ✅' : 'No ❌');
              });
            }
          } else if (!loud) {
            wasLoudRef.current = false;
            if (avg <= threshold * 0.5) {
              setSoundType('');
            }
          }
        };

        const recorderStarted = startRecording(stream);
        if (!recorderStarted) {
          console.warn('⚠️ MediaRecorder failed, audio playback may not work');
        }

        setAudioError('');
        console.log('✅ Sound detection setup complete');

      } catch (err) {
        console.error('❌ Setup error:', err);
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

    return () => {
      try {
        stopRecording();
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (scriptNode) scriptNode.disconnect();
        if (analyser) analyser.disconnect();
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close();
        }
        clearAudioChunks();
      } catch (err) {
        console.warn('Cleanup error:', err);
      }
    };
  }, [threshold]);

  const classifySound = (freqData) => {
    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const low = avg(Array.from(freqData.slice(0, 50)));
    const mid = avg(Array.from(freqData.slice(50, 150)));
    const high = avg(Array.from(freqData.slice(150, 250)));

    if (high > 180 && mid > 100) return 'Alarm / Alert';
    if (mid > 160 && low > 130) return 'Vehicle / Motor';
    if (low > 180 && mid < 100) return 'Phone Ring';
    if (mid > 140 && high < 100) return 'Voice / Speech';
    if (low > 200) return 'Loud Noise';
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