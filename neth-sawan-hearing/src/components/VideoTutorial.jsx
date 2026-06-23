// src/components/VideoTutorial.jsx
import React, { useState, useRef, useEffect } from 'react';
import './VideoTutorial.css';

// ── Video playlist (order matters) ──
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
  const videoRef = useRef(null);

  const currentVideo = VIDEO_PLAYLIST[currentIndex];
  const totalVideos = VIDEO_PLAYLIST.length;

  // Auto‑play when video source changes
  useEffect(() => {
    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked – user can press play manually
        });
      }
    }
  }, [currentIndex]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleEnded = () => {
    // Move to next video automatically
    if (currentIndex < totalVideos - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Loop back to start (optional)
      // setCurrentIndex(0);
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

  return (
    <div className="video-tutorial-card">
      {/* Header with playlist info */}
      <div className="video-header">
        <span className="video-icon">📹</span>
        <h4>Video Tutorial</h4>
        <span className="video-badge">
          {currentIndex + 1} / {totalVideos}
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
        <span>💡 Videos play automatically. Use buttons to skip.</span>
      </div>
    </div>
  );
};

export default VideoTutorial;