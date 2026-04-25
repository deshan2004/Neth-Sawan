import { useState, useEffect, useRef, useCallback } from 'react';

export const useSpeech = (initialLang = 'si-LK') => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [lang, setLangState] = useState(initialLang);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const [supported, setSupported] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, []);

  const SpeechRecognition = 
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  useEffect(() => {
    if (!SpeechRecognition) {
      setSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari on iOS 14.3+');
    }
  }, [SpeechRecognition]);

  const createRecognition = useCallback((language) => {
    if (!SpeechRecognition) return null;

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = language;
      rec.maxAlternatives = 1;
      
      // Mobile-specific settings
      if (isMobile) {
        rec.continuous = false; // Some mobile browsers work better with continuous=false
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
        setTranscript(current);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'no-speech') {
          if (isMobile) {
            setError('No speech detected. Please speak into the microphone.');
          }
          return;
        }
        
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone permission in your browser settings.');
        } else if (event.error === 'audio-capture') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else if (event.error === 'network') {
          setError('Network error. Please check your internet connection.');
        } else if (event.error === 'aborted') {
          return;
        } else {
          setError(`Speech error: ${event.error}`);
        }
        
        setIsListening(false);
        listeningRef.current = false;
      };

      rec.onend = () => {
        if (listeningRef.current) {
          // For mobile, don't auto-restart as it can cause issues
          if (!isMobile) {
            setTimeout(() => {
              if (listeningRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (e) {
                  console.log('Auto-restart failed:', e);
                }
              }
            }, 100);
          }
        } else {
          setIsListening(false);
        }
      };

      rec.onstart = () => {
        console.log('Speech recognition started');
        setError('');
        setIsListening(true);
      };

      return rec;
    } catch (err) {
      console.error('Failed to create recognition:', err);
      setError('Failed to initialize speech recognition.');
      return null;
    }
  }, [SpeechRecognition, isMobile]);

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
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    if (listeningRef.current) return;

    // Request microphone permission first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Microphone permission error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please click the microphone icon in your browser address bar and allow access.');
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
  };
};