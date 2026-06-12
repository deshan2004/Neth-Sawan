// src/components/OnlineUsers.jsx
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import VideoCall from './VideoCall';
import ChatComponent from './ChatComponent';

const OnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const userStatusRef = doc(db, 'users', currentUser.uid);
    const setOnline = async () => {
      await setDoc(userStatusRef, {
        online: true,
        lastSeen: new Date(),
        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        photoURL: currentUser.photoURL || null,
      }, { merge: true });
    };
    setOnline();

    const q = query(collection(db, 'users'), where('online', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = [];
      snapshot.forEach(doc => {
        if (doc.id !== currentUser.uid) {
          users.push({ uid: doc.id, ...doc.data() });
        }
      });
      setOnlineUsers(users);
    });

    const setOffline = async () => {
      await updateDoc(userStatusRef, { online: false, lastSeen: new Date() });
    };
    window.addEventListener('beforeunload', setOffline);
    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', setOffline);
      setOffline();
    };
  }, [currentUser]);

  if (!currentUser) return <div className="card">Please log in to see online users.</div>;

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <span className="card-title-icon icon-teal">👥</span>
          Community – Online Users
        </div>
      </div>
      {onlineUsers.length === 0 ? (
        <p className="no-users">No other users online right now. Share the app with friends!</p>
      ) : (
        <div className="online-users-list">
          {onlineUsers.map(user => (
            <div key={user.uid} className="online-user-item">
              <div className="user-avatar">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} />
                ) : (
                  <div className="avatar-initial">{user.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                )}
                <span className="online-dot"></span>
              </div>
              <div className="user-info">
                <span className="user-name">{user.name || 'User'}</span>
                <span className="user-status">Online</span>
              </div>
              <div className="user-buttons">
                <button className="video-call-btn" onClick={() => setSelectedUser(user)}>
                  📹 Video Call
                </button>
                <button className="chat-btn" onClick={() => setChatUser(user)}>
                  💬 Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedUser && (
        <VideoCall
          targetUser={selectedUser}
          currentUser={{ uid: currentUser.uid, name: currentUser.displayName || currentUser.email?.split('@')[0] }}
          onClose={() => setSelectedUser(null)}
        />
      )}
      {chatUser && (
        <ChatComponent
          targetUser={chatUser}
          currentUser={{ uid: currentUser.uid, name: currentUser.displayName || currentUser.email?.split('@')[0] }}
          onClose={() => setChatUser(null)}
        />
      )}

      <style>{`
        .no-users {
          text-align: center;
          padding: 40px;
          color: var(--text-muted);
          font-size: 14px;
        }
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
          transition: 0.2s;
          flex-wrap: wrap;
        }
        .online-user-item:hover {
          background: rgba(0,221,179,0.1);
        }
        .user-avatar {
          position: relative;
          width: 52px;
          height: 52px;
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
          font-size: 24px;
          color: #000;
        }
        .online-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          background: #00FF88;
          border-radius: 50%;
          border: 2px solid #0A0C1A;
          animation: onlinePulse 1.5s infinite;
        }
        @keyframes onlinePulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .user-info {
          flex: 1;
        }
        .user-name {
          font-weight: 600;
          font-size: 1rem;
          display: block;
        }
        .user-status {
          font-size: 11px;
          color: #00FF88;
        }
        .user-buttons {
          display: flex;
          gap: 10px;
        }
        .video-call-btn, .chat-btn {
          border: none;
          padding: 8px 16px;
          border-radius: 40px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }
        .video-call-btn {
          background: linear-gradient(135deg, #00CCAA, #00997a);
          color: #000;
        }
        .chat-btn {
          background: #2A2F55;
          color: #00DDFF;
          border: 1px solid #00DDFF;
        }
        .video-call-btn:hover, .chat-btn:hover {
          transform: translateY(-2px);
        }
        @media (max-width: 768px) {
          .online-user-item {
            flex-direction: column;
            align-items: flex-start;
          }
          .user-buttons {
            width: 100%;
            justify-content: space-between;
          }
          .video-call-btn, .chat-btn {
            flex: 1;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default OnlineUsers;