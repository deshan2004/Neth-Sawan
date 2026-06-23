// src/admin/reports/Reports.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../admin.css';

const Reports = () => {
  const [reportType, setReportType] = useState('users');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    const generateReport = async () => {
      setLoading(true);
      try {
        let allData = [];
        if (reportType === 'users') {
          let usersQuery = collection(db, 'users');
          if (startDate && endDate) {
            usersQuery = query(
              collection(db, 'users'),
              where('createdAt', '>=', startDate),
              where('createdAt', '<=', endDate)
            );
          }
          const snapshot = await getDocs(usersQuery);
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
          let alertsQuery = collection(db, 'emergency_alerts');
          if (startDate && endDate) {
            alertsQuery = query(
              collection(db, 'emergency_alerts'),
              where('timestamp', '>=', startDate),
              where('timestamp', '<=', endDate)
            );
          }
          const alerts = [];
          const snapshot = await getDocs(alertsQuery);
          snapshot.forEach(doc => {
            const data = doc.data();
            alerts.push({
              id: doc.id,
              type: data.alertType || data.message || 'Emergency',
              timestamp: data.timestamp?.toDate?.() || new Date(),
              status: data.status || 'NEW'
            });
          });
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
            let soundQuery = collection(db, 'users', userDoc.id, 'sound_history');
            if (startDate && endDate) {
              soundQuery = query(
                collection(db, 'users', userDoc.id, 'sound_history'),
                where('timestamp', '>=', startDate),
                where('timestamp', '<=', endDate)
              );
            }
            const soundSnapshot = await getDocs(soundQuery);
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
  }, [reportType, startDate, endDate]);

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

  const exportPDF = () => {
    if (data.length === 0) return;
    const doc = new jsPDF('landscape');
    const title = reportType.charAt(0).toUpperCase() + reportType.slice(1) + ' Report';
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    const headers = Object.keys(data[0]).map(key => key.replace(/_/g, ' ').toUpperCase());
    const rows = data.slice(0, 50).map(obj => Object.values(obj).map(val =>
      typeof val === 'object' ? JSON.stringify(val).slice(0, 30) : val
    ));
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 221, 179] },
    });
    doc.save(`${reportType}_report.pdf`);
  };

  return (
    <div className="admin-reports">
      <div className="admin-page-header">
        <h2>📈 Reports</h2>
        <div className="admin-page-actions">
          <button className="admin-export-btn" onClick={exportCSV}>📥 Export CSV</button>
          <button className="admin-export-btn" onClick={exportPDF}>📄 Export PDF</button>
        </div>
      </div>

      {/* Filters: report type + date range */}
      <div className="admin-filters">
        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="admin-filter-select">
          <option value="users">Users Report</option>
          <option value="alerts">Alerts Report</option>
          <option value="sounds">Sound Events Report</option>
        </select>
        <DatePicker
          selected={startDate}
          onChange={date => setStartDate(date)}
          placeholderText="Start Date"
          className="admin-date-picker"
          dateFormat="yyyy-MM-dd"
        />
        <DatePicker
          selected={endDate}
          onChange={date => setEndDate(date)}
          placeholderText="End Date"
          className="admin-date-picker"
          dateFormat="yyyy-MM-dd"
        />
        {(startDate || endDate) && (
          <button onClick={() => { setStartDate(null); setEndDate(null); }} className="admin-clear-filters">
            ✕ Clear
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="admin-report-summary">
        {Object.entries(summary).map(([key, value]) => (
          <div key={key} className="admin-summary-card">
            <span className="admin-summary-value">{typeof value === 'object' ? Object.keys(value).length : value}</span>
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