// src/components/LandingPage.jsx
import React, { useState } from 'react';
import Auth from './Auth';
import { useLanguage } from '../context/LanguageContext';

const LandingPage = ({ onGuestMode }) => {
  const { t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // Public folder එකේ තියෙන background video එකේ නිවැරදි path එක
  const videoSrc = "/videos/background.mp4";

  return (
    <div className="landing-page">
      {/* ─── Hero Section with Background Video ─────────────────── */}
      <div className="landing-hero">
        
        {/* Layer 1: Background Video (Z-Index: 1) */}
        <video
          className="landing-bg-video"
          autoPlay
          loop
          muted
          playsInline
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%230A0C1A'/%3E%3C/svg%3E"
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Layer 2: Transparent Dark Overlay (Z-Index: 2) */}
        <div className="landing-overlay"></div>

        {/* Layer 3: Foreground Content (Z-Index: 3) */}
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

      {/* ─── Features Section ─────────────────── */}
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

      {/* ─── Auth Modal ─────────────────── */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuthModal(false)}>✕</button>
            <Auth initialMode={authMode} onGuestMode={onGuestMode} onSuccess={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}

      {/* ─── Updated CSS Styles with Video Controls ─────────────────── */}
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
          background-color: #0A0C1A;
        }

        /* Video එක මුළු Screen එක පුරාම Background එකක් ලෙස තැබීම */
        .landing-bg-video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1; /* හැමදේටම යටින් */
        }

        /* Video එක උඩින් වැටෙන Transparent Dark Overlay එක */
        .landing-overlay {
          position: absolute;
          inset: 0;
          /* වීඩියෝ එක උඩින් අකුරු පැහැදිලිව පෙනෙන්න 40% ක කළු පැහැයක් සහ Gradient එකක් මිශ්‍ර කර ඇත */
          background: linear-gradient(to bottom, rgba(10, 12, 26, 0.4), #0A0C1A),
                      radial-gradient(circle at 50% 30%, rgba(0, 221, 179, 0.15), transparent 70%);
          z-index: 2; /* වීඩියෝ එකට උඩින් */
          pointer-events: none; /* Buttons Click කිරීමට බාධාවක් නොවන ලෙස */
        }

        /* ප්‍රධාන Content සහ Text Layer එක */
        .landing-content {
          position: relative;
          z-index: 3; /* Overlay එකටත් උඩින් */
          padding: 20px;
          max-width: 800px;
          animation: fadeIn 1s ease-out;
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
          transition: all 0.2s;
          border: none;
        }
        .btn-primary {
          background: linear-gradient(135deg, #00DDB3, #00B899);
          color: #000;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,221,179,0.3); }
        .btn-secondary {
          background: rgba(10, 12, 26, 0.6);
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
          background: #0A0C1A;
          border: 1px solid #00DDB3;
          border-radius: 32px;
          max-width: 450px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          padding: 24px;
        }
        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          color: #8899CC;
          font-size: 24px;
          cursor: pointer;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
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