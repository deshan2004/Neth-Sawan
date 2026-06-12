// src/components/VideoCall.jsx
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc, deleteDoc, setDoc, collection, addDoc, query, orderBy, onSnapshot as onSnapshotQuery } from 'firebase/firestore';
import Peer from 'peerjs';

const VideoCall = ({ targetUser, currentUser, onClose }) => {
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, ringing, connected
  const [incomingCall, setIncomingCall] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef(null);
  const callRef = useRef(null);
  const roomId = [currentUser.uid, targetUser.uid].sort().join('_');
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize PeerJS
  useEffect(() => {
    const peer = new Peer(currentUser.uid, {
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
    });
    peerRef.current = peer;

    peer.on('open', () => console.log('Peer ready:', currentUser.uid));
    peer.on('call', (call) => {
      // Incoming call
      setIncomingCall(true);
      setCallStatus('ringing');
      callRef.current = call;
    });
    peer.on('error', (err) => console.error('Peer error:', err));

    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [currentUser.uid]);

  // Listen for Firestore signaling (offers, answers, candidates)
  useEffect(() => {
    const signalingRef = doc(db, 'signaling', roomId);
    const unsubscribe = onSnapshot(signalingRef, async (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();

      // Handle incoming offer
      if (data.offer && data.to === currentUser.uid && callStatus === 'idle' && !incomingCall) {
        setIncomingCall(true);
        setCallStatus('ringing');
        if (!callRef.current) {
          const peer = peerRef.current;
          if (peer) {
            const call = peer.call(targetUser.uid, await getLocalStream());
            callRef.current = call;
            setupCallHandlers(call);
          }
        }
      }

      // Handle answer
      if (data.answer && callRef.current && callRef.current.peer === data.from) {
        callRef.current.answer(data.answer);
      }

      // Handle ICE candidate
      if (data.candidate && callRef.current) {
        callRef.current.addIceCandidate(data.candidate);
      }
    });
    return () => unsubscribe();
  }, [roomId, currentUser.uid, callStatus, incomingCall, targetUser.uid]);

  // Listen for chat messages
  useEffect(() => {
    const messagesRef = collection(db, 'calls', roomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshotQuery(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [roomId]);

  const getLocalStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const setupCallHandlers = (call) => {
    call.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      setCallStatus('connected');
      setIncomingCall(false);
    });
    call.on('close', () => endCall());
    call.on('error', (err) => console.error('Call error:', err));
  };

  const startCall = async () => {
    setCallStatus('calling');
    const stream = await getLocalStream();
    const call = peerRef.current.call(targetUser.uid, stream);
    callRef.current = call;
    setupCallHandlers(call);
    // Send offer via Firestore
    const offer = call.peerConnection.localDescription;
    await setDoc(doc(db, 'signaling', roomId), {
      offer,
      from: currentUser.uid,
      to: targetUser.uid,
      timestamp: Date.now()
    });
  };

  const answerCall = async () => {
    if (!callRef.current) return;
    const stream = await getLocalStream();
    callRef.current.answer(stream);
    setupCallHandlers(callRef.current);
    setCallStatus('connected');
    setIncomingCall(false);
    // Send answer via Firestore
    const answer = callRef.current.peerConnection.localDescription;
    await setDoc(doc(db, 'signaling', roomId), {
      answer,
      from: currentUser.uid,
      to: targetUser.uid,
      timestamp: Date.now()
    }, { merge: true });
  };

  const rejectCall = () => {
    if (callRef.current) callRef.current.close();
    setIncomingCall(false);
    setCallStatus('idle');
    deleteDoc(doc(db, 'signaling', roomId));
  };

  const endCall = () => {
    if (callRef.current) callRef.current.close();
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      remoteVideoRef.current.srcObject = null;
    }
    setCallStatus('idle');
    setIncomingCall(false);
    deleteDoc(doc(db, 'signaling', roomId));
  };

  const toggleMute = () => {
    const stream = localVideoRef.current?.srcObject;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = !audioTrack.enabled;
    }
  };

  const toggleVideo = () => {
    const stream = localVideoRef.current?.srcObject;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = !videoTrack.enabled;
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    const messagesRef = collection(db, 'calls', roomId, 'messages');
    await addDoc(messagesRef, {
      text: messageText,
      sender: currentUser.uid,
      senderName: currentUser.name,
      timestamp: Date.now()
    });
    setMessageText('');
  };

  return (
    <div className="video-call-modal">
      <div className="video-call-container">
        <button className="close-call-btn" onClick={onClose}>✕</button>
        
        <div className="video-grid">
          <div className="remote-video">
            <video ref={remoteVideoRef} autoPlay playsInline />
            <span>{targetUser.name}</span>
          </div>
          <div className="local-video">
            <video ref={localVideoRef} autoPlay playsInline muted />
            <span>You</span>
          </div>
        </div>

        <div className="call-controls">
          {callStatus === 'idle' && (
            <button className="call-start-btn" onClick={startCall}>Start Call</button>
          )}
          {callStatus === 'calling' && <p>Calling...</p>}
          {callStatus === 'ringing' && incomingCall && (
            <div>
              <button className="call-answer-btn" onClick={answerCall}>Answer</button>
              <button className="call-reject-btn" onClick={rejectCall}>Reject</button>
            </div>
          )}
          {callStatus === 'connected' && (
            <>
              <button className="call-end-btn" onClick={endCall}>End Call</button>
              <button className="call-mute-btn" onClick={toggleMute}>Mute</button>
              <button className="call-video-btn" onClick={toggleVideo}>Video Off</button>
            </>
          )}
        </div>

        {/* Chat section */}
        <div className="chat-section">
          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`chat-message ${msg.sender === currentUser.uid ? 'sent' : 'received'}`}>
                <strong>{msg.senderName}:</strong> {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendMessage} className="chat-input-form">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="chat-input"
            />
            <button type="submit" className="chat-send-btn">Send</button>
          </form>
        </div>
      </div>

      <style>{`
        .video-call-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.9);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .video-call-container {
          background: #0A0C1A;
          border-radius: 28px;
          width: 90%;
          max-width: 1200px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          padding: 20px;
          position: relative;
        }
        .close-call-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }
        .video-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 20px;
        }
        .remote-video, .local-video {
          flex: 1;
          min-width: 250px;
          background: #000;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
        }
        .remote-video video, .local-video video {
          width: 100%;
          height: auto;
          background: #1A1E3A;
        }
        .remote-video span, .local-video span {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(0,0,0,0.6);
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 12px;
        }
        .call-controls {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .call-start-btn, .call-answer-btn, .call-reject-btn, .call-end-btn, .call-mute-btn, .call-video-btn {
          padding: 12px 24px;
          border-radius: 40px;
          font-weight: bold;
          border: none;
          cursor: pointer;
        }
        .call-start-btn { background: #00CCAA; color: #000; }
        .call-answer-btn { background: #00FF88; color: #000; }
        .call-reject-btn, .call-end-btn { background: #FF0033; color: #fff; }
        .call-mute-btn, .call-video-btn { background: #2A2F55; color: #fff; }
        .chat-section {
          border-top: 1px solid #2A2F55;
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          height: 250px;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          background: rgba(0,0,0,0.2);
          border-radius: 16px;
          margin-bottom: 8px;
        }
        .chat-message {
          margin: 8px 0;
          padding: 8px 12px;
          border-radius: 20px;
          max-width: 80%;
          word-wrap: break-word;
        }
        .chat-message.sent {
          background: #00CCAA;
          color: #000;
          margin-left: auto;
          text-align: right;
        }
        .chat-message.received {
          background: #2A2F55;
          color: #fff;
        }
        .chat-input-form {
          display: flex;
          gap: 8px;
        }
        .chat-input {
          flex: 1;
          padding: 10px;
          border-radius: 40px;
          border: 1px solid #2A2F55;
          background: #1A1E3A;
          color: white;
        }
        .chat-send-btn {
          background: #00CCAA;
          border: none;
          border-radius: 40px;
          padding: 10px 20px;
          font-weight: bold;
          cursor: pointer;
        }
        @media (max-width: 768px) {
          .video-grid { flex-direction: column; }
          .chat-message { max-width: 95%; }
        }
      `}</style>
    </div>
  );
};

export default VideoCall;