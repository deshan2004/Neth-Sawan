// src/components/LandingPage.jsx
import React, { useState } from 'react';
import Auth from './Auth';
import { useLanguage } from '../context/LanguageContext';
import './LandingPage.css';

const LandingPage = ({ onGuestMode }) => {
  const { t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // Local video path (place your video in public/videos/background.mp4)
  const videoSrc = "/videos/background.mp4";

  return (
    <div className="landing-page">
      {/* Hero Section with background video */}
      <div className="landing-hero">
        <video className="landing-bg-video" autoPlay loop muted playsInline>
          <source src={videoSrc} type="video/mp4" />
        </video>
        <div className="landing-overlay"></div>
        <div className="landing-content">
          <div className="landing-logo">
            <span>👂</span>
            <span>🤟</span>
          </div>
          <h1>{t('appName')}</h1>
          <p className="tagline">{t('tagline')}</p>
          <p className="description">
            🦻 Live captions • 🤟 Sign language translation • 🚗 Road safety alerts • 🆘 Emergency SOS
          </p>
          <div className="landing-buttons">
            <button className="btn-primary" onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>
              Sign In
            </button>
            <button className="btn-secondary" onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}>
              Create Account
            </button>
            <button className="btn-guest" onClick={onGuestMode}>
              Continue as Guest
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="landing-features">
        <div className="feature-card">
          <span className="feature-icon">🎤</span>
          <h3>Live Captions</h3>
          <p>Real‑time speech‑to‑text for any conversation or video.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🤟</span>
          <h3>Sign Language</h3>
          <p>Automatic translation of spoken words into ASL / Sinhala signs.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🚗</span>
          <h3>Road Safety</h3>
          <p>Detects horns, sirens, and approaching vehicles – visual alerts.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🆘</span>
          <h3>Emergency SOS</h3>
          <p>One‑tap alert with live location to your emergency contacts.</p>
        </div>
      </div>

      {/* Auth Modal – now passes onClose */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <Auth
              initialMode={authMode}
              onGuestMode={onGuestMode}
              onSuccess={() => setShowAuthModal(false)}
              onClose={() => setShowAuthModal(false)}   // 👈 close button inside Auth
            />
          </div>
        </div>
      )}

      <style>{`
        .landing-page {
          min-height: 100vh;
          background: #0A0C1A;
          font-family: 'Inter', sans-serif;
        }
        .landing-hero {
          position: relative;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          overflow: hidden;
        }
        .landing-bg-video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }
        .landing-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(10,12,26,0.4), #0A0C1A), radial-gradient(circle at 50% 30%, rgba(0,221,179,0.15), transparent 70%);
          z-index: 2;
          pointer-events: none;
        }
        .landing-content {
          position: relative;
          z-index: 3;
          padding: 20px;
          max-width: 800px;
          background: rgba(10,12,26,0.6);
          backdrop-filter: blur(12px);
          border-radius: 48px;
          border: 1px solid rgba(0,221,179,0.2);
          margin: 0 20px;
        }
        .landing-logo {
          font-size: 64px;
          margin-bottom: 20px;
        }
        .landing-content h1 {
          font-size: 48px;
          background: linear-gradient(135deg, #00DDB3, #F5C842);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 12px;
          font-weight: 800;
        }
        .tagline {
          font-size: 20px;
          color: #D0D8FF;
          margin-bottom: 16px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        .description {
          font-size: 16px;
          color: #A0A8D0;
          margin-bottom: 32px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        .landing-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn-primary, .btn-secondary, .btn-guest {
          padding: 14px 28px;
          border-radius: 60px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: 0.2s;
          border: none;
        }
        .btn-primary {
          background: linear-gradient(135deg, #00DDB3, #00B899);
          color: #000;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,221,179,0.3); }
        .btn-secondary {
          background: rgba(10,12,26,0.6);
          backdrop-filter: blur(5px);
          border: 1px solid rgba(0,221,179,0.5);
          color: #00DDB3;
        }
        .btn-secondary:hover { background: rgba(0,221,179,0.2); transform: translateY(-2px); }
        .btn-guest {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(5px);
          border: 1px solid #2A2F55;
          color: #D0D8FF;
        }
        .btn-guest:hover { border-color: #F5C842; color: #F5C842; transform: translateY(-2px); }
        .landing-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          padding: 60px 24px;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 4;
        }
        .feature-card {
          background: rgba(26,30,58,0.6);
          backdrop-filter: blur(10px);
          border: 1px solid #2A2F55;
          border-radius: 28px;
          padding: 32px 24px;
          text-align: center;
          transition: 0.2s;
        }
        .feature-card:hover { transform: translateY(-4px); border-color: #00DDB3; }
        .feature-icon { font-size: 48px; display: block; margin-bottom: 16px; }
        .feature-card h3 { font-size: 22px; margin-bottom: 12px; color: #00DDB3; }
        .feature-card p { color: #A0A8D0; line-height: 1.5; }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-container {
          position: relative;
          background: transparent;
          max-width: 450px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }
        @media (max-width: 768px) {
          .landing-content { padding: 24px; }
          .landing-content h1 { font-size: 36px; }
          .tagline { font-size: 16px; }
          .landing-buttons { flex-direction: column; width: 100%; }
          .landing-buttons button { width: 100%; }
          .feature-card { padding: 24px 16px; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;