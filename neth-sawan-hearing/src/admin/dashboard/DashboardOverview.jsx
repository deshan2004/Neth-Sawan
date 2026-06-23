// src/admin/dashboard/DashboardOverview.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import '../admin.css';

const DashboardOverview = ({ stats, loading }) => {
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    // Recent alerts
    const unsubscribeAlerts = onSnapshot(
      query(collection(db, 'emergency_alerts'), orderBy('timestamp', 'desc'), limit(5)),
      (snapshot) => {
        const alerts = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          alerts.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate?.() || new Date()
          });
        });
        setRecentAlerts(alerts);
      }
    );

    // Recent users
    const unsubscribeUsers = onSnapshot(
      query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5)),
      (snapshot) => {
        const users = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          users.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date()
          });
        });
        setRecentUsers(users);
      }
    );

    return () => {
      unsubscribeAlerts();
      unsubscribeUsers();
    };
  }, []);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-overview">
      {/* Quick Stats */}
      <div className="admin-quick-stats">
        <div className="admin-quick-stat">
          <span className="admin-qstat-value">{stats.totalUsers || 0}</span>
          <span className="admin-qstat-label">Total Users</span>
        </div>
        <div className="admin-quick-stat">
          <span className="admin-qstat-value">{stats.onlineUsers || 0}</span>
          <span className="admin-qstat-label">Online Now</span>
        </div>
        <div className="admin-quick-stat">
          <span className="admin-qstat-value">{stats.totalAlerts || 0}</span>
          <span className="admin-qstat-label">Total Alerts</span>
        </div>
        <div className="admin-quick-stat">
          <span className="admin-qstat-value">{stats.totalSounds || 0}</span>
          <span className="admin-qstat-label">Sound Events</span>
        </div>
        <div className="admin-quick-stat">
          <span className="admin-qstat-value">{stats.storageUsed || '0 MB'}</span>
          <span className="admin-qstat-label">Storage Used</span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="admin-activity-grid">
        <div className="admin-activity-card">
          <h3>🚨 Recent Alerts</h3>
          {recentAlerts.length === 0 ? (
            <p className="admin-empty">No recent alerts</p>
          ) : (
            <ul className="admin-activity-list">
              {recentAlerts.map((alert) => (
                <li key={alert.id} className="admin-activity-item alert">
                  <span className="admin-activity-icon">🔴</span>
                  <div className="admin-activity-info">
                    <span className="admin-activity-title">{alert.alertType || 'Emergency'}</span>
                    <span className="admin-activity-time">
                      {alert.timestamp?.toLocaleTimeString?.() || 'Just now'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="admin-activity-card">
          <h3>👤 Recent Users</h3>
          {recentUsers.length === 0 ? (
            <p className="admin-empty">No recent users</p>
          ) : (
            <ul className="admin-activity-list">
              {recentUsers.map((user) => (
                <li key={user.id} className="admin-activity-item user">
                  <span className="admin-activity-icon">👤</span>
                  <div className="admin-activity-info">
                    <span className="admin-activity-title">{user.name || user.displayName || 'User'}</span>
                    <span className="admin-activity-time">
                      {user.createdAt?.toLocaleDateString?.() || 'Just joined'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="admin-system-status">
        <h3>⚙️ System Status</h3>
        <div className="admin-status-grid">
          <div className="admin-status-item">
            <span className="admin-status-label">Firebase Auth</span>
            <span className="admin-status-badge online">🟢 Online</span>
          </div>
          <div className="admin-status-item">
            <span className="admin-status-label">Firestore Database</span>
            <span className="admin-status-badge online">🟢 Online</span>
          </div>
          <div className="admin-status-item">
            <span className="admin-status-label">Firebase Storage</span>
            <span className="admin-status-badge online">🟢 Online</span>
          </div>
          <div className="admin-status-item">
            <span className="admin-status-label">Backend API</span>
            <span className="admin-status-badge online">🟢 Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;