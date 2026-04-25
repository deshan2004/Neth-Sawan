import { useState, useEffect, useRef, useCallback } from 'react';

export const useSpeech = (initialLang = 'en-US') => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [lang, setLangState] = useState(initialLang);
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const restartAttempts = useRef(0);

  const SpeechRecognition = typeof window !== 'undefined' 
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

  useEffect(() => {
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
    }
  }, [SpeechRecognition]);

  const createRecognition = useCallback((language) => {
    if (!SpeechRecognition) return null;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let currentTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            currentTranscript += transcriptPart + ' ';
          } else {
            interimTranscript += transcriptPart;
          }
        }
        
        if (interimTranscript) {
          setTranscript(prev => {
            const lastSpaceIndex = prev.lastIndexOf(' ');
            const baseText = lastSpaceIndex > 0 ? prev.substring(0, lastSpaceIndex + 1) : '';
            return baseText + interimTranscript;
          });
        }
        
        if (currentTranscript) {
          setTranscript(prev => prev + currentTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = '';
        switch(event.error) {
          case 'not-allowed':
            errorMessage = '🎤 Microphone access denied. Please allow microphone permission.';
            break;
          case 'audio-capture':
            errorMessage = '🎤 No microphone found. Please check your device.';
            break;
          case 'no-speech':
            return;
          case 'network':
            errorMessage = '🌐 Network error. Please check your connection.';
            break;
          default:
            errorMessage = `Speech error: ${event.error}`;
        }
        
        setError(errorMessage);
        
        if (event.error !== 'not-allowed' && listeningRef.current) {
          setTimeout(() => {
            if (listeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {}
            }
          }, 1000);
        } else {
          setIsListening(false);
          listeningRef.current = false;
        }
      };

      recognition.onend = () => {
        if (listeningRef.current && restartAttempts.current < 5) {
          restartAttempts.current++;
          setTimeout(() => {
            if (listeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {}
            }
          }, 500);
        } else if (!listeningRef.current) {
          setIsListening(false);
        }
      };

      recognition.onstart = () => {
        setError('');
        setIsListening(true);
        restartAttempts.current = 0;
      };

      return recognition;
    } catch (err) {
      console.error('Failed to create recognition:', err);
      setError('Failed to initialize speech recognition.');
      return null;
    }
  }, [SpeechRecognition]);

  useEffect(() => {
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch(e) {}
    }

    const newRecognition = createRecognition(lang);
    recognitionRef.current = newRecognition;
    listeningRef.current = false;
    setIsListening(false);

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch(e) {}
      }
    };
  }, [lang, createRecognition, SpeechRecognition]);

  const startListening = useCallback(async () => {
    setError('');
    
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported.');
      return;
    }

    if (listeningRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('🎤 Please allow microphone access to use speech recognition.');
      } else if (err.name === 'NotFoundError') {
        setError('🎤 No microphone found on your device.');
      } else {
        setError('🎤 Could not access microphone.');
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
      if (e.message === 'start called multiple times' || e.name === 'InvalidStateError') {
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
          setError('Failed to restart speech recognition.');
        }
      } else {
        setError('Failed to start speech recognition. Please refresh.');
      }
    }
  }, [SpeechRecognition, lang, createRecognition]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      listeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
      restartAttempts.current = 0;
    } catch (e) {
      listeningRef.current = false;
      setIsListening(false);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

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
    supported: isSupported,
  };
};