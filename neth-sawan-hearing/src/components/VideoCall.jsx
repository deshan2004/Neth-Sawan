// src/components/VideoCall.jsx – Video/Audio only
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, deleteDoc, setDoc } from 'firebase/firestore';
import Peer from 'peerjs';

const VideoCall = ({ targetUser, currentUser, onClose }) => {
  const [callStatus, setCallStatus] = useState('idle');
  const [incomingCall, setIncomingCall] = useState(false);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef(null);
  const callRef = useRef(null);
  const roomId = [currentUser.uid, targetUser.uid].sort().join('_');

  useEffect(() => {
    const peer = new Peer(currentUser.uid, {
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
    });
    peerRef.current = peer;

    peer.on('open', () => console.log('Peer ready:', currentUser.uid));
    peer.on('call', (call) => {
      setIncomingCall(true);
      setCallStatus('ringing');
      callRef.current = call;
    });
    peer.on('error', (err) => console.error('Peer error:', err));

    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [currentUser.uid]);

  useEffect(() => {
    const signalingRef = doc(db, 'signaling', roomId);
    const unsubscribe = onSnapshot(signalingRef, async (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();

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

  return (
    <div className="video-call-modal">
      <div className="video-call-container">
        <button className="close-call-btn" onClick={onClose}>✕</button>

        <div className="section-title">📹 Video Call with {targetUser.name}</div>

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
          {callStatus === 'calling' && <p className="call-status-text">Calling...</p>}
          {callStatus === 'ringing' && incomingCall && (
            <div className="incoming-buttons">
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
      </div>

      <style>{`
        .video-call-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.95);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
        }
        .video-call-container {
          background: #0A0C1A;
          border-radius: 28px;
          width: 90%;
          max-width: 800px;
          padding: 20px;
          position: relative;
        }
        .close-call-btn {
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
        }
        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #00DDB3;
          text-align: center;
          margin-bottom: 20px;
        }
        .video-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }
        .remote-video, .local-video {
          background: #000;
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          aspect-ratio: 16 / 9;
        }
        .remote-video video, .local-video video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .remote-video span, .local-video span {
          position: absolute;
          bottom: 8px;
          left: 8px;
          background: rgba(0,0,0,0.6);
          padding: 4px 10px;
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
          padding: 10px 20px;
          border-radius: 40px;
          font-weight: bold;
          border: none;
          cursor: pointer;
          font-size: 14px;
        }
        .call-start-btn { background: #00CCAA; color: #000; }
        .call-answer-btn { background: #00FF88; color: #000; }
        .call-reject-btn, .call-end-btn { background: #FF0033; color: #fff; }
        .call-mute-btn, .call-video-btn { background: #2A2F55; color: #fff; }
        .call-status-text { color: #00DDB3; font-weight: 500; }
        @media (max-width: 768px) {
          .video-call-container { width: 95%; padding: 16px; }
          .call-start-btn, .call-answer-btn, .call-reject-btn, .call-end-btn, .call-mute-btn, .call-video-btn {
            padding: 8px 16px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoCall;