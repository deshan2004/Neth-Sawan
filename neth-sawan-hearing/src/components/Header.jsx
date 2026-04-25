import React from 'react';

const Header = ({ isListening, lang, setLang, showToast, user, isGuest, roadSafetyActive, setRoadSafetyActive }) => {
    return (
        <header className="app-header">
            <div className="logo-section">
                <h1 className="logo-text">Neth-Sawan</h1>
                <span className="tagline">Hearing Assistant - ශ්‍රවණ සහායක</span>
                <div className="lang-switcher">
                    <button 
                        className={lang === 'si-LK' ? 'active' : ''} 
                        onClick={() => {
                            setLang('si-LK');
                            showToast?.('සිංහල භාෂාවට මාරු විය', 'success');
                        }}
                    >
                        🇱🇰 සිංහල
                    </button>
                    <button 
                        className={lang === 'en-US' ? 'active' : ''} 
                        onClick={() => {
                            setLang('en-US');
                            showToast?.('Switched to English', 'success');
                        }}
                    >
                        🇬🇧 English
                    </button>
                </div>
            </div>
            
            <div className="header-right">
                {/* Road Safety Toggle Button */}
                <button 
                    className={`road-safety-toggle ${roadSafetyActive ? 'active' : ''}`}
                    onClick={() => {
                        setRoadSafetyActive(!roadSafetyActive);
                        showToast?.(roadSafetyActive ? 'Road safety monitoring off' : 'Road safety monitoring on - Listening for vehicles!', 
                            roadSafetyActive ? 'info' : 'success');
                    }}
                    title={roadSafetyActive ? 'Road Safety Active - Click to disable' : 'Enable Road Safety - Detects approaching vehicles'}
                >
                    <span className="toggle-icon">🚗</span>
                    <span className="toggle-text">{roadSafetyActive ? 'Road Safe ON' : 'Road Safe OFF'}</span>
                    <span className={`toggle-dot ${roadSafetyActive ? 'active' : ''}`}></span>
                </button>

                <div className={`status-indicator ${isListening ? 'listening' : ''}`}>
                    <span className="dot"></span>
                    <span className="status-text">
                        {isListening ? "සවන් දෙමින්..." : "නවත්වා ඇත"}
                    </span>
                    {isListening && (
                        <div className="listening-wave">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    )}
                </div>
                
                <div className="user-badge">
                    <span className="user-icon">{isGuest ? '👤' : '👂'}</span>
                    <span className="user-name">{isGuest ? 'Guest User' : (user?.displayName || user?.email?.split('@')[0] || 'User')}</span>
                </div>
            </div>

            <style>{`
                .road-safety-toggle {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 14px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-subtle);
                    border-radius: 30px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .road-safety-toggle.active {
                    background: rgba(0, 221, 179, 0.15);
                    border-color: var(--teal);
                    animation: pulse-glow 1.5s infinite;
                }
                
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(0, 221, 179, 0.4); }
                    50% { box-shadow: 0 0 0 5px rgba(0, 221, 179, 0); }
                }
                
                .toggle-icon {
                    font-size: 16px;
                }
                
                .toggle-text {
                    font-size: 11px;
                    font-weight: 600;
                }
                
                .road-safety-toggle.active .toggle-text {
                    color: var(--teal);
                }
                
                .toggle-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--text-secondary);
                    transition: all 0.2s;
                }
                
                .toggle-dot.active {
                    background: var(--teal);
                    animation: pulse 1s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </header>
    );
};

export default Header;