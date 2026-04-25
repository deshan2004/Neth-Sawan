import React from 'react';

const Header = ({ isListening, lang, setLang, showToast, user, isGuest, onLogout }) => {
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
                    <span className="user-name">{isGuest ? 'Guest' : (user?.displayName || user?.email?.split('@')[0] || 'User')}</span>
                </div>
            </div>
        </header>
    );
};

export default Header;