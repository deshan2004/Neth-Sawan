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
  const [recognitionStatus, setRecognitionStatus] = useState('idle'); 

  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const restartTimeoutRef = useRef(null);

  const SpeechRecognitionAPI = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

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
    } else {
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setError('🔒 Please use HTTPS to enable microphone access.');
      }
    }
  }, [SpeechRecognitionAPI]);

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
        console.error('Speech error:', event.error);
        let userMessage = '';
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          userMessage = '🎤 Microphone access denied. Please allow microphone in settings.';
          setMicrophonePermission('denied');
        } else if (event.error === 'audio-capture') {
          userMessage = '🎤 No microphone found.';
        } else if (event.error === 'network') {
          userMessage = '🌐 Network error. Check internet connection.';
        } else if (event.error === 'aborted') {
          return;
        } else if (event.error === 'no-speech') {
          return;
        } else {
          userMessage = `⚠️ Error: ${event.error}`;
        }
        if (userMessage) setError(userMessage);
        if (event.error !== 'aborted') {
          listeningRef.current = false;
          setIsListening(false);
          setRecognitionStatus('error');
        }
      };

      rec.onend = () => {
        if (listeningRef.current) {
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (listeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
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
        setError('');
        setIsListening(true);
        setRecognitionStatus('listening');
        setMicrophonePermission('granted');
      };

      return rec;
    } catch (err) {
      return null;
    }
  }, [SpeechRecognitionAPI]);

  // Handle Dynamic Language Changes
  useEffect(() => {
    if (!SpeechRecognitionAPI) return;
    
    const wasListening = listeningRef.current;
    
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    const newRec = createRecognition(lang);
    recognitionRef.current = newRec;

    if (wasListening && newRec) {
      listeningRef.current = true;
      setTimeout(() => {
        try { 
          if(listeningRef.current) newRec.start(); 
        } catch(e) {}
      }, 400);
    }

    return () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    };
  }, [lang, createRecognition, SpeechRecognitionAPI]);

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

  const retryListening = useCallback(async () => {
    setError('');
    setRetryCount(prev => prev + 1);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    listeningRef.current = false;
    setIsListening(false);
    await startListening();
  }, [lang, createRecognition]);

  const startListening = useCallback(async () => {
    setError('');
    setRecognitionStatus('starting');
    if (!SpeechRecognitionAPI) return;
    
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      setError('🎤 Microphone access denied.');
      setRecognitionStatus('error');
      return;
    }
    
    if (!recognitionRef.current) {
      recognitionRef.current = createRecognition(lang);
    }
    
    try {
      listeningRef.current = true;
      await recognitionRef.current.start();
      setIsListening(true);
      setRecognitionStatus('listening');
    } catch (e) {
      setRecognitionStatus('error');
    }
  }, [SpeechRecognitionAPI, lang, createRecognition]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      listeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
      setRecognitionStatus('idle');
    } catch (e) {
      listeningRef.current = false;
      setIsListening(false);
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