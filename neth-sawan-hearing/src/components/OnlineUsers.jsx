// src/components/OnlineUsers.jsx
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import VideoCall from './VideoCall';

const OnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Update user's online status
    const userStatusRef = doc(db, 'users', currentUser.uid);
    const updateOnlineStatus = async () => {
      await setDoc(userStatusRef, { online: true, lastSeen: new Date() }, { merge: true });
    };
    updateOnlineStatus();

    // Listen for other online users
    const q = query(collection(db, 'users'), where('online', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (doc.id !== currentUser.uid) {
          users.push({ uid: doc.id, ...data });
        }
      });
      setOnlineUsers(users);
    });

    // Set offline on disconnect
    const disconnect = async () => {
      await updateDoc(userStatusRef, { online: false, lastSeen: new Date() });
    };
    window.addEventListener('beforeunload', disconnect);
    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', disconnect);
      disconnect();
    };
  }, [currentUser]);

  if (!currentUser) return <div className="card">Please log in to see online users.</div>;

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <span className="card-title-icon icon-teal">👥</span>
          Online Users
        </div>
      </div>
      {onlineUsers.length === 0 ? (
        <p>No other users online right now.</p>
      ) : (
        <div className="online-users-list">
          {onlineUsers.map(user => (
            <div key={user.uid} className="online-user-item">
              <div className="user-avatar">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} />
                ) : (
                  <div className="avatar-initial">{user.name?.charAt(0) || 'U'}</div>
                )}
                <span className="online-dot"></span>
              </div>
              <div className="user-info">
                <span className="user-name">{user.name || 'User'}</span>
                <span className="user-status">Online</span>
              </div>
              <button className="call-user-btn" onClick={() => setSelectedUser(user)}>
                📞 Video Call
              </button>
            </div>
          ))}
        </div>
      )}
      {selectedUser && (
        <VideoCall
          targetUser={selectedUser}
          currentUser={{ uid: currentUser.uid, name: currentUser.displayName }}
          onClose={() => setSelectedUser(null)}
        />
      )}

      <style>{`
        .online-users-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .online-user-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          background: rgba(255,255,255,0.05);
          border-radius: 20px;
        }
        .user-avatar {
          position: relative;
          width: 48px;
          height: 48px;
        }
        .user-avatar img, .avatar-initial {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          background: linear-gradient(135deg, #00CCAA, #008877);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 20px;
          color: #000;
        }
        .online-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          background: #00FF88;
          border-radius: 50%;
          border: 2px solid #0A0C1A;
        }
        .user-info {
          flex: 1;
        }
        .user-name {
          font-weight: 600;
          display: block;
        }
        .user-status {
          font-size: 11px;
          color: #00FF88;
        }
        .call-user-btn {
          background: #00CCAA;
          border: none;
          padding: 8px 16px;
          border-radius: 40px;
          font-weight: 600;
          cursor: pointer;
        }
        @media (max-width: 768px) {
          .online-user-item {
            flex-wrap: wrap;
          }
          .call-user-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default OnlineUsers;