// src/admin/reports/Reports.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import '../admin.css';

const Reports = () => {
  const [reportType, setReportType] = useState('users');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    const generateReport = async () => {
      setLoading(true);
      try {
        if (reportType === 'users') {
          const snapshot = await getDocs(collection(db, 'users'));
          const users = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            users.push({
              id: doc.id,
              name: data.name || data.displayName || 'User',
              email: data.email || '-',
              online: data.online || false,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              role: data.role || 'user'
            });
          });
          setData(users);
          setSummary({
            total: users.length,
            online: users.filter(u => u.online).length,
            admins: users.filter(u => u.role === 'admin').length
          });
        } else if (reportType === 'alerts') {
          const alerts = [];
          const snapshots = [
            await getDocs(collection(db, 'emergency_alerts')),
            await getDocs(collection(db, 'emergencies'))
          ];
          for (const snapshot of snapshots) {
            snapshot.forEach(doc => {
              const data = doc.data();
              alerts.push({
                id: doc.id,
                type: data.alertType || data.message || 'Emergency',
                timestamp: data.timestamp?.toDate?.() || new Date(),
                status: data.status || 'NEW'
              });
            });
          }
          alerts.sort((a, b) => b.timestamp - a.timestamp);
          setData(alerts);
          setSummary({
            total: alerts.length,
            critical: alerts.filter(a => a.status === 'CRITICAL').length,
            resolved: alerts.filter(a => a.status === 'RESOLVED').length
          });
        } else if (reportType === 'sounds') {
          const sounds = [];
          const usersSnapshot = await getDocs(collection(db, 'users'));
          for (const userDoc of usersSnapshot.docs) {
            const soundSnapshot = await getDocs(
              query(collection(db, 'users', userDoc.id, 'sound_history'), limit(30))
            );
            soundSnapshot.forEach(doc => {
              const data = doc.data();
              sounds.push({
                id: doc.id,
                type: data.type || 'Sound',
                volume: data.volume || 0,
                timestamp: data.timestamp?.toDate?.() || new Date(),
                userId: userDoc.id
              });
            });
          }
          sounds.sort((a, b) => b.timestamp - a.timestamp);
          setData(sounds);
          // Group by type
          const typeCount = {};
          sounds.forEach(s => {
            typeCount[s.type] = (typeCount[s.type] || 0) + 1;
          });
          setSummary({
            total: sounds.length,
            types: typeCount
          });
        }
      } catch (err) {
        console.error('Report error:', err);
      }
      setLoading(false);
    };
    generateReport();
  }, [reportType]);

  const formatDate = (date) => {
    return date?.toLocaleDateString?.() || 'N/A';
  };

  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(key => obj[key] || '').join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-reports">
      <div className="admin-page-header">
        <h2>📈 Reports</h2>
        <div className="admin-page-actions">
          <button className="admin-export-btn" onClick={exportCSV}>📥 Export CSV</button>
        </div>
      </div>

      <div className="admin-filters">
        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="admin-filter-select">
          <option value="users">Users Report</option>
          <option value="alerts">Alerts Report</option>
          <option value="sounds">Sound Events Report</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="admin-report-summary">
        {Object.entries(summary).map(([key, value]) => (
          <div key={key} className="admin-summary-card">
            <span className="admin-summary-value">{value}</span>
            <span className="admin-summary-label">{key.replace(/_/g, ' ').toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              {data.length > 0 && Object.keys(data[0]).map(key => (
                <th key={key}>{key.replace(/_/g, ' ').toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" className="admin-loading-cell">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan="10" className="admin-empty-cell">No data available</td></tr>
            ) : (
              data.slice(0, 50).map((item, idx) => (
                <tr key={idx}>
                  {Object.entries(item).map(([key, value]) => (
                    <td key={key}>
                      {key === 'timestamp' ? formatDate(value) :
                       key === 'createdAt' ? formatDate(value) :
                       typeof value === 'object' ? JSON.stringify(value).slice(0, 30) :
                       value}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        {data.length > 50 && (
          <p className="admin-report-hint">Showing 50 of {data.length} records</p>
        )}
      </div>
    </div>
  );
};

export default Reports;