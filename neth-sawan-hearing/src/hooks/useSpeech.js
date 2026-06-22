// src/hooks/useSpeech.js
import { useState, useEffect, useRef, useCallback } from 'react';

export const useSpeech = (initialLang = 'en-US') => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [lang, setLangState] = useState(initialLang);
  const [error, setError] = useState('');
  const [supported, setSupported] = useState(true);
  const [browserInfo, setBrowserInfo] = useState('');
  const [microphonePermission, setMicrophonePermission] = useState(null);
  const [recognitionStatus, setRecognitionStatus] = useState('idle');

  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const langRef = useRef(initialLang);

  const SpeechRecognitionAPI = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

  // Detect browser support
  useEffect(() => {
    const ua = navigator.userAgent;
    const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua);
    const isEdge = /Edg/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isFirefox = /Firefox/.test(ua);
    const isMobile = /Android|iPhone|iPad|iPod/.test(ua);
    const platform = isMobile ? 'Mobile' : 'Desktop';
    setBrowserInfo(`${platform} | ${isChrome ? 'Chrome' : isEdge ? 'Edge' : isSafari ? 'Safari' : isFirefox ? 'Firefox' : 'Other'}`);

    if (!SpeechRecognitionAPI) {
      setSupported(false);
      setError('❌ Your browser does not support Speech Recognition. Use Chrome, Edge, or Safari.');
    } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setError('🔒 Please use HTTPS to enable microphone access.');
    }

    // Check initial permission state without prompting
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' })
        .then(result => {
          setMicrophonePermission(result.state);
        })
        .catch(() => setMicrophonePermission('prompt'));
    } else {
      setMicrophonePermission('prompt');
    }
  }, [SpeechRecognitionAPI]);

  // Create a new recognition instance
  const createRecognition = useCallback((language) => {
    if (!SpeechRecognitionAPI) return null;
    try {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = language;
      rec.maxAlternatives = 1;

      rec.onresult = (event) => {
        let current = '';
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        if (current.trim()) {
          setTranscript(current);
        }
      };

      rec.onerror = (event) => {
        console.warn('Speech error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('🎤 Microphone access denied. Please allow microphone in settings.');
          setMicrophonePermission('denied');
          listeningRef.current = false;
          setIsListening(false);
          setRecognitionStatus('error');
        } else if (event.error === 'audio-capture') {
          setError('🎤 No microphone found.');
          listeningRef.current = false;
          setIsListening(false);
          setRecognitionStatus('error');
        } else if (event.error === 'network') {
          setError('🌐 Network error. Check internet connection.');
          listeningRef.current = false;
          setIsListening(false);
          setRecognitionStatus('error');
        } else if (event.error === 'aborted' || event.error === 'no-speech') {
          // These are normal, do nothing
        } else {
          setError(`⚠️ Error: ${event.error}`);
          listeningRef.current = false;
          setIsListening(false);
          setRecognitionStatus('error');
        }
      };

      rec.onend = () => {
        // Only update if we are not intentionally restarting
        if (listeningRef.current) {
          // Attempt to restart automatically
          try {
            if (recognitionRef.current) {
              recognitionRef.current.start();
            }
          } catch (e) {
            // If restart fails, stop listening
            listeningRef.current = false;
            setIsListening(false);
            setRecognitionStatus('idle');
          }
        } else {
          setIsListening(false);
          setRecognitionStatus('idle');
        }
      };

      rec.onstart = () => {
        setError('');
        setIsListening(true);
        setRecognitionStatus('listening');
        setMicrophonePermission('granted');
      };

      return rec;
    } catch (err) {
      console.error('Recognition creation error:', err);
      return null;
    }
  }, [SpeechRecognitionAPI]);

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicrophonePermission('granted');
      return true;
    } catch (err) {
      setMicrophonePermission('denied');
      return false;
    }
  };

  // Start listening
  const startListening = useCallback(async () => {
    setError('');
    setRecognitionStatus('starting');

    if (!SpeechRecognitionAPI) {
      setError('Speech recognition not supported.');
      setRecognitionStatus('error');
      return;
    }

    // If we already have a recognition instance and it's currently active, do nothing
    if (recognitionRef.current && listeningRef.current) {
      setRecognitionStatus('listening');
      return;
    }

    // If we have an instance but it's not active, we can start it
    if (recognitionRef.current && !listeningRef.current) {
      try {
        listeningRef.current = true;
        recognitionRef.current.start();
        return;
      } catch (e) {
        // If start fails, recreate
        console.warn('Failed to restart recognition, recreating:', e);
        recognitionRef.current = null;
      }
    }

    // Check permission
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      setError('🎤 Microphone access denied.');
      setRecognitionStatus('error');
      return;
    }

    // Create a new instance
    const rec = createRecognition(lang);
    if (!rec) {
      setError('Failed to create speech recognition instance.');
      setRecognitionStatus('error');
      return;
    }

    recognitionRef.current = rec;
    listeningRef.current = true;
    try {
      rec.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      setError('Failed to start. Please try again.');
      listeningRef.current = false;
      setIsListening(false);
      setRecognitionStatus('error');
    }
  }, [SpeechRecognitionAPI, lang, createRecognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    listeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
    setRecognitionStatus('idle');
  }, []);

  // Handle language changes
  useEffect(() => {
    langRef.current = lang;

    // If we are currently listening, stop and let the user restart
    if (listeningRef.current && recognitionRef.current) {
      console.log(`Language changed to ${lang}, stopping recognition.`);
      // Stop the current recognition
      try {
        recognitionRef.current.stop();
      } catch (e) { /* ignore */ }
      listeningRef.current = false;
      setIsListening(false);
      setRecognitionStatus('idle');
      // Show a toast message (handled in the component via setError or parent)
      setError(`Language changed. Tap "Start Captioning" again to continue with ${lang}.`);
    }

    // If not listening, just update the language for next start
    // We'll recreate the recognition instance on next start
    if (recognitionRef.current) {
      // Keep the instance but it will be recreated on next start
      recognitionRef.current = null;
    }
  }, [lang]);

  const clearTranscript = useCallback(() => setTranscript(''), []);
  const setLang = useCallback((newLang) => {
    setLangState(newLang);
  }, []);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    clearTranscript,
    setLang,
    lang,
    error,
    supported,
    browserInfo,
    microphonePermission,
    recognitionStatus,
    // Add a way to retry
    retryListening: startListening,
  };
};