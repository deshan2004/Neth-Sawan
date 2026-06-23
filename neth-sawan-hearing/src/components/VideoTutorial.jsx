// src/components/VideoTutorial.jsx
import React, { useState, useRef, useEffect } from 'react';
import './VideoTutorial.css';

// ── Video playlist ──
const VIDEO_PLAYLIST = [
  { id: 1, title: 'Getting Started', emoji: '🚀', src: '/videos/tutorial.mp4' },
  { id: 2, title: 'Emergency Signs',   emoji: '🆘', src: '/videos/tutorial1.mp4' },
  { id: 3, title: 'Family & Friends',  emoji: '👨‍👩‍👧', src: '/videos/tutorial3.mp4' },
  { id: 4, title: 'Food & Drink',      emoji: '🍽️', src: '/videos/tutorial4.mp4' },
  { id: 5, title: 'Colors & Numbers',  emoji: '🌈', src: '/videos/tutorial5.mp4' },
];

const VideoTutorial = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // 🔇 Mute by default
  const videoRef = useRef(null);

  const currentVideo = VIDEO_PLAYLIST[currentIndex];
  const totalVideos = VIDEO_PLAYLIST.length;

  // Auto‑play when video source changes
  useEffect(() => {
    if (videoRef.current) {
      // Set muted state on the video element
      videoRef.current.muted = isMuted;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked – user can press play manually
        });
      }
    }
  }, [currentIndex, isMuted]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleEnded = () => {
    if (currentIndex < totalVideos - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handleError = () => {
    setHasError(true);
    setIsPlaying(false);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setHasError(false);
    }
  };

  const goToNext = () => {
    if (currentIndex < totalVideos - 1) {
      setCurrentIndex(currentIndex + 1);
      setHasError(false);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen?.();
      }
    }
  };

  // ── Toggle Mute ──
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="video-tutorial-card">
      {/* Header with playlist info */}
      <div className="video-header">
        <span className="video-icon">📹</span>
        <h4>Video Tutorial</h4>
        <span className="video-badge">
          {currentIndex + 1} / {totalVideos}
        </span>
        {/* 🔇 Mute indicator */}
        <span 
          className="mute-indicator"
          style={{
            fontSize: '0.7rem',
            padding: '2px 10px',
            borderRadius: '40px',
            background: isMuted ? 'rgba(255,200,0,0.15)' : 'rgba(0,221,179,0.15)',
            color: isMuted ? '#F5C842' : '#00DDB3',
            border: isMuted ? '1px solid #F5C842' : '1px solid #00DDB3',
            marginLeft: '8px'
          }}
        >
          {isMuted ? '🔇 Muted' : '🔊 Sound On'}
        </span>
      </div>

      <div className="video-container">
        <div className="video-embed">
          {hasError ? (
            <div className="video-error-fallback">
              <span style={{ fontSize: '3rem' }}>🎬</span>
              <p style={{ color: '#FF6B8A', fontWeight: 600 }}>
                Video not available
              </p>
              <small style={{ color: '#8899CC' }}>
                {currentVideo?.src}
              </small>
              <button
                onClick={() => setHasError(false)}
                style={{
                  marginTop: '12px',
                  padding: '8px 20px',
                  borderRadius: '40px',
                  background: '#00DDB3',
                  color: '#000',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                key={currentVideo?.id}
                src={currentVideo?.src}
                controls
                playsInline
                autoPlay
                muted={isMuted} // 🔥 Mute by default
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
                onError={handleError}
                className="video-player"
              />
              <button
                className="fullscreen-btn"
                onClick={toggleFullscreen}
                aria-label="Fullscreen"
              >
                ⛶
              </button>
              {/* Custom Mute Toggle Button */}
              <button
                className="mute-toggle-btn"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                style={{
                  position: 'absolute',
                  bottom: '70px',
                  right: '16px',
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  zIndex: 10,
                  fontSize: '1.2rem',
                  transition: 'all 0.2s',
                  minWidth: '40px',
                  minHeight: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,221,179,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Controls: Previous / Next / Progress */}
      <div className="video-controls">
        <button
          className="control-btn prev"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
        >
          ⏮ Prev
        </button>
        <span className="video-progress">
          <span className="video-title">{currentVideo?.emoji} {currentVideo?.title}</span>
          <span className="video-counter">{currentIndex + 1} of {totalVideos}</span>
        </span>
        <button
          className="control-btn next"
          onClick={goToNext}
          disabled={currentIndex === totalVideos - 1}
        >
          Next ⏭
        </button>
      </div>

      <div className="video-footer">
        <span>💡 Videos play automatically. Sound is muted by default. Click 🔊 to unmute.</span>
      </div>
    </div>
  );
};

export default VideoTutorial;