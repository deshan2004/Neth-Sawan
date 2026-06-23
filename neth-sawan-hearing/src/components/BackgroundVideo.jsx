// src/components/BackgroundVideo.jsx
import React from 'react';
import './BackgroundVideo.css';

const BackgroundVideo = ({ videoSrc, opacity = 0.4 }) => {
  const defaultVideo = "";

  return (
    <div className="background-video-container">
      <video
        className="background-video"
        autoPlay
        loop
        muted
        playsInline
        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%230A0C1A'/%3E%3C/svg%3E"
      >
        <source src={videoSrc || defaultVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="background-overlay" style={{ opacity }}></div>
    </div>
  );
};

export default BackgroundVideo;