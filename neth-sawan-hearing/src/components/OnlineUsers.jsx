// src/components/OnlineUsers.jsx
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import VideoCall from './VideoCall';
import ChatComponent from './ChatComponent';
import './OnlineUsers.css';

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
    <div className="online-users-container card">
      <div className="card-head">
        <div className="card-title">
          <span className="card-title-icon icon-teal">👥</span>
          Community – Online Users
        </div>
      </div>
      {onlineUsers.length === 0 ? (
        <p className="no-users">🤟 No other users online right now. Share the app with friends!</p>
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
                  📹 Video Call (Sign Language)
                </button>
                <button className="chat-btn" onClick={() => setChatUser(user)}>
                  💬 Text Chat
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
    </div>
  );
};

export default OnlineUsers;