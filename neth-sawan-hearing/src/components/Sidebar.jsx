import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, onClose, isOpen }) => {
    const menuItems = [
        { id: 'dashboard', icon: '🏠', label: 'Dashboard', sinhala: 'මුල් පිටුව' },
        { id: 'vision', icon: '👁️', label: 'AI Vision', sinhala: 'AI දෘෂ්ටිය' },
        { id: 'history', icon: '📋', label: 'History', sinhala: 'ඉතිහාසය' },
        { id: 'emergency', icon: '🆘', label: 'Emergency', sinhala: 'හදිසි අවස්ථා' },
        { id: 'contacts', icon: '📇', label: 'Contacts', sinhala: 'සම්බන්ධතා' },
        { id: 'settings', icon: '⚙️', label: 'Settings', sinhala: 'සැකසුම්' }
    ];

    return (
        <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <button className="close-sidebar" onClick={onClose}>✖</button>
            </div>
            
            <div className="profile-section">
                <div className="avatar">
                    <span className="avatar-ear">👂</span>
                    <span className="avatar-wave">🔊</span>
                </div>
                <h3>Neth-Sawan</h3>
                <p>ශ්‍රවණ සහායක</p>
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
                <div className="version">v2.0.0</div>
                <div className="build">Emergency Notification System</div>
            </div>
        </aside>
    );
};

export default Sidebar;