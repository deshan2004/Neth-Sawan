// src/components/InstructionsPage.jsx
import React from 'react';
import './InstructionsPage.css';

const InstructionsPage = ({ onClose }) => {
  const sections = [
    {
      id: 'intro',
      icon: '👂',
      title: 'What is Neth-Sawan?',
      description:
        'Neth-Sawan (Sinhala for "Eye Ear") is a visual hearing assistant designed for deaf and hard‑of‑hearing users. It converts sounds, speech, and environmental cues into visual, haptic, and sign‑language feedback — all in real time.',
      image: 'https://picsum.photos/seed/intro/600/400',
    },
    {
      id: 'start',
      icon: '🚀',
      title: 'Getting Started',
      description:
        'You can use Neth-Sawan as a guest or sign in with Google / email. Guest mode stores your settings locally, while signing in saves your preferences across devices. After logging in, you’ll see the main dashboard.',
      image: 'https://picsum.photos/seed/start/600/400',
    },
    {
      id: 'captions',
      icon: '🎤',
      title: 'Live Captions',
      description:
        'Tap "Start Listening" to activate your microphone. Speech is transcribed in real time. You can adjust font size, copy the text, and even view a Braille translation of the last 200 characters. Switch between English, Sinhala, and Telugu.',
      image: 'https://picsum.photos/seed/captions/600/400',
    },
    {
      id: 'signs',
      icon: '🤟',
      title: 'Sign Language Translation',
      description:
        'As you speak, the app automatically recognises key words (like "help", "water", "thank you") and displays the corresponding American Sign Language (ASL) or Sinhala Sign Language (SLS) gesture with a description. A quick‑reference gallery helps you learn common signs.',
      image: 'https://picsum.photos/seed/signs/600/400',
    },
    {
      id: 'sounds',
      icon: '🔊',
      title: 'Sound Monitor & Road Safety',
      description:
        'The app listens for loud sounds and classifies them (alarm, vehicle, phone, etc.). It also includes a dedicated Road Safety Monitor that detects horns, sirens, and approaching vehicles — showing direction and distance with visual flashes and haptic vibrations. Perfect for pedestrians.',
      image: 'https://picsum.photos/seed/sounds/600/400',
    },
    {
      id: 'emergency',
      icon: '🆘',
      title: 'Emergency SOS & Fall Detection',
      description:
        'Press the SOS button or activate fall detection (automatic when a fall is sensed). The app will flash a red alert, vibrate, and notify your emergency contacts via WhatsApp, SMS, or phone call — with your live location included. You can manage your contacts in the "Contacts" tab.',
      image: 'https://picsum.photos/seed/emergency/600/400',
    },
    {
      id: 'community',
      icon: '👥',
      title: 'Community – Chat & Video Calls',
      description:
        'See who’s online and start a text chat or a video call (Peer‑to‑Peer) with other users. Video calls are mirrored for natural sign‑language interaction. Perfect for practising or getting help from the community.',
      image: 'https://picsum.photos/seed/community/600/400',
    },
    {
      id: 'settings',
      icon: '♿',
      title: 'Accessibility Settings',
      description:
        'Customise your experience: adjust font size (12–32px), choose from 8 colour themes (including high contrast and dark mode), and enable colour‑blind filters (Protanopia, Deuteranopia, etc.). All preferences are saved automatically.',
      image: 'https://picsum.photos/seed/settings/600/400',
    },
    {
      id: 'tips',
      icon: '💡',
      title: 'Tips for Best Experience',
      description:
        '• Speak clearly and at a normal pace.\n• Reduce background noise for better captions.\n• Hold your phone closer to your mouth on mobile.\n• Enable desktop notifications to never miss an alert.\n• Explore the Sign Language Tutor to learn new signs!',
      image: 'https://picsum.photos/seed/tips/600/400',
    },
  ];

  return (
    <div className="instructions-page">
      <div className="instructions-hero">
        <div className="instructions-hero-content">
          <h1>📖 How to Use Neth-Sawan</h1>
          <p>Your complete guide to the visual hearing assistant</p>
          <button className="back-btn-hero" onClick={onClose}>
            ← Back to App
          </button>
        </div>
      </div>

      <div className="instructions-container">
        {sections.map((section) => (
          <div key={section.id} className="instruction-section">
            <div className="section-image">
              <img src={section.image} alt={section.title} loading="lazy" />
            </div>
            <div className="section-content">
              <div className="section-header">
                <span className="section-icon">{section.icon}</span>
                <h2>{section.title}</h2>
              </div>
              <p className="section-description">{section.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="instructions-footer">
        <button className="back-btn-bottom" onClick={onClose}>
          ← Return to App
        </button>
        <p>Made with ❤️ for the deaf and hard‑of‑hearing community</p>
      </div>
    </div>
  );
};

export default InstructionsPage;