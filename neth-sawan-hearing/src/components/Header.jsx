import React from 'react';

const Header = ({ isListening, lang, setLang, showToast, user, isGuest, roadSafetyActive, setRoadSafetyActive, emergencyNotificationsEnabled, onToggleEmergencyNotifications }) => {
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
                {/* NEW: Emergency Notifications Toggle Button */}
                <button 
                    className={`emergency-toggle ${emergencyNotificationsEnabled ? 'enabled' : 'disabled'}`}
                    onClick={onToggleEmergencyNotifications}
                    title={emergencyNotificationsEnabled ? 'Emergency notifications ON - Click to disable' : 'Emergency notifications OFF - Click to enable'}
                >
                    <span className="toggle-icon">
                        {emergencyNotificationsEnabled ? '🔔' : '🔕'}
                    </span>
                    <span className="toggle-text">
                        {emergencyNotificationsEnabled ? 'Alerts ON' : 'Alerts OFF'}
                    </span>
                    <span className={`toggle-status ${emergencyNotificationsEnabled ? 'active' : ''}`}></span>
                </button>

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
                /* Emergency Toggle Button */
                .emergency-toggle {
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
                
                .emergency-toggle.enabled {
                    background: rgba(0, 221, 179, 0.15);
                    border-color: var(--teal);
                }
                
                .emergency-toggle.disabled {
                    background: rgba(255, 51, 85, 0.1);
                    border-color: var(--red);
                }
                
                .emergency-toggle:hover {
                    transform: translateY(-1px);
                }
                
                .toggle-icon {
                    font-size: 16px;
                }
                
                .toggle-text {
                    font-size: 11px;
                    font-weight: 600;
                }
                
                .emergency-toggle.enabled .toggle-text {
                    color: var(--teal);
                }
                
                .emergency-toggle.disabled .toggle-text {
                    color: var(--red);
                }
                
                .toggle-status {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--text-secondary);
                    transition: all 0.2s;
                }
                
                .toggle-status.active {
                    background: var(--teal);
                    animation: pulse 1s infinite;
                }
                
                .emergency-toggle.disabled .toggle-status {
                    background: var(--red);
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(0.8); }
                }
                
                /* Road Safety Toggle */
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
            `}</style>
        </header>
    );
};

export default Header;