// src/admin/audit/AuditLog.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import '../admin.css';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'admin_logs'), orderBy('timestamp', 'desc'), limit(100)),
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate?.() || new Date(),
          });
        });
        setLogs(list);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return (
    <div className="admin-audit">
      <div className="admin-page-header">
        <h2>📋 Audit Log</h2>
        <span className="admin-total-alerts">{logs.length} events</span>
      </div>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4">Loading...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="4">No logs yet</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.timestamp?.toLocaleString()}</td>
                  <td>{log.adminName || log.adminEmail || 'System'}</td>
                  <td>{log.action}</td>
                  <td>{log.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLog;