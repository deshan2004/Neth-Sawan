// src/components/ChatComponent.jsx – Text chat only
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import './ChatComponent.css';

const ChatComponent = ({ targetUser, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const roomId = [currentUser.uid, targetUser.uid].sort().join('_');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const messagesRef = collection(db, 'chats', roomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    const messagesRef = collection(db, 'chats', roomId, 'messages');
    await addDoc(messagesRef, {
      text: messageText,
      sender: currentUser.uid,
      senderName: currentUser.name,
      timestamp: Date.now()
    });
    setMessageText('');
  };

  return (
    <div className="chat-modal">
      <div className="chat-container">
        <button className="close-chat-btn" onClick={onClose}>✕</button>

        <div className="chat-header">
          <div className="chat-title">💬 Chat with {targetUser.name} 🤟</div>
        </div>

        <div className="chat-messages-area">
          {messages.map(msg => (
            <div key={msg.id} className={`chat-bubble ${msg.sender === currentUser.uid ? 'sent' : 'received'}`}>
              <div className="chat-sender">{msg.senderName}</div>
              <div className="chat-text">{msg.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="chat-input-area">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message... (or use sign language emojis)"
            className="chat-input-field"
          />
          <button type="submit" className="chat-send-button">Send</button>
        </form>
      </div>
    </div>
  );
};

export default ChatComponent;