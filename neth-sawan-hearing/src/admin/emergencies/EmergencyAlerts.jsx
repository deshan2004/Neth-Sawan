// src/admin/emergencies/EmergencyAlerts.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import '../admin.css';

const EmergencyAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'emergency_alerts'), orderBy('timestamp', 'desc'), limit(50)),
      (snapshot) => {
        const alertList = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          alertList.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate?.() || new Date(),
          });
        });
        setAlerts(alertList);
        setLoading(false);
      },
      (error) => {
        console.error('Alerts fetch error:', error);
        setLoading(false);
      }
    );

    // Also listen for emergencies collection
    const unsubscribe2 = onSnapshot(
      query(collection(db, 'emergencies'), orderBy('timestamp', 'desc'), limit(50)),
      (snapshot) => {
        snapshot.forEach(doc => {
          const data = doc.data();
          // Merge with alerts (avoid duplicates by checking id)
          setAlerts(prev => {
            const existing = prev.find(a => a.id === doc.id);
            if (existing) return prev;
            return [...prev, {
              id: doc.id,
              ...data,
              timestamp: data.timestamp?.toDate?.() || new Date(),
              alertType: 'SOS'
            }];
          });
        });
      }
    );

    return () => {
      unsubscribe();
      unsubscribe2();
    };
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'sos') return alert.alertType === 'SOS' || alert.alertType?.includes('SOS');
    if (filter === 'fall') return alert.alertType === 'AUTOMATIC_FALL_DETECTION' || alert.alertType?.includes('FALL');
    if (filter === 'road') return alert.alertType === 'ROAD_SAFETY' || alert.alertType?.includes('HORN');
    if (filter === 'critical') return alert.status === 'CRITICAL';
    return true;
  });

  const getAlertIcon = (alert) => {
    if (alert.alertType?.includes('FALL')) return '🛑';
    if (alert.alertType?.includes('SOS')) return '🆘';
    if (alert.alertType?.includes('HORN')) return '📢';
    if (alert.alertType?.includes('SIREN')) return '🚨';
    return '⚠️';
  };

  const getAlertColor = (alert) => {
    if (alert.status === 'CRITICAL') return '#FF0033';
    if (alert.status === 'WARNING') return '#FF8800';
    return '#00DDB3';
  };

  const markAsResolved = async (alertId) => {
    try {
      await updateDoc(doc(db, 'emergency_alerts', alertId), { status: 'RESOLVED' });
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  return (
    <div className="admin-alerts">
      <div className="admin-page-header">
        <h2>🚨 Emergency Alerts</h2>
        <div className="admin-page-actions">
          <span className="admin-total-alerts">{alerts.length} alerts</span>
        </div>
      </div>

      <div className="admin-filters">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="admin-filter-select">
          <option value="all">All Alerts</option>
          <option value="sos">SOS</option>
          <option value="fall">Fall Detection</option>
          <option value="road">Road Safety</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="admin-alerts-list">
        {loading ? (
          <div className="admin-loading-cell">Loading alerts...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="admin-empty-cell">No alerts found</div>
        ) : (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className="admin-alert-item"
              style={{ borderLeftColor: getAlertColor(alert) }}
              onClick={() => { setSelectedAlert(alert); setShowDetail(true); }}
            >
              <div className="admin-alert-icon">{getAlertIcon(alert)}</div>
              <div className="admin-alert-info">
                <span className="admin-alert-type">{alert.alertType || 'Emergency'}</span>
                <span className="admin-alert-time">
                  {alert.timestamp?.toLocaleString?.() || 'Just now'}
                </span>
              </div>
              <div className="admin-alert-status">
                <span className={`admin-alert-badge ${alert.status?.toLowerCase() || 'new'}`}>
                  {alert.status || 'NEW'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Alert Detail Modal */}
      {showDetail && selectedAlert && (
        <div className="admin-modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Alert Details</h3>
              <button onClick={() => setShowDetail(false)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-alert-detail">
                <p><strong>Type:</strong> {selectedAlert.alertType || 'Emergency'}</p>
                <p><strong>Status:</strong> <span className={`admin-alert-badge ${selectedAlert.status?.toLowerCase() || 'new'}`}>{selectedAlert.status || 'NEW'}</span></p>
                <p><strong>Time:</strong> {selectedAlert.timestamp?.toLocaleString() || '-'}</p>
                <p><strong>User ID:</strong> <code>{selectedAlert.userId || 'N/A'}</code></p>
                <p><strong>Location:</strong> {selectedAlert.location || 'Not available'}</p>
                {selectedAlert.message && <p><strong>Message:</strong> {selectedAlert.message}</p>}
                {selectedAlert.soundType && <p><strong>Sound Type:</strong> {selectedAlert.soundType}</p>}
                {selectedAlert.volume !== undefined && <p><strong>Volume:</strong> {Math.round(selectedAlert.volume * 100)}%</p>}
                {selectedAlert.status !== 'RESOLVED' && (
                  <button 
                    className="admin-resolve-btn"
                    onClick={() => markAsResolved(selectedAlert.id)}
                  >
                    ✅ Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyAlerts;