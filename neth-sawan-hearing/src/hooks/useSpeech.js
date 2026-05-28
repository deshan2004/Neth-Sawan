import { useState, useEffect, useRef, useCallback } from 'react';

export const useSpeech = (initialLang = 'si-LK') => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [lang, setLangState] = useState(initialLang);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const [supported, setSupported] = useState(true);
  const [browserInfo, setBrowserInfo] = useState('');

  const SpeechRecognition = 
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  // Detect browser info for debugging
  useEffect(() => {
    const ua = navigator.userAgent;
    const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua);
    const isEdge = /Edg/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isFirefox = /Firefox/.test(ua);
    const isMobile = /Android|iPhone|iPad|iPod/.test(ua);
    setBrowserInfo(`Browser: ${isChrome ? 'Chrome' : isEdge ? 'Edge' : isSafari ? 'Safari' : isFirefox ? 'Firefox' : 'Other'} | Mobile: ${isMobile}`);
    
    if (!SpeechRecognition) {
      setSupported(false);
      setError(`Speech recognition not supported in this browser. ${browserInfo} Try Chrome or Edge on desktop.`);
    }
  }, []);

  const createRecognition = useCallback((language) => {
    if (!SpeechRecognition) return null;

    try {
      const rec = new SpeechRecognition();
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
        setTranscript(current);
        console.log('🎤 Transcript updated:', current);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'no-speech') return;
        
        let userMessage = '';
        if (event.error === 'not-allowed') {
          userMessage = 'Microphone access denied. Please click the lock icon in your browser address bar and allow microphone access.';
        } else if (event.error === 'audio-capture') {
          userMessage = 'No microphone found. Please connect a microphone and refresh.';
        } else if (event.error === 'network') {
          userMessage = 'Network error. Please check your internet connection.';
        } else if (event.error === 'aborted') {
          return;
        } else {
          userMessage = `Speech error: ${event.error}. Try reloading the page.`;
        }
        setError(userMessage);
        setIsListening(false);
        listeningRef.current = false;
      };

      rec.onend = () => {
        console.log('Speech recognition ended, listening flag:', listeningRef.current);
        if (listeningRef.current) {
          console.log('Auto-restarting speech recognition...');
          setTimeout(() => {
            if (listeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.log('Auto-restart failed:', e);
                setError('Failed to restart speech recognition. Please click Start again.');
                listeningRef.current = false;
                setIsListening(false);
              }
            }
          }, 100);
        } else {
          setIsListening(false);
        }
      };

      rec.onstart = () => {
        console.log('Speech recognition started successfully');
        setError('');
        setIsListening(true);
      };

      return rec;
    } catch (err) {
      console.error('Failed to create recognition:', err);
      setError('Failed to initialize speech recognition. ' + err.message);
      return null;
    }
  }, [SpeechRecognition]);

  useEffect(() => {
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }

    const newRecognition = createRecognition(lang);
    recognitionRef.current = newRecognition;
    listeningRef.current = false;
    setIsListening(false);

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
    };
  }, [lang, createRecognition, SpeechRecognition]);

  const startListening = useCallback(async () => {
    setError('');
    
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari on iOS 14.3+.');
      return;
    }

    if (listeningRef.current) {
      console.log('Already listening');
      return;
    }

    // Check microphone permission explicitly
    try {
      console.log('Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      console.log('Microphone permission granted');
    } catch (err) {
      console.error('Microphone permission error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please click the microphone icon in your browser address bar and allow access, then refresh the page.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found on your device.');
      } else {
        setError('Could not access microphone. Please check your permissions.');
      }
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = createRecognition(lang);
    }

    if (!recognitionRef.current) {
      setError('Failed to initialize speech recognition.');
      return;
    }

    try {
      await recognitionRef.current.start();
      listeningRef.current = true;
      setIsListening(true);
      console.log('Start listening called successfully');
    } catch (e) {
      console.error('Start listening error:', e);
      if (e.message === 'start called multiple times') {
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            if (recognitionRef.current && !listeningRef.current) {
              recognitionRef.current.start();
              listeningRef.current = true;
              setIsListening(true);
            }
          }, 200);
        } catch (err) {
          setError('Failed to start speech recognition. Please refresh the page.');
        }
      } else {
        setError('Failed to start speech recognition. Please refresh the page and try again.');
      }
    }
  }, [SpeechRecognition, lang, createRecognition]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      listeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
      console.log('Stop listening called');
    } catch (e) {
      console.error('Stop listening error:', e);
      listeningRef.current = false;
      setIsListening(false);
    }
  }, []);

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
    browserInfo, // for debugging
  };
};