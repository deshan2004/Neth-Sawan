// src/components/ChatComponent.jsx – Text chat only
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';

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
          <div className="chat-title">💬 Chat with {targetUser.name}</div>
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
            placeholder="Type a message..."
            className="chat-input-field"
          />
          <button type="submit" className="chat-send-button">Send</button>
        </form>
      </div>

      <style>{`
        .chat-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.9);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
        }
        .chat-container {
          background: #0A0C1A;
          border-radius: 28px;
          width: 90%;
          max-width: 500px;
          height: 80vh;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .close-chat-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0,0,0,0.5);
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          color: white;
          font-size: 20px;
          cursor: pointer;
          z-index: 10;
        }
        .chat-header {
          padding: 20px;
          border-bottom: 1px solid #2A2F55;
        }
        .chat-title {
          font-size: 18px;
          font-weight: 700;
          color: #00DDB3;
          text-align: center;
        }
        .chat-messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .chat-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 20px;
          word-wrap: break-word;
        }
        .chat-bubble.sent {
          align-self: flex-end;
          background: #00CCAA;
          color: #000;
        }
        .chat-bubble.received {
          align-self: flex-start;
          background: #2A2F55;
          color: #fff;
        }
        .chat-sender {
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 4px;
          opacity: 0.8;
        }
        .chat-text {
          font-size: 14px;
        }
        .chat-input-area {
          display: flex;
          gap: 10px;
          padding: 16px;
          border-top: 1px solid #2A2F55;
        }
        .chat-input-field {
          flex: 1;
          padding: 10px 16px;
          border-radius: 40px;
          border: 1px solid #2A2F55;
          background: #1A1E3A;
          color: white;
          font-size: 14px;
        }
        .chat-send-button {
          background: #00CCAA;
          border: none;
          border-radius: 40px;
          padding: 10px 20px;
          font-weight: bold;
          cursor: pointer;
        }
        @media (max-width: 768px) {
          .chat-container {
            width: 95%;
            height: 85vh;
          }
          .chat-bubble {
            max-width: 90%;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatComponent;