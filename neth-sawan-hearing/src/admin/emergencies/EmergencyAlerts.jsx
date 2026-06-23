// src/admin/emergencies/EmergencyAlerts.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { logAdminAction } from '../../utils/audit';
import AlertMap from './AlertMap';
import '../admin.css';

const EmergencyAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Bulk selection
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'emergency_alerts'), orderBy('timestamp', 'desc'), limit(50)),
      (snapshot) => {
        const alertList = [];
        snapshot.forEach((doc) => {
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

    const unsubscribe2 = onSnapshot(
      query(collection(db, 'emergencies'), orderBy('timestamp', 'desc'), limit(50)),
      (snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          setAlerts((prev) => {
            const existing = prev.find((a) => a.id === doc.id);
            if (existing) return prev;
            return [
              ...prev,
              {
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate?.() || new Date(),
                alertType: 'SOS',
              },
            ];
          });
        });
      }
    );

    return () => {
      unsubscribe();
      unsubscribe2();
    };
  }, []);

  useEffect(() => {
    if (selectAll) {
      setSelectedAlerts(filteredAlerts.map((a) => a.id));
    } else {
      setSelectedAlerts([]);
    }
  }, [selectAll, filter]);

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true;
    if (filter === 'sos') return alert.alertType === 'SOS' || alert.alertType?.includes('SOS');
    if (filter === 'fall') return alert.alertType === 'AUTOMATIC_FALL_DETECTION' || alert.alertType?.includes('FALL');
    if (filter === 'road') return alert.alertType === 'ROAD_SAFETY' || alert.alertType?.includes('HORN');
    if (filter === 'critical') return alert.status === 'CRITICAL';
    return true;
  });

  const toggleSelectAlert = (alertId) => {
    setSelectedAlerts((prev) =>
      prev.includes(alertId) ? prev.filter((id) => id !== alertId) : [...prev, alertId]
    );
  };

  const bulkResolve = async () => {
    if (selectedAlerts.length === 0) return;
    if (!window.confirm(`Resolve ${selectedAlerts.length} alerts?`)) return;
    try {
      const batch = writeBatch(db);
      selectedAlerts.forEach((id) => {
        const ref = doc(db, 'emergency_alerts', id);
        batch.update(ref, { status: 'RESOLVED' });
      });
      await batch.commit();
      await logAdminAction('BULK_RESOLVE', `Resolved ${selectedAlerts.length} alerts`);
      setSelectedAlerts([]);
      setSelectAll(false);
      alert(`${selectedAlerts.length} alerts resolved`);
    } catch (err) {
      console.error(err);
      alert('Bulk resolve failed');
    }
  };

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
      await logAdminAction('RESOLVE_ALERT', `Resolved alert ${alertId}`);
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
        <button onClick={() => setShowMap(!showMap)} className="admin-toggle-map">
          {showMap ? '📋 List View' : '🗺️ Map View'}
        </button>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="admin-filter-select">
          <option value="all">All Alerts</option>
          <option value="sos">SOS</option>
          <option value="fall">Fall Detection</option>
          <option value="road">Road Safety</option>
          <option value="critical">Critical</option>
        </select>
        {selectedAlerts.length > 0 && (
          <div className="admin-bulk-toolbar">
            <span>{selectedAlerts.length} selected</span>
            <button className="admin-bulk-btn" onClick={bulkResolve}>✅ Resolve</button>
            <button className="admin-bulk-btn" onClick={() => { setSelectedAlerts([]); setSelectAll(false); }}>✕ Clear</button>
          </div>
        )}
      </div>

      {showMap ? (
        <AlertMap />
      ) : (
        <div className="admin-alerts-list">
          {loading ? (
            <div className="admin-loading-cell">Loading alerts...</div>
          ) : filteredAlerts.length === 0 ? (
            <div className="admin-empty-cell">No alerts found</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => setSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>Type</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedAlerts.includes(alert.id)}
                        onChange={() => toggleSelectAlert(alert.id)}
                      />
                    </td>
                    <td>
                      <span className="admin-alert-icon">{getAlertIcon(alert)}</span>
                      {alert.alertType || 'Emergency'}
                    </td>
                    <td>{alert.timestamp?.toLocaleString?.() || 'Just now'}</td>
                    <td>
                      <span className={`admin-alert-badge ${alert.status?.toLowerCase() || 'new'}`}>
                        {alert.status || 'NEW'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-action-btn view"
                        onClick={() => { setSelectedAlert(alert); setShowDetail(true); }}
                      >
                        👁️
                      </button>
                      {alert.status !== 'RESOLVED' && (
                        <button
                          className="admin-action-btn resolve"
                          onClick={() => markAsResolved(alert.id)}
                          title="Resolve"
                        >
                          ✅
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedAlert && (
        <div className="admin-modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
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
                  <button className="admin-resolve-btn" onClick={() => markAsResolved(selectedAlert.id)}>
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