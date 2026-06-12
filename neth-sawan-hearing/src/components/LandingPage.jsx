import React, { useState } from 'react';
import Auth from './Auth';
import BackgroundVideo from './BackgroundVideo';
import { useLanguage } from '../context/LanguageContext';
import './LandingPage.css';

const LandingPage = ({ onGuestMode }) => {
  const { t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const videoSrc = "/videos/background.mp4";

  return (
    <div className="landing-page">
      {/* Opacity 1.0 kelya mule video purn transparent ani clear disel */}
      <BackgroundVideo videoSrc={videoSrc} opacity={1.0} />
      
      <div className="landing-hero">
        <div className="landing-content">
          <div className="landing-logo"><span>👂</span><span>🤟</span></div>
          <h1>{t('appName')}</h1>
          <p className="tagline">{t('tagline')}</p>
          <p className="description">🦻 Live captions • 🤟 Sign language translation • 🚗 Road safety alerts • 🆘 Emergency SOS</p>
          <div className="landing-buttons">
            <button className="btn-primary" onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>Sign In</button>
            <button className="btn-secondary" onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}>Create Account</button>
            <button className="btn-guest" onClick={onGuestMode}>Continue as Guest</button>
          </div>
        </div>
      </div>

      <div className="landing-features">
        <div className="feature-card"><span className="feature-icon">🎤</span><h3>Live Captions</h3><p>Real‑time speech‑to‑text for any conversation or video.</p></div>
        <div className="feature-card"><span className="feature-icon">🤟</span><h3>Sign Language</h3><p>Automatic translation of spoken words into ASL / Sinhala signs.</p></div>
        <div className="feature-card"><span className="feature-icon">🚗</span><h3>Road Safety</h3><p>Detects horns, sirens, and approaching vehicles – visual alerts.</p></div>
        <div className="feature-card"><span className="feature-icon">🆘</span><h3>Emergency SOS</h3><p>One‑tap alert with live location to your emergency contacts.</p></div>
      </div>

      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <Auth initialMode={authMode} onGuestMode={onGuestMode} onSuccess={() => setShowAuthModal(false)} onClose={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;