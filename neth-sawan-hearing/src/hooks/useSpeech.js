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
  const [retryCount, setRetryCount] = useState(0);
  const [recognitionStatus, setRecognitionStatus] = useState('idle'); // idle, starting, listening, error

  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const restartTimeoutRef = useRef(null);

  // Speech Recognition constructor
  const SpeechRecognitionAPI = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

  // Detect browser
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
      setError('❌ Your browser does not support Speech Recognition. Use Chrome, Edge, or Safari (iOS 14.3+).');
    } else {
      // Check if we are on HTTPS (required for microphone)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setError('🔒 Please use HTTPS to enable microphone access.');
      }
    }
  }, []);

  // Create recognition instance
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
          if (event.results[i].isFinal) {
            current += event.results[i][0].transcript;
          } else {
            current += event.results[i][0].transcript;
          }
        }
        if (current.trim()) {
          setTranscript(current);
          console.log('🎤 Transcript:', current);
        }
      };

      rec.onerror = (event) => {
        console.error('Speech error:', event.error);
        let userMessage = '';
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          userMessage = '🎤 Microphone access denied. Please allow microphone in browser settings, then tap "Retry".';
          setMicrophonePermission('denied');
        } else if (event.error === 'audio-capture') {
          userMessage = '🎤 No microphone found. Please connect a microphone.';
        } else if (event.error === 'network') {
          userMessage = '🌐 Network error. Check your internet connection.';
        } else if (event.error === 'aborted') {
          return; // user stopped
        } else if (event.error === 'no-speech') {
          // ignore, user not speaking
          return;
        } else if (event.error === 'language-not-supported') {
          userMessage = `🌍 Language "${language}" not supported. Falling back to English.`;
          // Try to restart with English
          setLangState('en-US');
          return;
        } else {
          userMessage = `⚠️ Error: ${event.error}. Try refreshing.`;
        }
        if (userMessage) setError(userMessage);
        if (event.error !== 'aborted') {
          listeningRef.current = false;
          setIsListening(false);
          setRecognitionStatus('error');
        }
      };

      rec.onend = () => {
        console.log('Recognition ended, listening:', listeningRef.current);
        if (listeningRef.current) {
          // Auto-restart
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (listeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error('Restart failed:', e);
                setError('Failed to restart. Tap Start again.');
                listeningRef.current = false;
                setIsListening(false);
                setRecognitionStatus('error');
              }
            }
            restartTimeoutRef.current = null;
          }, 300);
        } else {
          setIsListening(false);
          setRecognitionStatus('idle');
        }
      };

      rec.onstart = () => {
        console.log('Recognition started');
        setError('');
        setIsListening(true);
        setRecognitionStatus('listening');
        setMicrophonePermission('granted');
      };

      return rec;
    } catch (err) {
      console.error('Create recognition error:', err);
      setError('Failed to initialize speech recognition.');
      return null;
    }
  }, [SpeechRecognitionAPI]);

  // Recreate when language changes
  useEffect(() => {
    if (!SpeechRecognitionAPI) return;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    const newRec = createRecognition(lang);
    recognitionRef.current = newRec;
    listeningRef.current = false;
    setIsListening(false);
    setRecognitionStatus('idle');
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    };
  }, [lang, createRecognition]);

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicrophonePermission('granted');
      return true;
    } catch (err) {
      console.error('Microphone permission error:', err);
      if (err.name === 'NotAllowedError') {
        setError('🎤 Microphone access denied. Please allow microphone in browser settings, then tap "Retry".');
      } else if (err.name === 'NotFoundError') {
        setError('🎤 No microphone found on your device.');
      } else {
        setError('🎤 Could not access microphone. Please check your permissions.');
      }
      setMicrophonePermission('denied');
      return false;
    }
  };

  const retryListening = useCallback(async () => {
    setError('');
    setRetryCount(prev => prev + 1);
    if (microphonePermission === 'denied') setMicrophonePermission(null);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    listeningRef.current = false;
    setIsListening(false);
    setRecognitionStatus('idle');
    const newRec = createRecognition(lang);
    recognitionRef.current = newRec;
    await startListening();
  }, [microphonePermission, lang, createRecognition]);

  const startListening = useCallback(async () => {
    setError('');
    setRecognitionStatus('starting');
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition not supported.');
      setRecognitionStatus('error');
      return;
    }
    if (listeningRef.current) {
      console.log('Already listening');
      setRecognitionStatus('listening');
      return;
    }
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      setRecognitionStatus('error');
      return;
    }
    if (!recognitionRef.current) {
      recognitionRef.current = createRecognition(lang);
    }
    if (!recognitionRef.current) {
      setError('Failed to initialize speech recognition.');
      setRecognitionStatus('error');
      return;
    }
    try {
      await recognitionRef.current.start();
      listeningRef.current = true;
      setIsListening(true);
      setRecognitionStatus('listening');
      console.log('Start listening success');
    } catch (e) {
      console.error('Start error:', e);
      if (e.message === 'start called multiple times') {
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            if (recognitionRef.current && !listeningRef.current) {
              recognitionRef.current.start();
              listeningRef.current = true;
              setIsListening(true);
              setRecognitionStatus('listening');
            }
          }, 200);
        } catch (err) {
          setError('Failed to start. Please refresh.');
          setRecognitionStatus('error');
        }
      } else {
        setError('Failed to start speech recognition. Please refresh.');
        setRecognitionStatus('error');
      }
    }
  }, [SpeechRecognitionAPI, lang, createRecognition]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      listeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
      setRecognitionStatus('idle');
      console.log('Stop listening');
    } catch (e) {
      console.error('Stop error:', e);
      listeningRef.current = false;
      setIsListening(false);
      setRecognitionStatus('idle');
    }
  }, []);

  const clearTranscript = useCallback(() => setTranscript(''), []);
  const setLang = useCallback((newLang) => setLangState(newLang), []);

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
    retryListening,
    retryCount,
    recognitionStatus,
  };
};