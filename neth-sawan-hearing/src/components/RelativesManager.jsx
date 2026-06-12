// src/components/RelativesManager.jsx
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import './RelativesManager.css';

const RELATIONS = [
  { value: 'parent',    label: 'Parent',    si: 'දෙමාපිය', emoji: '👨‍👩‍👧' },
  { value: 'spouse',    label: 'Spouse',    si: 'කලත්‍රයා', emoji: '💑' },
  { value: 'child',     label: 'Child',     si: 'දරුවා', emoji: '👶' },
  { value: 'sibling',   label: 'Sibling',   si: 'සහෝදර/සහෝදරිය', emoji: '👥' },
  { value: 'friend',    label: 'Friend',    si: 'මිතුරා', emoji: '🤝' },
  { value: 'caregiver', label: 'Caregiver', si: 'රැකබලා ගන්නා', emoji: '🫂' },
  { value: 'other',     label: 'Other',     si: 'වෙනත්', emoji: '📌' },
];

const BLANK = {
  name: '', phone: '', email: '', relation: '',
  notifyByWhatsApp: true,
  notifyBySMS: false,
  notifyByCall: false,
  notifyByDesktop: true,
  autoSendWhatsApp: false,
};

// Beautiful WhatsApp message template
const buildWhatsAppMessage = (contactName, emergencyData, userInfo) => {
  const time = new Date(emergencyData.timestamp || new Date()).toLocaleString('en-LK', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  
  let message = `🚨 *EMERGENCY ALERT - Neth-Sawan* 🚨\n\n`;
  message += `Dear ${contactName},\n\n`;
  message += `⚠️ *This is an automated emergency alert from your loved one's device.*\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📢 *DETECTED:* ${emergencyData.soundType || 'SOS button pressed'}\n`;
  message += `🕒 *TIME:* ${time}\n`;
  message += `👤 *USER:* ${userInfo?.name || 'Neth-Sawan User'}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  if (emergencyData.location) {
    message += `📍 *LIVE LOCATION:*\n`;
    message += `https://maps.google.com/?q=${emergencyData.location.lat},${emergencyData.location.lng}\n\n`;
  }
  
  message += `📝 *MESSAGE:* ${emergencyData.message || 'Immediate assistance may be required. Please check on your loved one as soon as possible.'}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `⚠️ *PLEASE RESPOND PROMPTLY* ⚠️\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `_This is an automated message from Neth-Sawan Hearing Assistant._\n`;
  message += `_For more info, visit neth-sawan.app_`;
  return message;
};

const RelativesManager = ({ 
  relatives = [], 
  onAdd, 
  onRemove, 
  onUpdate, 
  autoSendStatus = {},
  isGuest = false 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(null);
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });

  // Get current user info for WhatsApp message
  useEffect(() => {
    if (auth.currentUser) {
      setUserInfo({
        name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User',
        email: auth.currentUser.email,
      });
    } else {
      setUserInfo({ name: 'Guest User', email: '' });
    }
  }, []);

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const resetForm = () => {
    setForm(BLANK);
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editId) {
      if (onUpdate) await onUpdate(editId, form);
    } else {
      if (onAdd) await onAdd(form);
    }
    resetForm();
  };

  const startEdit = (rel) => {
    setForm({ ...BLANK, ...rel });
    setEditId(rel.id);
    setShowForm(true);
  };

  const relLabel = (value) => {
    const r = RELATIONS.find(x => x.value === value);
    return r ? `${r.emoji} ${r.si} / ${r.label}` : value;
  };

  // Send WhatsApp message (manually)
  const sendWhatsAppNow = async (contact, isTest = true) => {
    setSendingWhatsApp(contact.id);
    
    const emergencyData = {
      soundType: isTest ? '🔔 TEST ALERT' : '🚨 EMERGENCY',
      message: isTest 
        ? 'This is a TEST alert from Neth-Sawan. Please ignore if everything is fine.' 
        : 'Emergency detected! Immediate attention needed. Please contact urgently.',
      timestamp: new Date(),
      location: null,
    };
    
    if (!isTest) {
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        emergencyData.location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (e) { /* ignore location failure */ }
    }
    
    const message = buildWhatsAppMessage(contact.name, emergencyData, userInfo);
    let phoneNumber = contact.phone.replace(/[\s\-\(\)\.]/g, '');
    if (phoneNumber.startsWith('0')) phoneNumber = '+94' + phoneNumber.slice(1);
    else if (!phoneNumber.startsWith('+')) phoneNumber = '+94' + phoneNumber;
    
    const url = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    
    setTimeout(() => setSendingWhatsApp(null), 1500);
  };

  return (
    <div className="card relatives-manager-card" style={{ borderRadius: '28px', overflow: 'hidden' }}>
      {/* Header */}
      <div className="card-head" style={{ 
        background: 'linear-gradient(135deg, rgba(0,221,179,0.1), rgba(0,221,179,0.02))',
        padding: '20px 24px',
        borderBottom: '1px solid rgba(0,221,179,0.2)'
      }}>
        <div className="card-title" style={{ fontSize: '1.3rem', fontWeight: '700' }}>
          <span className="card-title-icon" style={{ fontSize: '28px' }}>👥</span>
          Emergency Contacts
        </div>
        <button
          type="button"
          className={`btn ${showForm ? 'btn-outline-red' : 'btn-teal'}`}
          onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
          style={{
            padding: '10px 20px',
            borderRadius: '40px',
            fontWeight: '600',
            background: showForm ? 'rgba(255,51,85,0.15)' : 'linear-gradient(135deg, #00CCAA, #00997a)',
            color: showForm ? '#FF3355' : '#000',
            border: showForm ? '1px solid #FF3355' : 'none',
            cursor: 'pointer'
          }}
        >
          {showForm ? '✕ Cancel' : '+ Add Contact'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: 'rgba(0,0,0,0.2)',
          margin: '20px',
          padding: '24px',
          borderRadius: '24px',
          border: '1px solid rgba(0,221,179,0.2)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div className="form-field">
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Full Name *</label>
              <input
                type="text"
                placeholder="e.g., Amara Perera"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                required
                style={{ width: '100%', padding: '12px', borderRadius: '16px', background: '#1A1E3A', border: '1px solid #2A2F55', color: 'white' }}
              />
            </div>
            <div className="form-field">
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Phone Number</label>
              <input
                type="tel"
                placeholder="+94 7X XXX XXXX"
                value={form.phone}
                onChange={e => setField('phone', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '16px', background: '#1A1E3A', border: '1px solid #2A2F55', color: 'white' }}
              />
            </div>
            <div className="form-field">
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Email</label>
              <input
                type="email"
                placeholder="contact@example.com"
                value={form.email}
                onChange={e => setField('email', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '16px', background: '#1A1E3A', border: '1px solid #2A2F55', color: 'white' }}
              />
            </div>
            <div className="form-field">
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Relation</label>
              <select
                value={form.relation}
                onChange={e => setField('relation', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '16px', background: '#1A1E3A', border: '1px solid #2A2F55', color: 'white' }}
              >
                <option value="">Select relation</option>
                {RELATIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.emoji} {r.si} / {r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '12px' }}>Notification Methods</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              {[
                { key: 'notifyByWhatsApp', label: 'WhatsApp', color: '#25D366', icon: '💬' },
                { key: 'notifyBySMS',      label: 'SMS',       color: '#4488FF', icon: '✉️' },
                { key: 'notifyByCall',     label: 'Phone Call', color: '#F5A623', icon: '📞' },
                { key: 'notifyByDesktop',  label: 'Desktop',    color: '#00DDB3', icon: '🖥️' },
              ].map(opt => (
                <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 16px', background: '#1A1E3A', borderRadius: '40px' }}>
                  <input
                    type="checkbox"
                    checked={form[opt.key]}
                    onChange={e => setField(opt.key, e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ color: form[opt.key] ? opt.color : '#A0A8D0' }}>{opt.icon} {opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.autoSendWhatsApp}
                onChange={e => setField('autoSendWhatsApp', e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ color: form.autoSendWhatsApp ? '#25D366' : '#A0A8D0' }}>🤖 Auto-send WhatsApp on emergency (no confirmation)</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '40px', fontWeight: 'bold', background: 'linear-gradient(135deg, #00CCAA, #00997a)', color: '#000', border: 'none', cursor: 'pointer' }}>
              {editId ? '✎ Update Contact' : '✓ Save Contact'}
            </button>
            <button type="button" onClick={resetForm} style={{ padding: '14px 24px', borderRadius: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid #2A2F55', color: '#D0D8FF', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Contacts List */}
      <div className="rel-list" style={{ padding: '20px' }}>
        {(!relatives || relatives.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: 'rgba(0,0,0,0.15)', borderRadius: '24px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>👥</div>
            <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No emergency contacts added yet.</p>
            <small style={{ color: '#A0A8D0' }}>Press "+ Add Contact" to add a contact. They will be notified during emergencies.</small>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {relatives.map(rel => (
              <div key={rel.id} className="rel-item" style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                borderRadius: '24px',
                padding: '20px',
                border: '1px solid rgba(0,221,179,0.15)',
                transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, #00CCAA, #008877)',
                    borderRadius: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#000'
                  }}>
                    {rel.name ? rel.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '700' }}>{rel.name}</span>
                      {rel.relation && (
                        <span style={{ background: 'rgba(0,221,179,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                          {relLabel(rel.relation)}
                        </span>
                      )}
                      {rel.autoSendWhatsApp && (
                        <span style={{ background: '#25D36620', color: '#25D366', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold' }}>
                          🤖 Auto
                        </span>
                      )}
                    </div>
                    {rel.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#A0A8D0', marginBottom: '4px' }}>
                        <span>📞</span> {rel.phone}
                      </div>
                    )}
                    {rel.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#A0A8D0', marginBottom: '4px' }}>
                        <span>✉️</span> {rel.email}
                      </div>
                    )}
                    <div className="rel-methods" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                      {rel.notifyByWhatsApp && <span style={{ background: '#25D36620', color: '#25D366', padding: '4px 12px', borderRadius: '30px', fontSize: '11px', fontWeight: '600' }}>💬 WhatsApp</span>}
                      {rel.notifyBySMS && <span style={{ background: '#4488FF20', color: '#4488FF', padding: '4px 12px', borderRadius: '30px', fontSize: '11px', fontWeight: '600' }}>✉️ SMS</span>}
                      {rel.notifyByCall && <span style={{ background: '#F5A62320', color: '#F5A623', padding: '4px 12px', borderRadius: '30px', fontSize: '11px', fontWeight: '600' }}>📞 Call</span>}
                      {rel.notifyByDesktop && <span style={{ background: '#00DDB320', color: '#00DDB3', padding: '4px 12px', borderRadius: '30px', fontSize: '11px', fontWeight: '600' }}>🖥️ Desktop</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {rel.phone && (
                      <button
                        type="button"
                        onClick={() => sendWhatsAppNow(rel, true)}
                        disabled={sendingWhatsApp === rel.id}
                        style={{
                          background: '#25D36620',
                          border: '1px solid #25D366',
                          borderRadius: '40px',
                          padding: '10px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {sendingWhatsApp === rel.id ? (
                          <div style={{ width: '18px', height: '18px', border: '2px solid #25D366', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></div>
                        ) : (
                          <>
                            <span>💬</span>
                            <span style={{ fontWeight: '600', color: '#25D366' }}>WhatsApp</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(rel)}
                      style={{ background: '#2A2F55', border: 'none', width: '42px', height: '42px', borderRadius: '40px', cursor: 'pointer', fontSize: '18px', color: '#D0D8FF' }}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (onRemove && window.confirm(`Remove ${rel.name} from emergency contacts?`)) onRemove(rel.id); }}
                      style={{ background: 'rgba(255,51,85,0.15)', border: '1px solid #FF3355', width: '42px', height: '42px', borderRadius: '40px', cursor: 'pointer', fontSize: '18px', color: '#FF3355' }}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop notifications permission prompt */}
      {'Notification' in window && Notification.permission !== 'granted' && !isGuest && (
        <div style={{ margin: '0 20px 20px 20px', padding: '16px', background: 'rgba(68,136,255,0.1)', borderRadius: '20px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => Notification.requestPermission()}
            style={{ background: 'rgba(0,221,179,0.15)', border: '1px solid #00DDB3', padding: '10px 20px', borderRadius: '40px', color: '#00DDB3', fontWeight: '600', cursor: 'pointer' }}
          >
            🔔 Enable Desktop Notifications
          </button>
          <p style={{ fontSize: '12px', color: '#A0A8D0', marginTop: '8px' }}>Required for desktop alerts when sounds are detected.</p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .rel-item:hover {
          transform: translateY(-2px);
          border-color: rgba(0,221,179,0.4) !important;
          box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

export default RelativesManager;