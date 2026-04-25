// components/AccessibilitySettings.jsx
import React, { useState, useEffect } from 'react';

const AccessibilitySettings = ({ onThemeChange, onFontSizeChange, currentTheme, currentFontSize }) => {
  const [activeTheme, setActiveTheme] = useState(currentTheme || 'default');
  const [fontSize, setFontSize] = useState(currentFontSize || 16);
  const [colorBlindMode, setColorBlindMode] = useState('none');

  const themes = {
    default: {
      name: 'Default',
      icon: '🎨',
      bg: '#0A0C1A',
      text: '#FFFFFF',
      primary: '#00DDB3'
    },
    protanopia: {
      name: 'Protanopia (Red-Blind)',
      icon: '🔴',
      bg: '#1A1A2E',
      text: '#FFFFFF',
      primary: '#4DA8FF'
    },
    deuteranopia: {
      name: 'Deuteranopia (Green-Blind)',
      icon: '🟢',
      bg: '#1E1E2E',
      text: '#FFFFFF',
      primary: '#5B8CFF'
    },
    tritanopia: {
      name: 'Tritanopia (Blue-Blind)',
      icon: '🔵',
      bg: '#2A1A2E',
      text: '#FFE8C8',
      primary: '#FF8866'
    },
    achromatopsia: {
      name: 'Achromatopsia (Grayscale)',
      icon: '⚫',
      bg: '#1A1A1A',
      text: '#E0E0E0',
      primary: '#88B4FF'
    },
    highContrast: {
      name: 'High Contrast',
      icon: '🔆',
      bg: '#000000',
      text: '#FFFFFF',
      primary: '#FFFF00'
    },
    dark: {
      name: 'Dark Mode',
      icon: '🌙',
      bg: '#0A0A0A',
      text: '#E0E0E0',
      primary: '#00FFCC'
    },
    light: {
      name: 'Light Mode',
      icon: '☀️',
      bg: '#F5F5F5',
      text: '#1A1A1A',
      primary: '#0066CC'
    },
    sepia: {
      name: 'Sepia',
      icon: '📜',
      bg: '#F4ECD8',
      text: '#5B4636',
      primary: '#8B6914'
    }
  };

  const handleThemeChange = (themeKey) => {
    setActiveTheme(themeKey);
    const theme = themes[themeKey];
    
    // Apply CSS variables to root
    document.documentElement.style.setProperty('--dynamic-bg', theme.bg);
    document.documentElement.style.setProperty('--dynamic-text', theme.text);
    document.documentElement.style.setProperty('--dynamic-primary', theme.primary);
    
    // Apply color blind filters
    let filter = '';
    switch(colorBlindMode) {
      case 'protanopia':
        filter = 'url(#protanopia)';
        break;
      case 'deuteranopia':
        filter = 'url(#deuteranopia)';
        break;
      case 'tritanopia':
        filter = 'url(#tritanopia)';
        break;
      case 'achromatopsia':
        filter = 'grayscale(100%)';
        break;
      default:
        filter = 'none';
    }
    
    if (colorBlindMode !== 'none' && colorBlindMode !== 'achromatopsia') {
      // SVG filters for color blindness
      if (!document.querySelector('#color-blind-filters')) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('id', 'color-blind-filters');
        svg.style.position = 'absolute';
        svg.style.width = '0';
        svg.style.height = '0';
        svg.innerHTML = `
          <filter id="protanopia">
            <feColorMatrix type="matrix" values="
              0.567, 0.433, 0, 0, 0,
              0.558, 0.442, 0, 0, 0,
              0, 0.242, 0.758, 0, 0,
              0, 0, 0, 1, 0
            "/>
          </filter>
          <filter id="deuteranopia">
            <feColorMatrix type="matrix" values="
              0.625, 0.375, 0, 0, 0,
              0.7, 0.3, 0, 0, 0,
              0, 0.3, 0.7, 0, 0,
              0, 0, 0, 1, 0
            "/>
          </filter>
          <filter id="tritanopia">
            <feColorMatrix type="matrix" values="
              0.95, 0.05, 0, 0, 0,
              0, 0.433, 0.567, 0, 0,
              0, 0.475, 0.525, 0, 0,
              0, 0, 0, 1, 0
            "/>
          </filter>
        `;
        document.body.appendChild(svg);
      }
    }
    
    document.body.style.filter = filter;
    onThemeChange && onThemeChange(themeKey);
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    document.documentElement.style.setProperty('--dynamic-font-size', `${size}px`);
    document.documentElement.style.setProperty('--dynamic-font-size-large', `${size + 4}px`);
    document.documentElement.style.setProperty('--dynamic-font-size-small', `${size - 2}px`);
    onFontSizeChange && onFontSizeChange(size);
    
    // Save to localStorage
    localStorage.setItem('accessibility_fontSize', size);
  };

  const handleColorBlindModeChange = (mode) => {
    setColorBlindMode(mode);
    
    let filter = '';
    switch(mode) {
      case 'protanopia':
        filter = 'url(#protanopia)';
        break;
      case 'deuteranopia':
        filter = 'url(#deuteranopia)';
        break;
      case 'tritanopia':
        filter = 'url(#tritanopia)';
        break;
      case 'achromatopsia':
        filter = 'grayscale(100%)';
        break;
      default:
        filter = 'none';
    }
    
    document.body.style.filter = filter;
    localStorage.setItem('accessibility_colorBlindMode', mode);
  };

  // Load saved settings on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('accessibility_theme');
    const savedFontSize = localStorage.getItem('accessibility_fontSize');
    const savedColorBlindMode = localStorage.getItem('accessibility_colorBlindMode');
    
    if (savedTheme) handleThemeChange(savedTheme);
    if (savedFontSize) handleFontSizeChange(parseInt(savedFontSize));
    if (savedColorBlindMode) handleColorBlindModeChange(savedColorBlindMode);
  }, []);

  return (
    <div className="accessibility-settings">
      <div className="accessibility-header">
        <h2>♿ Accessibility Settings</h2>
        <p>Customize your experience for better visibility</p>
      </div>

      {/* Font Size Control */}
      <div className="accessibility-section">
        <h3>🔤 Font Size</h3>
        <div className="font-size-control">
          <button onClick={() => handleFontSizeChange(Math.max(12, fontSize - 2))} className="size-btn">
            A-
          </button>
          <div className="font-size-preview">
            <span style={{ fontSize: `${fontSize}px` }}>Aa</span>
            <span className="size-value">{fontSize}px</span>
          </div>
          <button onClick={() => handleFontSizeChange(Math.min(32, fontSize + 2))} className="size-btn">
            A+
          </button>
        </div>
        <div className="font-size-presets">
          <button onClick={() => handleFontSizeChange(12)} className="preset">Small</button>
          <button onClick={() => handleFontSizeChange(16)} className="preset active">Normal</button>
          <button onClick={() => handleFontSizeChange(20)} className="preset">Large</button>
          <button onClick={() => handleFontSizeChange(24)} className="preset">X-Large</button>
        </div>
      </div>

      {/* Color Blind Modes */}
      <div className="accessibility-section">
        <h3>🎨 Color Accessibility</h3>
        <div className="color-blind-options">
          <button 
            className={`cb-option ${colorBlindMode === 'none' ? 'active' : ''}`}
            onClick={() => handleColorBlindModeChange('none')}
          >
            <span className="cb-icon">👁️</span>
            <span>Normal Vision</span>
          </button>
          <button 
            className={`cb-option ${colorBlindMode === 'protanopia' ? 'active' : ''}`}
            onClick={() => handleColorBlindModeChange('protanopia')}
          >
            <span className="cb-icon">🔴</span>
            <span>Protanopia (Red-Blind)</span>
          </button>
          <button 
            className={`cb-option ${colorBlindMode === 'deuteranopia' ? 'active' : ''}`}
            onClick={() => handleColorBlindModeChange('deuteranopia')}
          >
            <span className="cb-icon">🟢</span>
            <span>Deuteranopia (Green-Blind)</span>
          </button>
          <button 
            className={`cb-option ${colorBlindMode === 'tritanopia' ? 'active' : ''}`}
            onClick={() => handleColorBlindModeChange('tritanopia')}
          >
            <span className="cb-icon">🔵</span>
            <span>Tritanopia (Blue-Blind)</span>
          </button>
          <button 
            className={`cb-option ${colorBlindMode === 'achromatopsia' ? 'active' : ''}`}
            onClick={() => handleColorBlindModeChange('achromatopsia')}
          >
            <span className="cb-icon">⚫</span>
            <span>Achromatopsia (Grayscale)</span>
          </button>
        </div>
      </div>

      {/* Theme Colors */}
      <div className="accessibility-section">
        <h3>🎨 Color Themes</h3>
        <div className="theme-grid">
          {Object.entries(themes).map(([key, theme]) => (
            <button
              key={key}
              className={`theme-option ${activeTheme === key ? 'active' : ''}`}
              onClick={() => handleThemeChange(key)}
              style={{
                '--theme-bg': theme.bg,
                '--theme-primary': theme.primary
              }}
            >
              <span className="theme-icon">{theme.icon}</span>
              <span className="theme-name">{theme.name}</span>
              <div className="theme-preview">
                <span style={{ background: theme.primary }}></span>
                <span style={{ background: theme.bg }}></span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <div className="accessibility-footer">
        <button 
          className="reset-btn"
          onClick={() => {
            handleFontSizeChange(16);
            handleColorBlindModeChange('none');
            handleThemeChange('default');
          }}
        >
          🔄 Reset All Settings
        </button>
      </div>
    </div>
  );
};

export default AccessibilitySettings;