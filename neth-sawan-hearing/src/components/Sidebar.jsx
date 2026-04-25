import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, onClose, isOpen, user, isGuest, onLogout }) => {
    const menuItems = [
        { id: 'dashboard', icon: '🏠', label: 'Home', sinhala: 'මුල් පිටුව', description: 'Main dashboard' },
        { id: 'vision', icon: '👁️', label: 'AI Vision', sinhala: 'AI දෘෂ්ටිය', description: 'Image to Sign Language' },
        { id: 'learn', icon: '🤟', label: 'Learn Signs', sinhala: 'සංඥා ඉගෙන ගන්න', description: 'Sign language tutor' },
        { id: 'alerts', icon: '🔔', label: 'Alerts', sinhala: 'ඇඟවීම්', description: 'Notification history' },
        { id: 'contacts', icon: '📇', label: 'Contacts', sinhala: 'සම්බන්ධතා', description: 'Emergency contacts' },
        { id: 'emergency', icon: '🆘', label: 'SOS', sinhala: 'හදිසි අවස්ථා', description: 'Emergency center' },
        { id: 'settings', icon: '♿', label: 'Accessibility', sinhala: 'ප්‍රවේශ්‍යතාව', description: 'Font & color settings' }
    ];

    return (
        <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div className="logo-mini">
                    <span>👂</span>
                    <span>Neth-Sawan</span>
                </div>
                <button className="close-sidebar" onClick={onClose}>✕</button>
            </div>
            
            <div className="profile-section">
                <div className="avatar">
                    <span className="avatar-ear">👂</span>
                    <span className="avatar-wave">🤟</span>
                </div>
                <h3>{isGuest ? 'Guest User' : (user?.displayName || user?.email?.split('@')[0] || 'User')}</h3>
                <p>{isGuest ? 'Guest Mode' : (user?.email || 'Logged In')}</p>
                {isGuest && <span className="guest-badge">Local Data Only</span>}
                <div className="accessibility-badge">
                    <span>♿ Accessibility Ready</span>
                </div>
            </div>

            <nav className="nav-links">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab(item.id);
                            if (window.innerWidth <= 1024) onClose();
                        }}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.sinhala}</span>
                        <span className="nav-label-en">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="accessibility-info">
                    <p>🎯 Designed for Deaf & Hard of Hearing</p>
                    <p>• 🚗 Road Safety Monitor</p>
                    <p>• 🤟 Sign Language Translation</p>
                    <p>• 🔴 Visual Emergency Alerts</p>
                    <p>• 📳 Haptic Feedback</p>
                </div>
                <button className="logout-btn-sidebar" onClick={onLogout}>
                    🚪 Sign Out
                </button>
                <div className="version">Neth-Sawan v3.0 - Deaf Accessibility Edition</div>
            </div>
        </aside>
    );
};

export default Sidebar;