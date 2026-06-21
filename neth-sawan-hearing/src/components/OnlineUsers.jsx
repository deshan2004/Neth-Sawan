// src/components/OnlineUsers.jsx
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import VideoCall from './VideoCall';
import ChatComponent from './ChatComponent';
import InPersonTranslator from './InPersonTranslator';
import './OnlineUsers.css';

const OnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [isTranslatorOpen, setIsTranslatorOpen] = useState(false);

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

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="online-users-container">
      {/* Translator Button */}
      <div className="translator-section">
        <button
          className="translator-open-btn"
          onClick={() => setIsTranslatorOpen(true)}
        >
          📸 සජීවී සංඥා පරිවර්තකය විවෘත කරන්න
        </button>
      </div>

      {onlineUsers.length === 0 ? (
        <div className="no-users">👤 දැනට කිසිවෙකු online නැත. මිතුරන්ට යෙදුම බෙදාගන්න!</div>
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
                <span className="user-status">🟢 Online</span>
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

      {isTranslatorOpen && (
        <InPersonTranslator onClose={() => setIsTranslatorOpen(false)} />
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