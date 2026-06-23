// src/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import DashboardOverview from './dashboard/DashboardOverview';
import UserManagement from './users/UserManagement';
import EmergencyAlerts from './emergencies/EmergencyAlerts';
import SoundHistory from './sounds/SoundHistory';
import SystemSettings from './settings/SystemSettings';
import Reports from './reports/Reports';
import './admin.css';

const AdminDashboard = ({ user, onClose, currentTheme, onThemeChange }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalAlerts: 0,
    totalSounds: 0,
    onlineUsers: 0,
    storageUsed: '0 MB'
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [onlineUsersList, setOnlineUsersList] = useState([]);

  // Handle window resize – close sidebar on mobile if open
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setIsAdmin(data.role === 'admin' || user.email === 'admin@neth-sawan.com');
        }
      } catch (err) {
        console.error('Admin check error:', err);
      }
    };
    checkAdmin();
  }, [user]);

  // Load stats and online users
  useEffect(() => {
    if (!isAdmin) return;

    const loadStats = async () => {
      setLoading(true);
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnapshot.size;

        const onlineQuery = query(collection(db, 'users'), where('online', '==', true));
        const onlineSnapshot = await getDocs(onlineQuery);
        const onlineUsers = onlineSnapshot.size;

        const onlineList = [];
        onlineSnapshot.forEach(doc => {
          const data = doc.data();
          onlineList.push({
            id: doc.id,
            name: data.name || data.displayName || 'User',
            photoURL: data.photoURL || null,
            lastSeen: data.lastSeen?.toDate?.() || new Date(),
            email: data.email || ''
          });
        });
        setOnlineUsersList(onlineList);

        const alertsSnapshot = await getDocs(collection(db, 'emergency_alerts'));

        let totalSounds = 0;
        const userDocs = await getDocs(collection(db, 'users'));
        for (const userDoc of userDocs.docs) {
          const soundHist = await getDocs(collection(db, 'users', userDoc.id, 'sound_history'));
          totalSounds += soundHist.size;
        }

        setStats({
          totalUsers: totalUsers,
          activeUsers: Math.floor(totalUsers * 0.7),
          totalAlerts: alertsSnapshot.size,
          totalSounds: totalSounds,
          onlineUsers: onlineUsers,
          storageUsed: '156 MB'
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
      setLoading(false);
    };

    loadStats();

    const unsubscribe = onSnapshot(
      query(collection(db, 'emergency_alerts'), orderBy('timestamp', 'desc'), limit(10)),
      (snapshot) => {
        const alerts = [];
        snapshot.forEach(doc => {
          alerts.push({ id: doc.id, ...doc.data() });
        });
        setNotifications(alerts);
      }
    );

    const unsubscribeOnline = onSnapshot(
      query(collection(db, 'users'), where('online', '==', true)),
      (snapshot) => {
        const list = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          list.push({
            id: doc.id,
            name: data.name || data.displayName || 'User',
            photoURL: data.photoURL || null,
            lastSeen: data.lastSeen?.toDate?.() || new Date(),
            email: data.email || ''
          });
        });
        setOnlineUsersList(list);
      }
    );

    return () => {
      unsubscribe();
      unsubscribeOnline();
    };
  }, [isAdmin]);

  // Toggle: on mobile – open/close; on desktop – collapse/expand
  const toggleSidebar = () => {
    if (window.innerWidth <= 1024) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'overview': return <DashboardOverview stats={stats} loading={loading} onlineUsers={onlineUsersList} />;
      case 'users': return <UserManagement />;
      case 'alerts': return <EmergencyAlerts />;
      case 'sounds': return <SoundHistory />;
      case 'reports': return <Reports />;
      case 'settings': return <SystemSettings />;
      default: return <DashboardOverview stats={stats} loading={loading} onlineUsers={onlineUsersList} />;
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-access-denied">
        <span style={{ fontSize: '64px' }}>🔒</span>
        <h2>Access Denied</h2>
        <p>You do not have admin privileges.</p>
        <button onClick={onClose} className="admin-back-btn">← Back to App</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        collapsed={sidebarCollapsed}
      />
      <div
        className={`admin-main ${sidebarOpen ? 'sidebar-open' : ''} ${
          sidebarCollapsed ? 'sidebar-collapsed' : ''
        }`}
      >
        <AdminHeader
          stats={stats}
          notifications={notifications}
          onClose={onClose}
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          currentTheme={currentTheme}
          onThemeChange={onThemeChange}
        />
        <div className="admin-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;