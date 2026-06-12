// src/components/VideoCall.jsx
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc, deleteDoc, setDoc, collection } from 'firebase/firestore';
import Peer from 'peerjs';

const VideoCall = ({ targetUser, currentUser, onClose }) => {
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, inCall, ended
  const [incomingCall, setIncomingCall] = useState(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef(null);
  const callRef = useRef(null);
  const connectionId = useRef(null);

  // Generate a unique room ID for the two users
  const roomId = [currentUser.uid, targetUser.uid].sort().join('_');

  // Initialize Peer (each user gets a unique ID based on their uid)
  useEffect(() => {
    const peer = new Peer(currentUser.uid, {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });
    peerRef.current = peer;

    peer.on('open', (id) => {
      console.log('PeerJS ready, id:', id);
    });

    peer.on('call', (call) => {
      // Incoming call
      setIncomingCall({
        from: call.peer,
        call: call,
      });
    });

    peer.on('error', (err) => console.error('Peer error:', err));

    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [currentUser.uid]);

  // Listen for signaling messages in Firestore
  useEffect(() => {
    const signalingRef = doc(db, 'signaling', roomId);
    const unsubscribe = onSnapshot(signalingRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      if (data.offer && !callRef.current && callStatus === 'idle' && data.to === currentUser.uid) {
        // Received an offer from the other user
        setCallStatus('incoming');
        setIncomingCall({ from: data.from, offer: data.offer });
      }
      if (data.answer && callRef.current && callRef.current.peer === data.from) {
        callRef.current.answer(data.answer);
      }
      if (data.candidate && callRef.current) {
        callRef.current.addIceCandidate(data.candidate);
      }
    });
    return () => unsubscribe();
  }, [roomId, currentUser.uid, callStatus]);

  // Send signaling message via Firestore
  const sendSignalingMessage = async (type, payload) => {
    const signalingRef = doc(db, 'signaling', roomId);
    await setDoc(signalingRef, {
      [type]: payload,
      from: currentUser.uid,
      to: targetUser.uid,
      timestamp: Date.now(),
    }, { merge: true });
  };

  // Start a call
  const startCall = async () => {
    setCallStatus('calling');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    
    const call = peerRef.current.call(targetUser.uid, stream);
    callRef.current = call;
    
    call.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      setCallStatus('inCall');
    });
    call.on('close', () => {
      endCall();
    });
    
    // Send offer via Firestore
    const offer = call.peerConnection.localDescription;
    await sendSignalingMessage('offer', offer);
  };

  // Answer an incoming call
  const answerCall = async () => {
    if (!incomingCall) return;
    setCallStatus('inCall');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    
    const call = incomingCall.call;
    call.answer(stream);
    callRef.current = call;
    
    call.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    });
    call.on('close', () => endCall());
    
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (incomingCall && incomingCall.call) {
      incomingCall.call.close();
    }
    setIncomingCall(null);
    setCallStatus('idle');
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
    setCallStatus('ended');
    setTimeout(() => setCallStatus('idle'), 1000);
    // Clean up signaling document
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

  return (
    <div className="video-call-modal">
      <div className="video-call-container">
        <button className="close-call-btn" onClick={onClose}>✕</button>
        
        <div className="video-grid">
          <div className="remote-video">
            <video ref={remoteVideoRef} autoPlay playsInline muted={false} />
            <span>Remote user</span>
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
          {callStatus === 'incoming' && (
            <div>
              <button className="call-answer-btn" onClick={answerCall}>Answer</button>
              <button className="call-reject-btn" onClick={rejectCall}>Reject</button>
            </div>
          )}
          {callStatus === 'inCall' && (
            <>
              <button className="call-end-btn" onClick={endCall}>End Call</button>
              <button className="call-mute-btn" onClick={toggleMute}>Mute</button>
              <button className="call-video-btn" onClick={toggleVideo}>Video Off</button>
            </>
          )}
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
          max-width: 1000px;
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
          justify-content: center;
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
        @media (max-width: 768px) {
          .video-grid { flex-direction: column; }
        }
      `}</style>
    </div>
  );
};

export default VideoCall;