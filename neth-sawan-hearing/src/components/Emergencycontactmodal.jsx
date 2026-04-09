import React, { useState, useEffect } from 'react';

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
    const autoSent = relatives
      .filter(r => r.autoSendWhatsApp && r.notifyByWhatsApp)
      .map(r => r.id);
    setAutoSentList(autoSent);
  }, [relatives]);

  if (!emergencyData || relatives.length === 0) return null;

  const time = new Date(emergencyData.timestamp || new Date()).toLocaleTimeString('en-LK', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const date = new Date(emergencyData.timestamp || new Date()).toLocaleDateString('en-LK', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const contactsWithPhone = relatives.filter(r => r.phone);

  const handleSend = async (rel, type, action) => {
    setSelectedContact(rel.id);
    setSending(true);
    await action(rel, { ...emergencyData, location: emergencyData.location });
    setTimeout(() => {
      setSending(false);
      setSelectedContact(null);
    }, 1000);
  };

  const getEmergencyColor = () => {
    if (emergencyData.soundType?.includes('Alarm')) return '#FF3355';
    if (emergencyData.soundType?.includes('Vehicle')) return '#FF8833';
    return '#FF3355';
  };

  return (
    <div className="emergency-modal-overlay" onClick={onClose}>
      <div className="emergency-modal-container" onClick={e => e.stopPropagation()}>
        <div className="emergency-modal-header">
          <div className="emergency-siren-animation">
            <div className="siren-light"></div>
            <div className="siren-light"></div>
            <div className="siren-light"></div>
            <div className="siren-light"></div>
          </div>
          <div className="emergency-icon-large">🚨</div>
          <h2>EMERGENCY ALERT</h2>
          <p className="emergency-subtitle">Immediate assistance required</p>
        </div>

        <div className="emergency-details-card">
          <div className="detail-row">
            <div className="detail-icon">⚠️</div>
            <div className="detail-content">
              <span className="detail-label">Detected</span>
              <strong className="detail-value" style={{ color: getEmergencyColor() }}>
                {emergencyData.soundType || emergencyData.message || 'Emergency'}
              </strong>
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-icon">📅</div>
            <div className="detail-content">
              <span className="detail-label">Date & Time</span>
              <span className="detail-value">{date} · {time}</span>
            </div>
          </div>
          {emergencyData.location && (
            <div className="detail-row">
              <div className="detail-icon">📍</div>
              <div className="detail-content">
                <span className="detail-label">Live Location</span>
                <a 
                  href={`https://www.google.com/maps?q=${emergencyData.location.lat},${emergencyData.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="location-link"
                >
                  View on Google Maps →
                </a>
              </div>
            </div>
          )}
          <div className="detail-row">
            <div className="detail-icon">📊</div>
            <div className="detail-content">
              <span className="detail-label">Severity</span>
              <div className="severity-bar">
                <div className="severity-fill" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {autoSentList.length > 0 && (
          <div className="auto-send-status">
            <div className="auto-send-header">
              <span>🤖 Auto-Send Active</span>
              <span className="auto-count">{autoSentList.length} contact(s)</span>
            </div>
            <p className="auto-send-message">
              WhatsApp messages are being automatically sent to contacts with Auto-Send enabled
            </p>
          </div>
        )}

        <div className="contacts-section">
          <div className="contacts-header">
            <span>👥 Emergency Contacts</span>
            <span className="contacts-count">{contactsWithPhone.length} contact{contactsWithPhone.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="contacts-list">
            {contactsWithPhone.map(rel => (
              <div 
                key={rel.id} 
                className={`emergency-contact-card ${autoSentList.includes(rel.id) ? 'auto-sent' : ''}`}
              >
                <div className="contact-avatar">
                  <div className="avatar-initial">{rel.name.charAt(0).toUpperCase()}</div>
                  {autoSentList.includes(rel.id) && (
                    <div className="auto-sent-badge" title="Auto-sent">✓</div>
                  )}
                  <div className="status-dot"></div>
                </div>
                
                <div className="contact-details">
                  <div className="contact-name">
                    {rel.name}
                    {rel.autoSendWhatsApp && <span className="auto-badge">Auto</span>}
                  </div>
                  <div className="contact-relation">{rel.relation || 'Emergency Contact'}</div>
                  <div className="contact-phone">{rel.phone}</div>
                </div>

                <div className="contact-actions">
                  {rel.notifyByWhatsApp && (
                    <button
                      className={`action-btn whatsapp ${autoSentList.includes(rel.id) ? 'sent' : ''}`}
                      onClick={() => handleSend(rel, 'whatsapp', onWhatsApp)}
                      disabled={sending && selectedContact === rel.id}
                    >
                      {sending && selectedContact === rel.id ? (
                        <div className="btn-spinner"></div>
                      ) : (
                        <>
                          <span>💬</span>
                          <span className="btn-label">
                            {autoSentList.includes(rel.id) ? 'Sent' : 'WhatsApp'}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                  {rel.notifyBySMS && (
                    <button
                      className="action-btn sms"
                      onClick={() => handleSend(rel, 'sms', onSMS)}
                      disabled={sending && selectedContact === rel.id}
                    >
                      <span>✉️</span>
                      <span className="btn-label">SMS</span>
                    </button>
                  )}
                  <button
                    className="action-btn call"
                    onClick={() => handleSend(rel, 'call', onCall)}
                    disabled={sending && selectedContact === rel.id}
                  >
                    <span>📞</span>
                    <span className="btn-label">Call</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-action-buttons">
          <button className="cancel-emergency-btn" onClick={onClose}>
            ✖ Dismiss
          </button>
          <button className="share-emergency-btn" onClick={() => {
            const shareText = `🚨 EMERGENCY ALERT\nDetected: ${emergencyData.soundType}\nTime: ${time}\nLocation: ${emergencyData.location ? `https://www.google.com/maps?q=${emergencyData.location.lat},${emergencyData.location.lng}` : 'Location unavailable'}`;
            if (navigator.share) {
              navigator.share({ title: 'Emergency Alert', text: shareText });
            } else {
              navigator.clipboard.writeText(shareText);
            }
          }}>
            📤 Share Alert
          </button>
        </div>
      </div>

      <style>{`
        @keyframes emergencyPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        @keyframes sirenFlash {
          0%, 100% { background: #FF3355; box-shadow: 0 0 10px #FF3355; }
          25% { background: #FF8833; box-shadow: 0 0 20px #FF8833; }
          50% { background: #FF3355; box-shadow: 0 0 10px #FF3355; }
          75% { background: #FFCC33; box-shadow: 0 0 20px #FFCC33; }
        }
        
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .emergency-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }
        
        .emergency-modal-container {
          background: linear-gradient(135deg, #0D1128 0%, #07091A 100%);
          border-radius: 32px;
          max-width: 580px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid rgba(255, 51, 85, 0.3);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(255, 51, 85, 0.2);
          animation: slideInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        
        .emergency-modal-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #FF3355, #FF8833, #FFCC33, #FF8833, #FF3355);
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
        }
        
        .emergency-modal-header {
          text-align: center;
          padding: 32px 24px 24px;
          background: linear-gradient(135deg, rgba(255, 51, 85, 0.15), rgba(255, 136, 51, 0.05));
          border-bottom: 1px solid rgba(255, 51, 85, 0.2);
        }
        
        .emergency-siren-animation {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .siren-light {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #FF3355;
          animation: sirenFlash 1s ease-in-out infinite;
        }
        
        .siren-light:nth-child(2) { animation-delay: 0.25s; }
        .siren-light:nth-child(3) { animation-delay: 0.5s; }
        .siren-light:nth-child(4) { animation-delay: 0.75s; }
        
        .emergency-icon-large {
          font-size: 64px;
          animation: emergencyPulse 0.8s ease-in-out infinite;
          display: inline-block;
          margin-bottom: 12px;
          filter: drop-shadow(0 0 20px rgba(255, 51, 85, 0.5));
        }
        
        .emergency-modal-header h2 {
          font-size: 28px;
          font-weight: 800;
          background: linear-gradient(135deg, #FF3355, #FF8833);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }
        
        .emergency-subtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }
        
        .emergency-details-card {
          margin: 20px 24px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
          border-radius: 24px;
          padding: 18px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .detail-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 0;
        }
        
        .detail-row:not(:last-child) {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .detail-icon {
          font-size: 24px;
          width: 40px;
        }
        
        .detail-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .detail-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .detail-value {
          font-size: 15px;
          font-weight: 600;
          color: #fff;
        }
        
        .location-link {
          color: #00DDB3;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }
        
        .location-link:hover {
          text-decoration: underline;
          color: #00FFCC;
        }
        
        .severity-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
          margin-top: 4px;
        }
        
        .severity-fill {
          height: 100%;
          background: linear-gradient(90deg, #FF3355, #FF8833);
          border-radius: 10px;
          animation: shimmer 2s linear infinite;
        }
        
        .auto-send-status {
          margin: 0 24px 20px;
          background: linear-gradient(135deg, rgba(37, 211, 102, 0.15), rgba(37, 211, 102, 0.05));
          border: 1px solid rgba(37, 211, 102, 0.3);
          border-radius: 16px;
          padding: 14px;
        }
        
        .auto-send-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #25D366;
        }
        
        .auto-count {
          background: rgba(37, 211, 102, 0.2);
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 11px;
        }
        
        .auto-send-message {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .contacts-section {
          margin: 0 24px 20px;
        }
        
        .contacts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }
        
        .contacts-count {
          font-size: 12px;
          color: #00DDB3;
          background: rgba(0, 221, 179, 0.15);
          padding: 4px 12px;
          border-radius: 20px;
        }
        
        .contacts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .emergency-contact-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.3s;
          position: relative;
        }
        
        .emergency-contact-card.auto-sent {
          background: linear-gradient(135deg, rgba(37, 211, 102, 0.1), rgba(37, 211, 102, 0.03));
          border-color: rgba(37, 211, 102, 0.3);
        }
        
        .emergency-contact-card:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(4px);
        }
        
        .contact-avatar {
          position: relative;
        }
        
        .avatar-initial {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00DDB3, #F5C842);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 700;
          color: #07091A;
        }
        
        .auto-sent-badge {
          position: absolute;
          bottom: -4px;
          right: -4px;
          background: #25D366;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: white;
          border: 2px solid #0D1128;
          animation: scaleIn 0.3s ease;
        }
        
        .status-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #00DDB3;
          border: 2px solid #0D1128;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        .contact-details {
          flex: 1;
        }
        
        .contact-name {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        
        .auto-badge {
          background: linear-gradient(135deg, #25D366, #128C7E);
          font-size: 9px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          color: white;
        }
        
        .contact-relation {
          font-size: 11px;
          color: #00DDB3;
          margin-bottom: 2px;
        }
        
        .contact-phone {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          font-family: monospace;
        }
        
        .contact-actions {
          display: flex;
          gap: 8px;
        }
        
        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
          min-width: 65px;
        }
        
        .action-btn .btn-label {
          font-size: 10px;
          font-weight: 600;
        }
        
        .action-btn.whatsapp {
          background: linear-gradient(135deg, rgba(37, 211, 102, 0.2), rgba(37, 211, 102, 0.1));
          border: 1px solid rgba(37, 211, 102, 0.4);
          color: #25D366;
        }
        
        .action-btn.whatsapp.sent {
          background: linear-gradient(135deg, #25D366, #128C7E);
          color: white;
        }
        
        .action-btn.whatsapp:hover:not(:disabled) {
          background: rgba(37, 211, 102, 0.4);
          transform: translateY(-2px);
        }
        
        .action-btn.sms {
          background: linear-gradient(135deg, rgba(68, 136, 255, 0.2), rgba(68, 136, 255, 0.1));
          border: 1px solid rgba(68, 136, 255, 0.4);
          color: #4488FF;
        }
        
        .action-btn.sms:hover:not(:disabled) {
          background: rgba(68, 136, 255, 0.4);
          transform: translateY(-2px);
        }
        
        .action-btn.call {
          background: linear-gradient(135deg, rgba(245, 166, 35, 0.2), rgba(245, 166, 35, 0.1));
          border: 1px solid rgba(245, 166, 35, 0.4);
          color: #F5A623;
        }
        
        .action-btn.call:hover:not(:disabled) {
          background: rgba(245, 166, 35, 0.4);
          transform: translateY(-2px);
        }
        
        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        
        .modal-action-buttons {
          display: flex;
          gap: 12px;
          padding: 20px 24px 28px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .cancel-emergency-btn {
          flex: 1;
          padding: 14px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .cancel-emergency-btn:hover {
          background: rgba(255, 51, 85, 0.15);
          border-color: #FF3355;
          color: #FF3355;
        }
        
        .share-emergency-btn {
          flex: 1;
          padding: 14px;
          border-radius: 16px;
          background: linear-gradient(135deg, #00DDB3, #00B899);
          border: none;
          color: #07091A;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .share-emergency-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 221, 179, 0.4);
        }
        
        .emergency-modal-container::-webkit-scrollbar,
        .contacts-list::-webkit-scrollbar {
          width: 4px;
        }
        
        .emergency-modal-container::-webkit-scrollbar-track,
        .contacts-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        
        .emergency-modal-container::-webkit-scrollbar-thumb,
        .contacts-list::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #FF3355, #FF8833);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default EmergencyContactModal;