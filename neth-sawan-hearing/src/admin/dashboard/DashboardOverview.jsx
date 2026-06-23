// src/admin/dashboard/DashboardOverview.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useSwipeable } from 'react-swipeable';
import UserGrowthChart from './UserGrowthChart';
import AlertTrendChart from './AlertTrendChart';
import SoundHeatmap from './SoundHeatmap';
import '../admin.css';

const DashboardOverview = ({ stats, loading }) => {
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [extraMetrics, setExtraMetrics] = useState({
    avgAlertsPerDay: 0,
    peakHour: 'N/A',
    topUser: 'N/A',
  });

  // ── Swipeable charts for mobile ──
  const [chartIndex, setChartIndex] = useState(0);
  const charts = [
    <UserGrowthChart key="growth" />,
    <AlertTrendChart key="trend" />,
    <SoundHeatmap key="heatmap" />,
  ];

  const handlers = useSwipeable({
    onSwipedLeft: () => setChartIndex((prev) => (prev + 1) % charts.length),
    onSwipedRight: () => setChartIndex((prev) => (prev - 1 + charts.length) % charts.length),
    trackMouse: true,
    preventDefaultTouchmoveEvent: true,
  });

  // ── Real‑time listeners ──
  useEffect(() => {
    const unsubscribeAlerts = onSnapshot(
      query(collection(db, 'emergency_alerts'), orderBy('timestamp', 'desc'), limit(5)),
      (snapshot) => {
        const alerts = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          alerts.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate?.() || new Date(),
          });
        });
        setRecentAlerts(alerts);
      }
    );

    const unsubscribeUsers = onSnapshot(
      query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5)),
      (snapshot) => {
        const users = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          users.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          });
        });
        setRecentUsers(users);
      }
    );

    // ── Fetch extra metrics ──
    const fetchExtraMetrics = async () => {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const alertsSnap = await getDocs(
          query(collection(db, 'emergency_alerts'), where('timestamp', '>=', thirtyDaysAgo))
        );
        const total = alertsSnap.size;
        const avg = Math.round((total / 30) * 10) / 10;
        setExtraMetrics((prev) => ({ ...prev, avgAlertsPerDay: avg }));

        const last100Snap = await getDocs(
          query(collection(db, 'emergency_alerts'), orderBy('timestamp', 'desc'), limit(100))
        );
        const hourCount = {};
        last100Snap.forEach((doc) => {
          const ts = doc.data().timestamp?.toDate?.();
          if (ts) {
            const hour = ts.getHours();
            hourCount[hour] = (hourCount[hour] || 0) + 1;
          }
        });
        let maxCount = 0;
        let peakHour = 'N/A';
        for (const [hour, count] of Object.entries(hourCount)) {
          if (count > maxCount) {
            maxCount = count;
            peakHour = `${hour}:00`;
          }
        }
        setExtraMetrics((prev) => ({ ...prev, peakHour }));
        setExtraMetrics((prev) => ({ ...prev, topUser: '—' }));
      } catch (err) {
        console.error('Extra metrics error:', err);
      }
    };
    fetchExtraMetrics();

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

      {/* ─── Charts Row (Swipeable on mobile) ─── */}
      <div className="admin-charts-grid">
        <div className="admin-chart-card" {...handlers}>
          {charts[chartIndex]}
          <div className="admin-chart-indicators">
            {charts.map((_, i) => (
              <span
                key={i}
                className={i === chartIndex ? 'active' : ''}
                onClick={() => setChartIndex(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Extra Metrics */}
      <div className="admin-extra-metrics">
        <div className="admin-metric-card">
          <span>📊 Avg. Alerts / Day</span>
          <strong>{extraMetrics.avgAlertsPerDay}</strong>
        </div>
        <div className="admin-metric-card">
          <span>⏱️ Peak Hour</span>
          <strong>{extraMetrics.peakHour}</strong>
        </div>
        <div className="admin-metric-card">
          <span>🏆 Top User</span>
          <strong>{extraMetrics.topUser}</strong>
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
                    <span className="admin-activity-title">
                      {alert.alertType || 'Emergency'}
                    </span>
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
                    <span className="admin-activity-title">
                      {user.name || user.displayName || 'User'}
                    </span>
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