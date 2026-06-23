// src/admin/settings/SystemSettings.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import '../admin.css';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    soundThreshold: 0.15,
    roadSafetySensitivity: 0.25,
    emergencyFlashDuration: 8,
    fallDetectionEnabled: true,
    roadSafetyEnabled: true,
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'system', 'settings'));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data());
        }
      } catch (err) {
        console.error('Settings load error:', err);
      }
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'system', 'settings'), settings);
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save settings');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="admin-loading-cell">Loading settings...</div>;
  }

  return (
    <div className="admin-settings">
      <div className="admin-page-header">
        <h2>⚙️ System Settings</h2>
      </div>

      <div className="admin-settings-form">
        {/* Sound Detection */}
        <div className="admin-settings-group">
          <h3>🔊 Sound Detection</h3>
          <div className="admin-setting-item">
            <label>Sound Threshold</label>
            <div className="admin-setting-control">
              <input
                type="range"
                min="0.05"
                max="0.3"
                step="0.01"
                value={settings.soundThreshold}
                onChange={(e) => setSettings({ ...settings, soundThreshold: parseFloat(e.target.value) })}
              />
              <span className="admin-setting-value">{Math.round(settings.soundThreshold * 100)}%</span>
            </div>
            <p className="admin-setting-hint">Lower = more sensitive, Higher = less sensitive</p>
          </div>
        </div>

        {/* Road Safety */}
        <div className="admin-settings-group">
          <h3>🛣️ Road Safety</h3>
          <div className="admin-setting-item">
            <label>Sensitivity</label>
            <div className="admin-setting-control">
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.01"
                value={settings.roadSafetySensitivity}
                onChange={(e) => setSettings({ ...settings, roadSafetySensitivity: parseFloat(e.target.value) })}
              />
              <span className="admin-setting-value">{Math.round(settings.roadSafetySensitivity * 100)}%</span>
            </div>
            <p className="admin-setting-hint">Lower = more sensitive to vehicle sounds</p>
          </div>
        </div>

        {/* Emergency */}
        <div className="admin-settings-group">
          <h3>🆘 Emergency Settings</h3>
          <div className="admin-setting-item">
            <label>Emergency Flash Duration (seconds)</label>
            <div className="admin-setting-control">
              <input
                type="number"
                min="3"
                max="15"
                value={settings.emergencyFlashDuration}
                onChange={(e) => setSettings({ ...settings, emergencyFlashDuration: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="admin-settings-group">
          <h3>🔘 Feature Toggles</h3>
          <div className="admin-setting-item toggle">
            <label>Fall Detection</label>
            <button 
              className={`admin-toggle-btn ${settings.fallDetectionEnabled ? 'on' : 'off'}`}
              onClick={() => setSettings({ ...settings, fallDetectionEnabled: !settings.fallDetectionEnabled })}
            >
              {settings.fallDetectionEnabled ? '✅ Enabled' : '❌ Disabled'}
            </button>
          </div>
          <div className="admin-setting-item toggle">
            <label>Road Safety Monitor</label>
            <button 
              className={`admin-toggle-btn ${settings.roadSafetyEnabled ? 'on' : 'off'}`}
              onClick={() => setSettings({ ...settings, roadSafetyEnabled: !settings.roadSafetyEnabled })}
            >
              {settings.roadSafetyEnabled ? '✅ Enabled' : '❌ Disabled'}
            </button>
          </div>
          <div className="admin-setting-item toggle">
            <label>Maintenance Mode</label>
            <button 
              className={`admin-toggle-btn ${settings.maintenanceMode ? 'on' : 'off'}`}
              onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
            >
              {settings.maintenanceMode ? '🔧 Maintenance' : '🟢 Live'}
            </button>
          </div>
        </div>

        <button className="admin-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? '💾 Saving...' : '💾 Save All Settings'}
        </button>
      </div>
    </div>
  );
};

export default SystemSettings;