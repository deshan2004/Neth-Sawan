// src/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc, updateDoc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import DashboardOverview from './dashboard/DashboardOverview';
import UserManagement from './users/UserManagement';
import EmergencyAlerts from './emergencies/EmergencyAlerts';
import SoundHistory from './sounds/SoundHistory';
import SystemSettings from './settings/SystemSettings';
import Reports from './reports/Reports';
import Auth from '../components/Auth';
import './admin.css';

const AdminDashboard = ({ user, onClose }) => {
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);

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

  // Load stats
  useEffect(() => {
    if (!isAdmin) return;

    const loadStats = async () => {
      setLoading(true);
      try {
        // Total users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnapshot.size;

        // Online users
        const onlineQuery = query(collection(db, 'users'), where('online', '==', true));
        const onlineSnapshot = await getDocs(onlineQuery);

        // Emergency alerts
        const alertsSnapshot = await getDocs(collection(db, 'emergency_alerts'));

        // Sound history (from all users - need to aggregate)
        let totalSounds = 0;
        const userDocs = await getDocs(collection(db, 'users'));
        for (const userDoc of userDocs.docs) {
          const soundHist = await getDocs(collection(db, 'users', userDoc.id, 'sound_history'));
          totalSounds += soundHist.size;
        }

        setStats({
          totalUsers: totalUsers,
          activeUsers: Math.floor(totalUsers * 0.7), // approximate
          totalAlerts: alertsSnapshot.size,
          totalSounds: totalSounds,
          onlineUsers: onlineSnapshot.size,
          storageUsed: '156 MB' // approximate
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
      setLoading(false);
    };

    loadStats();

    // Real-time alerts listener
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

    return () => unsubscribe();
  }, [isAdmin]);

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

  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return <DashboardOverview stats={stats} loading={loading} />;
      case 'users':
        return <UserManagement />;
      case 'alerts':
        return <EmergencyAlerts />;
      case 'sounds':
        return <SoundHistory />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <DashboardOverview stats={stats} loading={loading} />;
    }
  };

  return (
    <div className="admin-dashboard">
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onClose={onClose}
      />
      <div className={`admin-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <AdminHeader 
          stats={stats}
          notifications={notifications}
          onClose={onClose}
        />
        <div className="admin-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;