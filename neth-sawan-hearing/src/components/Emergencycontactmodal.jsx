import React, { useState, useEffect } from 'react';
import './EmergencyContactModal.css';

const EmergencyContactModal = ({
  emergencyData,
  relatives,
  onWhatsApp,
  onSMS,
  onCall,
  onClose,
  autoSendStatus = {},
}) => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [sending, setSending] = useState(false);
  const [autoSentList, setAutoSentList] = useState([]);

  useEffect(() => {
    const autoSent = relatives.filter(r => r.autoSendWhatsApp && r.notifyByWhatsApp).map(r => r.id);
    setAutoSentList(autoSent);
  }, [relatives]);

  if (!emergencyData || relatives.length === 0) return null;

  const time = new Date(emergencyData.timestamp || new Date()).toLocaleTimeString();
  const date = new Date(emergencyData.timestamp || new Date()).toLocaleDateString();

  const handleSend = async (rel, type, action) => {
    setSelectedContact(rel.id);
    setSending(true);
    await action(rel, { ...emergencyData, location: emergencyData.location });
    setTimeout(() => { setSending(false); setSelectedContact(null); }, 1000);
  };

  return (
    <div className="emergency-modal-overlay" onClick={onClose}>
      <div className="emergency-modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="siren-icon-large">🚨</div>
          <h2>EMERGENCY ALERT</h2>
          <button className="close-modal" onClick={onClose}>✕</button>
        </div>

        <div className="emergency-info">
          <div className="info-row"><span className="info-label">Detected:</span><strong>{emergencyData.soundType || 'Emergency'}</strong></div>
          <div className="info-row"><span className="info-label">Time:</span><span>{date} · {time}</span></div>
          {emergencyData.location && (
            <div className="info-row">
              <span className="info-label">Location:</span>
              <a href={`https://www.google.com/maps?q=${emergencyData.location.lat},${emergencyData.location.lng}`} target="_blank" rel="noopener noreferrer">View on map →</a>
            </div>
          )}
        </div>

        {autoSentList.length > 0 && (
          <div className="auto-sent-banner">
            🤖 Auto-sent to {autoSentList.length} contact(s) via WhatsApp
          </div>
        )}

        <div className="contacts-list">
          <h3>Emergency Contacts</h3>
          {relatives.filter(r => r.phone).map(rel => (
            <div key={rel.id} className="contact-item">
              <div className="contact-avatar">{rel.name.charAt(0).toUpperCase()}</div>
              <div className="contact-info">
                <div className="contact-name">{rel.name}{rel.autoSendWhatsApp && <span className="auto-badge">Auto</span>}</div>
                <div className="contact-phone">{rel.phone}</div>
              </div>
              <div className="contact-actions">
                {rel.notifyByWhatsApp && (
                  <button className="action-btn whatsapp" onClick={() => handleSend(rel, 'whatsapp', onWhatsApp)} disabled={sending && selectedContact === rel.id}>
                    {sending && selectedContact === rel.id ? <div className="spinner-small"></div> : '💬'}
                  </button>
                )}
                {rel.notifyBySMS && (
                  <button className="action-btn sms" onClick={() => handleSend(rel, 'sms', onSMS)} disabled={sending && selectedContact === rel.id}>✉️</button>
                )}
                <button className="action-btn call" onClick={() => handleSend(rel, 'call', onCall)} disabled={sending && selectedContact === rel.id}>📞</button>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="dismiss-btn" onClick={onClose}>Dismiss</button>
          <button className="share-btn" onClick={() => {
            const text = `🚨 EMERGENCY ALERT\nDetected: ${emergencyData.soundType}\nTime: ${time}\nLocation: ${emergencyData.location ? `https://maps.google.com/?q=${emergencyData.location.lat},${emergencyData.location.lng}` : 'Not available'}`;
            if (navigator.share) navigator.share({ title: 'Emergency Alert', text });
            else navigator.clipboard.writeText(text);
          }}>Share Alert</button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContactModal;