// src/admin/users/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, where, orderBy, onSnapshot } from 'firebase/firestore';
import '../admin.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetail, setShowUserDetail] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'users'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const userList = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          userList.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            lastSeen: data.lastSeen?.toDate?.() || null,
          });
        });
        setUsers(userList);
        setLoading(false);
      },
      (error) => {
        console.error('User fetch error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === 'all' ? true :
                        filter === 'online' ? user.online : 
                        filter === 'guest' ? user.isGuest : true;
    return matchSearch && matchFilter;
  });

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user and all their data?')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      alert('User deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete user');
    }
  };

  const handleToggleUser = async (userId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), { disabled: !currentStatus });
    } catch (err) {
      console.error('Toggle error:', err);
      alert('Failed to update user');
    }
  };

  return (
    <div className="admin-user-management">
      <div className="admin-page-header">
        <h2>👥 User Management</h2>
        <div className="admin-page-actions">
          <span className="admin-total-users">{users.length} users</span>
        </div>
      </div>

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-search-input"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="admin-filter-select">
          <option value="all">All Users</option>
          <option value="online">Online</option>
          <option value="guest">Guest</option>
        </select>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="admin-loading-cell">Loading...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="6" className="admin-empty-cell">No users found</td></tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className={user.disabled ? 'disabled' : ''}>
                  <td>
                    <div className="admin-user-cell">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.name} className="admin-avatar-small" />
                      ) : (
                        <div className="admin-avatar-placeholder">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <span>{user.name || user.displayName || 'User'}</span>
                    </div>
                  </td>
                  <td>{user.email || '-'}</td>
                  <td>
                    <span className={`admin-status-badge ${user.online ? 'online' : 'offline'}`}>
                      {user.online ? '🟢 Online' : '⚪ Offline'}
                    </span>
                    {user.isGuest && <span className="admin-guest-badge">Guest</span>}
                  </td>
                  <td>{user.createdAt?.toLocaleDateString() || '-'}</td>
                  <td>
                    <span className={`admin-role-badge ${user.role === 'admin' ? 'admin' : 'user'}`}>
                      {user.role || 'User'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="admin-action-btn view"
                      onClick={() => { setSelectedUser(user); setShowUserDetail(true); }}
                    >
                      👁️
                    </button>
                    <button 
                      className="admin-action-btn toggle"
                      onClick={() => handleToggleUser(user.id, user.disabled)}
                    >
                      {user.disabled ? '🔓' : '🔒'}
                    </button>
                    <button 
                      className="admin-action-btn delete"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setShowUserDetail(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>User Details</h3>
              <button onClick={() => setShowUserDetail(false)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-user-detail">
                <div className="admin-user-detail-avatar">
                  {selectedUser.photoURL ? (
                    <img src={selectedUser.photoURL} alt={selectedUser.name} />
                  ) : (
                    <div>{selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                  )}
                </div>
                <div className="admin-user-detail-info">
                  <p><strong>Name:</strong> {selectedUser.name || selectedUser.displayName || 'User'}</p>
                  <p><strong>Email:</strong> {selectedUser.email || '-'}</p>
                  <p><strong>UID:</strong> <code>{selectedUser.id}</code></p>
                  <p><strong>Role:</strong> {selectedUser.role || 'User'}</p>
                  <p><strong>Status:</strong> {selectedUser.online ? '🟢 Online' : '⚪ Offline'}</p>
                  <p><strong>Joined:</strong> {selectedUser.createdAt?.toLocaleString() || '-'}</p>
                  <p><strong>Last Seen:</strong> {selectedUser.lastSeen?.toLocaleString() || '-'}</p>
                  {selectedUser.privacy && (
                    <div className="admin-privacy-detail">
                      <h4>Privacy Settings</h4>
                      <p>📍 Share Location: {selectedUser.privacy.shareLocation ? '✅' : '❌'}</p>
                      <p>🚨 Emergency Alerts: {selectedUser.privacy.shareEmergencyAlerts ? '✅' : '❌'}</p>
                    </div>
                  )}
                  {selectedUser.emergencyContacts && selectedUser.emergencyContacts.length > 0 && (
                    <div className="admin-contacts-detail">
                      <h4>Emergency Contacts ({selectedUser.emergencyContacts.length})</h4>
                      {selectedUser.emergencyContacts.slice(0, 3).map((contact, idx) => (
                        <p key={idx}>👤 {contact.name} · 📞 {contact.phone}</p>
                      ))}
                      {selectedUser.emergencyContacts.length > 3 && <p>... and {selectedUser.emergencyContacts.length - 3} more</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;