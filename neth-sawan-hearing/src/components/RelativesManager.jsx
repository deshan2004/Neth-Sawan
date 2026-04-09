import React, { useState } from 'react';

const RELATIONS = [
  { value: 'parent',    label: 'Parent',    si: 'දෙමාපිය' },
  { value: 'spouse',    label: 'Spouse',    si: 'කලත්‍රයා' },
  { value: 'child',     label: 'Child',     si: 'දරුවා' },
  { value: 'sibling',   label: 'Sibling',   si: 'සහෝදර/සහෝදරිය' },
  { value: 'friend',    label: 'Friend',    si: 'මිතුරා' },
  { value: 'caregiver', label: 'Caregiver', si: 'රැකබලා ගන්නා' },
  { value: 'other',     label: 'Other',     si: 'වෙනත්' },
];

const BLANK = {
  name: '', phone: '', email: '', relation: '',
  notifyByWhatsApp: true,
  notifyBySMS: false,
  notifyByCall: false,
  notifyByDesktop: true,
  autoSendWhatsApp: false,
};

const RelativesManager = ({ relatives, onAdd, onRemove, onUpdate, onTest, autoSendStatus = {} }) => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm]     = useState(BLANK);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editId) onUpdate(editId, form);
    else        onAdd(form);
    resetForm();
  };

  const resetForm = () => {
    setForm(BLANK);
    setEditId(null);
    setShowForm(false);
  };

  const startEdit = (rel) => {
    setForm({ ...BLANK, ...rel });
    setEditId(rel.id);
    setShowForm(true);
  };

  const relLabel = (v) => {
    const r = RELATIONS.find(x => x.value === v);
    return r ? `${r.si} / ${r.label}` : v;
  };

  return (
    <div className="card">
      <div className="rel-head card-head" style={{ marginBottom: showForm ? 14 : 0 }}>
        <div className="card-title">
          <span className="card-title-icon icon-blue">👥</span>
          Emergency Contacts
        </div>
        <button
          className={`btn btn-sm ${showForm ? 'btn-outline-red' : 'btn-outline-teal'}`}
          onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
        >
          {showForm ? 'Cancel' : '+ Add Contact'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="form-box">
          <div className="form-field">
            <label className="form-label">Full Name *</label>
            <input
              className="form-input"
              type="text"
              placeholder="Contact's name"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Phone Number</label>
              <input
                className="form-input"
                type="tel"
                placeholder="+94 7X XXX XXXX"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Relation</label>
            <select
              className="form-select"
              value={form.relation}
              onChange={e => set('relation', e.target.value)}
            >
              <option value="">Select relation</option>
              {RELATIONS.map(r => (
                <option key={r.value} value={r.value}>{r.si} / {r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ display:'block', marginBottom:'8px' }}>
              Notification Methods
            </label>
            <div className="form-checks">
              {[
                { key: 'notifyByWhatsApp', label: 'WhatsApp', color: '#25D366' },
                { key: 'notifyBySMS',      label: 'SMS',       color: 'var(--blue)' },
                { key: 'notifyByCall',     label: 'Phone Call', color: 'var(--amber)' },
                { key: 'notifyByDesktop',  label: 'Desktop', color: 'var(--teal)' },
              ].map(opt => (
                <label key={opt.key} className="check-label">
                  <input
                    type="checkbox"
                    checked={form[opt.key]}
                    onChange={e => set(opt.key, e.target.checked)}
                  />
                  <span style={{ color: form[opt.key] ? opt.color : undefined }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="check-label">
              <input
                type="checkbox"
                checked={form.autoSendWhatsApp}
                onChange={e => set('autoSendWhatsApp', e.target.checked)}
              />
              <span style={{ color: form.autoSendWhatsApp ? '#25D366' : undefined }}>
                Auto-send WhatsApp on emergency
              </span>
            </label>
          </div>

          <div className="form-footer">
            <button type="submit" className="btn btn-teal btn-sm" style={{ flex: 1 }}>
              {editId ? 'Update Contact' : 'Save Contact'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rel-list" style={{ marginTop: showForm ? 0 : 14 }}>
        {relatives.length === 0 ? (
          <div className="rel-empty">
            <div className="icon">👥</div>
            <p>No emergency contacts added yet.</p>
            <small>Press "+ Add Contact" to add a contact. They will be notified during emergencies.</small>
          </div>
        ) : (
          relatives.map(rel => (
            <div key={rel.id} className="rel-item">
              <div className="rel-avatar">👤</div>
              <div className="rel-info">
                <div className="rel-name">
                  {rel.name}
                  {rel.relation && (
                    <span className="rel-relation">{relLabel(rel.relation)}</span>
                  )}
                  {rel.autoSendWhatsApp && (
                    <span className="method-tag wa" style={{ fontSize: 9 }}>Auto</span>
                  )}
                </div>
                {rel.phone && (
                  <div className="rel-contact">
                    <a href={`tel:${rel.phone}`}>{rel.phone}</a>
                  </div>
                )}
                {rel.email && (
                  <div className="rel-contact">
                    <a href={`mailto:${rel.email}`}>{rel.email}</a>
                  </div>
                )}
                <div className="rel-methods">
                  {rel.notifyByWhatsApp && <span className="method-tag wa">WhatsApp</span>}
                  {rel.notifyBySMS      && <span className="method-tag sms">SMS</span>}
                  {rel.notifyByCall     && <span className="method-tag call">Call</span>}
                  {rel.notifyByDesktop  && <span className="method-tag" style={{
                    background: 'var(--teal-lt)', color: 'var(--teal)',
                    border: '1px solid rgba(0,207,168,0.3)',
                    fontSize: 10, fontWeight: 600, padding: '2px 7px',
                    borderRadius: 5, display: 'flex', alignItems: 'center', gap: 3,
                  }}>Desktop</span>}
                </div>
              </div>
              <div className="rel-actions">
                <button
                  className="btn-icon"
                  onClick={() => startEdit(rel)}
                  title="Edit"
                >
                  ✎
                </button>
                {onTest && (
                  <button
                    className="btn-icon"
                    onClick={() => onTest(rel)}
                    title="Send test alert"
                    style={{ fontSize: 12 }}
                  >
                    ▶
                  </button>
                )}
                <button
                  className="btn-icon danger"
                  onClick={() => {
                    if (window.confirm(`Remove ${rel.name} from emergency contacts?`)) {
                      onRemove(rel.id);
                    }
                  }}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {'Notification' in window && Notification.permission !== 'granted' && (
        <div className="notif-perm">
          <button
            className="btn btn-outline-amber btn-sm"
            onClick={() => Notification.requestPermission()}
          >
            Enable Desktop Notifications
          </button>
          <p>Required for desktop alerts when sounds are detected.</p>
        </div>
      )}
    </div>
  );
};

export default RelativesManager;