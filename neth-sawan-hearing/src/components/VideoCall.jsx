// src/components/VideoCall.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, deleteDoc, setDoc } from 'firebase/firestore';
import Peer from 'peerjs';
import './VideoCall.css';

const VideoCall = ({ targetUser, currentUser, onClose }) => {
  const [callStatus, setCallStatus] = useState('idle');
  const [incomingCall, setIncomingCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef(null);
  const callRef = useRef(null);
  const localStreamRef = useRef(null);
  const durationIntervalRef = useRef(null);

  const roomId = [currentUser.uid, targetUser.uid].sort().join('_');

  // PeerJS setup
  useEffect(() => {
    const peer = new Peer(currentUser.uid, {
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
    });
    peerRef.current = peer;

    peer.on('call', (call) => {
      setIncomingCall(true);
      setCallStatus('ringing');
      callRef.current = call;
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
    });

    return () => {
      cleanStreamTracks();
      if (peerRef.current) peerRef.current.destroy();
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, []);

  // Listen for call offers from Firestore
  useEffect(() => {
    const signalingRef = doc(db, 'signaling', roomId);
    const unsubscribe = onSnapshot(signalingRef, async (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();

      if (data.offer && data.to === currentUser.uid && callStatus === 'idle' && !incomingCall) {
        setIncomingCall(true);
        setCallStatus('ringing');
        if (!callRef.current) {
          const stream = await getLocalStream();
          if (stream) {
            const call = peerRef.current.call(targetUser.uid, stream);
            callRef.current = call;
            setupCallHandlers(call);
          }
        }
      }

      if (data.answer && callRef.current && callRef.current.peer === data.from) {
        callRef.current.answer(data.answer);
      }

      if (data.candidate && callRef.current) {
        callRef.current.addIceCandidate(data.candidate);
      }
    });
    return () => unsubscribe();
  }, [roomId, currentUser.uid, callStatus, incomingCall, targetUser.uid]);

  const getLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      console.error("Failed to get media devices:", err);
      return null;
    }
  };

  const setupCallHandlers = (call) => {
    call.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      setCallStatus('connected');
      setIncomingCall(false);
      startCallTimer();
    });
    call.on('close', () => endCall());
  };

  const startCallTimer = () => {
    setCallDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const cleanStreamTracks = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const startCall = async () => {
    setCallStatus('calling');
    const stream = await getLocalStream();
    if (!stream) { setCallStatus('idle'); return; }

    const call = peerRef.current.call(targetUser.uid, stream);
    callRef.current = call;
    setupCallHandlers(call);

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
    cleanStreamTracks();
    setCallStatus('idle');
    setIncomingCall(false);
    setIsMuted(false);
    setIsVideoOff(false);
    setCallDuration(0);
    deleteDoc(doc(db, 'signaling', roomId));
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-call-modal" role="dialog" aria-modal="true">
      <div className="video-call-container">
        <button className="close-call-btn" onClick={onClose} aria-label="Close">✕</button>

        <div className="section-title">
          📹 Video Call with {targetUser.name}
          {callStatus === 'connected' && (
            <span style={{ fontSize: '14px', color: '#8899CC', display: 'block', marginTop: '4px' }}>
              ⏱ {formatDuration(callDuration)}
            </span>
          )}
        </div>

        <div className={`video-grid ${callStatus}`}>
          <div className="remote-video">
            <video ref={remoteVideoRef} autoPlay playsInline />
            <span>{targetUser.name}</span>
            {callStatus === 'ringing' && (
              <div className="call-status-overlay">
                <span className="ringing-text">🔔 Incoming call...</span>
              </div>
            )}
            {callStatus === 'calling' && (
              <div className="call-status-overlay">
                <span className="calling-text">📞 Calling...</span>
              </div>
            )}
          </div>
          <div className="local-video">
            <video ref={localVideoRef} autoPlay playsInline muted />
            <span>You</span>
          </div>
        </div>

        <div className="call-controls">
          {callStatus === 'idle' && (
            <button className="call-start-btn" onClick={startCall}>📞 Start Call</button>
          )}
          {callStatus === 'ringing' && incomingCall && (
            <div className="incoming-buttons">
              <button className="call-answer-btn" onClick={answerCall}>✅ Answer</button>
              <button className="call-reject-btn" onClick={rejectCall}>❌ Reject</button>
            </div>
          )}
          {callStatus === 'calling' && (
            <p className="call-status-text">📞 Calling... please wait</p>
          )}
          {callStatus === 'connected' && (
            <>
              <button className="call-end-btn" onClick={endCall}>⏹ End Call</button>
              <button className={`call-mute-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute}>
                {isMuted ? '🔇 Unmute' : '🎤 Mute'}
              </button>
              <button className={`call-video-btn ${isVideoOff ? 'active' : ''}`} onClick={toggleVideo}>
                {isVideoOff ? '📷 Video On' : '📷 Video Off'}
              </button>
            </>
          )}
        </div>

        <div className="sign-language-tip">
          <span>🤟</span> සංඥා භාෂාව භාවිතා කරන්න – දෑත් සහ මුහුණ කැමරාවට පෙන්වන්න
        </div>
      </div>
    </div>
  );
};

export default VideoCall;