// src/components/VideoTutorial.jsx
import React, { useState, useRef, useEffect } from 'react';
import './VideoTutorial.css';

// ── Define your video playlist ──
const VIDEO_PLAYLIST = [
  {
    id: 1,
    title: 'Basic Greetings',
    emoji: '👋',
    src: '/videos/tutorial.mp4',
    description: 'Learn how to say Hello, Thank you, and Goodbye'
  },
  {
    id: 2,
    title: 'Emergency Signs',
    emoji: '🆘',
    src: '/videos/tutorial1.mp4',
    description: 'Essential signs for help, police, and hospital'
  },
  {
    id: 3,
    title: 'Family & Friends',
    emoji: '👨‍👩‍👧',
    src: '/videos/tutorial3.mp4',
    description: 'Signs for mother, father, brother, sister'
  },
  {
    id: 4,
    title: 'Food & Drink',
    emoji: '🍽️',
    src: '/videos/tutorial4.mp4',
    description: 'Signs for water, eat, hungry, and more'
  },
  {
    id: 5,
    title: 'Colors & Numbers',
    emoji: '🌈',
    src: '/videos/tutorial5.mp4',
    description: 'Learn colors and numbers 1–10'
  },
];

const VideoTutorial = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);

  // Auto-play when a video is selected
  useEffect(() => {
    if (selectedVideo && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked – user can press play manually
        });
      }
    }
  }, [selectedVideo]);

  const handleSelectVideo = (video) => {
    if (selectedVideo?.id === video.id && isPlaying) {
      // If same video, close it
      handleClose();
      return;
    }
    setSelectedVideo(video);
    setIsPlaying(true);
    setHasError(false);
  };

  const handleClose = () => {
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } catch {}
    }
    setIsPlaying(false);
    setSelectedVideo(null);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsPlaying(false);
  };

  return (
    <div className="video-tutorial-card">
      <div className="video-header">
        <span className="video-icon">📹</span>
        <h4>Sign Language Tutorials</h4>
        <span className="video-badge">{VIDEO_PLAYLIST.length} videos</span>
      </div>

      <div className="video-container">
        {selectedVideo && isPlaying ? (
          // ── Video Player ──
          <div className="video-embed">
            {hasError ? (
              <div className="video-error-fallback">
                <span style={{ fontSize: '3rem' }}>🎬</span>
                <p style={{ color: '#FF6B8A', fontWeight: 600 }}>Video not available</p>
                <small style={{ color: '#8899CC' }}>Check filename: {selectedVideo.src}</small>
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
              <video
                ref={videoRef}
                key={selectedVideo.id}
                src={selectedVideo.src}
                controls
                playsInline
                autoPlay
                onEnded={handleVideoEnd}
                onError={handleError}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  background: '#000',
                }}
              />
            )}
            <button className="close-video" onClick={handleClose}>
              ✕
            </button>
            <div className="video-title-overlay">
              <span>{selectedVideo.emoji} {selectedVideo.title}</span>
            </div>
          </div>
        ) : (
          // ── Playlist Grid ──
          <div className="playlist-grid">
            {VIDEO_PLAYLIST.map((video) => (
              <button
                key={video.id}
                className={`playlist-item ${selectedVideo?.id === video.id ? 'active' : ''}`}
                onClick={() => handleSelectVideo(video)}
              >
                <span className="playlist-emoji">{video.emoji}</span>
                <span className="playlist-title">{video.title}</span>
                <span className="playlist-description">{video.description}</span>
                <span className="playlist-play-icon">▶</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="video-footer">
        <span>💡 Tap any lesson to start learning. Close to return to the list.</span>
      </div>
    </div>
  );
};

export default VideoTutorial;