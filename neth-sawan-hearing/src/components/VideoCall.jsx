// src/components/VideoCall.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, deleteDoc, setDoc } from 'firebase/firestore';
import * as tmImage from '@teachablemachine/image'; // 🌟 TensorFlow සහ Teachable Machine ඉම්පෝර්ට් කරන ලදී
import Peer from 'peerjs';
import './VideoCall.css';

// ⚠️ ඔයාගේ Teachable Machine ලින්ක් එක මෙතනට දෙන්න!
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/YOUR_MODEL_LINK_HERE/"; 

const SINHALA_CLASS_MAP = {
  "Ayubowan": "ආයුබෝවන්! 🙏",
  "Sthuthi": "ස්තුතියි! ❤️",
  "Ow": "ඔව් 👍",
  "Nae": "නැහැ 👎",
  "Udavvak": "මට උදව් කරන්න! 🆘",
  "Vathura": "මට වතුර ටිකක් ඕනේ... 💧",
  "Kama": "මට බඩගිනියි, කෑම ඕනේ... 🍽️"
};

const VideoCall = ({ targetUser, currentUser, onClose }) => {
  const [callStatus, setCallStatus] = useState('idle');
  const [incomingCall, setIncomingCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  // 🌟 AI Translation සඳහා අලුතින් එකතු කරන ලද State ටික
  const [aiStatusText, setAiStatusText] = useState('පද්ධතිය සූදානම්... 🧠');
  const [isAiScanning, setIsAiScanning] = useState(false);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef(null);
  const callRef = useRef(null);
  const localStreamRef = useRef(null);
  const modelRef = useRef(null);
  const maxPredictionsRef = useRef(0);
  const aiIntervalRef = useRef(null);

  const roomId = [currentUser.uid, targetUser.uid].sort().join('_');

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

    return () => {
      cleanStreamTracks();
      if (peerRef.current) peerRef.current.destroy();
      if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
    };
  }, []);

  // 🌟 AI මොඩලය Load කර කැමරාව ස්කෑන් කිරීම ආරම්භ කිරීම
  const startAiScanner = async () => {
    if (!localVideoRef.current || !localVideoRef.current.srcObject) {
      setAiStatusText("කැමරාව ක්‍රියාත්මක වන තුරු මඳක් රැඳී සිටින්න...");
      return;
    }
    
    setIsAiScanning(true);
    setAiStatusText("AI මොඩලය ලෝඩ් වෙමින් පවතී... 🧠");

    try {
      const modelPath = MODEL_URL + "model.json";
      const metadataPath = MODEL_URL + "metadata.json";
      
      modelRef.current = await tmImage.load(modelPath, metadataPath);
      maxPredictionsRef.current = modelRef.current.getTotalClasses();
      
      setAiStatusText("සජීවී AI සංඥා පරිවර්තනය ක්‍රියාත්මකයි! 🤟");

      // දේශීය කැමරා වීඩියෝව ස්කෑන් කර පරීක්ෂා කරන ලූප් එක
      aiIntervalRef.current = setInterval(async () => {
        if (modelRef.current && localVideoRef.current) {
          const prediction = await modelRef.current.predict(localVideoRef.current);
          
          let highestPrediction = { className: "", probability: 0 };
          for (let i = 0; i < maxPredictionsRef.current; i++) {
            if (prediction[i].probability > highestPrediction.probability) {
              highestPrediction = prediction[i];
            }
          }

          if (highestPrediction.probability > 0.85 && highestPrediction.className !== "Neutral") {
            const sinhalaText = SINHALA_CLASS_MAP[highestPrediction.className] || highestPrediction.className;
            setAiStatusText(sinhalaText);
          }
        }
      }, 1000); // තත්පරයකට වරක් පරික්ෂා කරයි

    } catch (err) {
      console.error("VideoCall AI Error:", err);
      setAiStatusText("මොඩලය ලෝඩ් කිරීමේ දෝෂයක්. Link එක පරීක්ෂා කරන්න.");
      setIsAiScanning(false);
    }
  };

  const stopAiScanner = () => {
    if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
    setIsAiScanning(false);
    setAiStatusText("පද්ධතිය සූදානම්... 🧠");
  };

  const cleanStreamTracks = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    stopAiScanner();
  };

  const startCall = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream;
        localVideoRef.current.srcObject = stream;
        setCallStatus('calling');

        const call = peerRef.current.call(targetUser.uid, stream);
        callRef.current = call;

        call.on('stream', remoteStream => {
          remoteVideoRef.current.srcObject = remoteStream;
        });
      })
      .catch(err => console.error('Get media error:', err));
  };

  const answerCall = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream;
        localVideoRef.current.srcObject = stream;
        setCallStatus('connected');

        callRef.current.answer(stream);
        callRef.current.on('stream', remoteStream => {
          remoteVideoRef.current.srcObject = remoteStream;
        });

        setDoc(doc(db, 'calls', roomId), { answered: true }, { merge: true });
      })
      .catch(err => console.error('Answer call error:', err));
  };

  const rejectCall = () => {
    setCallStatus('rejected');
    setDoc(doc(db, 'calls', roomId), { rejected: true }, { merge: true });
    onClose();
  };

  const endCall = () => {
    cleanStreamTracks();
    deleteDoc(doc(db, 'calls', roomId));
    setCallStatus('ended');
    onClose();
  };

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="video-call-modal">
      <div className="video-call-container">
        <button className="close-call-btn" onClick={endCall}>✕</button>
        
        <h2>📹 Video Call with {targetUser.name}</h2>

        <div className="video-frames">
          <div className="remote-video">
            <video ref={remoteVideoRef} autoPlay playsInline />
            <span>{targetUser.name}</span>
          </div>
          <div className="local-video">
            <video ref={localVideoRef} autoPlay playsInline muted />
            <span>You</span>
          </div>
        </div>

        {/* 🌟 VIDEO CALL AI TRANSLATION HUD */}
        {callStatus === 'connected' && (
          <div style={{ background: '#07091A', padding: '15px', borderRadius: '15px', margin: '15px 0', border: '1px solid #00DDB3' }}>
            <h4 style={{ color: '#00DDB3', margin: '0 0 10px 0', textAlign: 'center' }}>🤟 Live Sign Language Translator (AI)</h4>
            <div style={{ textAlign: 'center', marginBottom: '10px', color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
              {aiStatusText}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              {!isAiScanning ? (
                <button onClick={startAiScanner} style={{ background: '#00DDB3', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
                  🔍 මගේ කැමරාව ස්කෑන් කරන්න
                </button>
              ) : (
                <button onClick={stopAiScanner} style={{ background: '#FF3355', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
                  🛑 ස්කෑන් කිරීම නවත්වන්න
                </button>
              )}
            </div>
          </div>
        )}

        <div className="call-controls">
          {callStatus === 'idle' && (
            <button className="call-start-btn" onClick={startCall}>Start Call</button>
          )}
          {callStatus === 'calling' && <p className="call-status-text">Calling... 🤙</p>}
          {callStatus === 'ringing' && incomingCall && (
            <div className="incoming-buttons">
              <button className="call-answer-btn" onClick={answerCall}>Answer</button>
              <button className="call-reject-btn" onClick={rejectCall}>Reject</button>
            </div>
          )}
          {callStatus === 'connected' && (
            <>
              <button className="call-end-btn" onClick={endCall}>End Call</button>
              <button className={`call-mute-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute}>
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button className={`call-video-btn ${isVideoOff ? 'active' : ''}`} onClick={toggleVideo}>
                {isVideoOff ? 'Video On' : 'Video Off'}
              </button>
            </>
          )}
        </div>

        <div className="sign-language-tip">
          <span>🤟</span> Use sign language – keep hands visible and face camera
        </div>
      </div>
    </div>
  );
};

export default VideoCall;