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
  const [microphonePermission, setMicrophonePermission] = useState(null);

  // Choose correct SpeechRecognition constructor
  const SpeechRecognitionAPI = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

  // Detect browser info once
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
      setError('Your browser does not support Speech Recognition. Please use Chrome, Edge, or Safari (iOS 14.3+).');
    }
  }, []);

  // Create recognition instance with current language
  const createRecognition = useCallback((language) => {
    if (!SpeechRecognitionAPI) return null;

    try {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = language;
      rec.maxAlternatives = 1;

      // Mobile: sometimes need to disable continuous mode? Keep it but handle restarts.
      if (/iPhone|iPad|Android/i.test(navigator.userAgent)) {
        // On some Android versions, continuous mode may stop unexpectedly
        // We'll keep it but add robust reconnection
        console.log('Mobile device detected, enabling aggressive reconnection');
      }

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
          console.log('🎤 Transcript updated:', current);
        }
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        let userMessage = '';
        if (event.error === 'not-allowed') {
          userMessage = 'Microphone access denied. Please allow microphone in browser settings, then refresh.';
          setMicrophonePermission('denied');
        } else if (event.error === 'audio-capture') {
          userMessage = 'No microphone found. Please connect a microphone.';
        } else if (event.error === 'network') {
          userMessage = 'Network error. Check your internet connection.';
        } else if (event.error === 'aborted') {
          // usually when stopListening is called, ignore
          return;
        } else if (event.error === 'no-speech') {
          // ignore, user just not speaking
          return;
        } else {
          userMessage = `Error: ${event.error}. Try reloading the page.`;
        }
        
        if (userMessage) {
          setError(userMessage);
        }
        
        // If error is not aborted, turn off listening flag
        if (event.error !== 'aborted') {
          listeningRef.current = false;
          setIsListening(false);
        }
      };

      rec.onend = () => {
        console.log('Speech recognition ended, listening flag:', listeningRef.current);
        if (listeningRef.current) {
          // Auto-restart on mobile if we still intend to listen
          console.log('Auto-restarting speech recognition...');
          setTimeout(() => {
            if (listeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error('Auto-restart failed:', e);
                setError('Failed to restart speech recognition. Please tap Start again.');
                listeningRef.current = false;
                setIsListening(false);
              }
            }
          }, 300);
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
  }, [SpeechRecognitionAPI]);

  // Recreate recognition when language changes
  useEffect(() => {
    if (!SpeechRecognitionAPI) return;

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
  }, [lang, createRecognition, SpeechRecognitionAPI]);

  // Request microphone permission separately (helps on mobile)
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicrophonePermission('granted');
      return true;
    } catch (err) {
      console.error('Microphone permission error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please tap the lock icon in your browser and allow microphone, then refresh.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found on your device.');
      } else {
        setError('Could not access microphone. Please check your permissions.');
      }
      setMicrophonePermission('denied');
      return false;
    }
  };

  const startListening = useCallback(async () => {
    setError('');
    
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition not supported in this browser. Use Chrome, Edge, or Safari on iOS 14.3+.');
      return;
    }

    if (listeningRef.current) {
      console.log('Already listening');
      return;
    }

    // Ask for microphone permission first (critical on mobile)
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
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
          setError('Failed to start. Please refresh the page.');
        }
      } else {
        setError('Failed to start speech recognition. Please refresh the page.');
      }
    }
  }, [SpeechRecognitionAPI, lang, createRecognition]);

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
  };
};