// src/components/Auth.jsx
import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import './Auth.css';

const Auth = ({ onGuestMode, initialMode = 'login', onSuccess, onClose }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        name: res.user.displayName || 'Google User',
        email: res.user.email,
        createdAt: serverTimestamp(),
        role: 'user'
      }, { merge: true });
      try {
        await fetch('http://localhost:5000/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: res.user.uid,
            name: res.user.displayName || 'Google User',
            email: res.user.email,
            role: 'user'
          }),
        });
      } catch (backendErr) { console.warn("Backend sync failed:", backendErr.message); }
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Email/Password submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        if (onSuccess) onSuccess();
      } else {
        const res = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(res.user, { displayName: formData.name });
        await setDoc(doc(db, "users", res.user.uid), {
          uid: res.user.uid,
          name: formData.name,
          email: formData.email,
          createdAt: serverTimestamp(),
          role: 'user'
        });
        try {
          await fetch('http://localhost:5000/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: res.user.uid,
              name: formData.name,
              email: formData.email,
              role: 'user'
            }),
          });
        } catch (backendErr) { console.warn("Backend sync failed:", backendErr.message); }
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      let errorMessage = err.message;
      if (err.code === 'auth/email-already-in-use') errorMessage = 'Email already registered';
      if (err.code === 'auth/invalid-credential') errorMessage = 'Invalid email or password';
      if (err.code === 'auth/weak-password') errorMessage = 'Password should be at least 6 characters';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container-fixed">
      <div className="auth-card-clean">
        {/* ✕ Close button – always visible when onClose is provided */}
        {onClose && (
          <button type="button" className="auth-close-x" onClick={onClose} aria-label="Close">✕</button>
        )}

        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-ear">👂</span>
            <span className="auth-logo-wave">📡</span>
          </div>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Sign in to Neth-Sawan' : 'Join the hearing assistant community'}</p>
        </div>

        <button type="button" className="google-login-btn" onClick={handleGoogleSignIn} disabled={loading}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="google-icon" />
          {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
        </button>

        <div className="divider-line"><span>OR</span></div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <span className="input-icon">👤</span>
              <input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
          )}
          <div className="input-group">
            <span className="input-icon">📧</span>
            <input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input type={showPassword ? "text" : "password"} placeholder="Password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {error && <div className="error-box">{error}</div>}
          <button type="submit" className="auth-btn main" disabled={loading}>
            {loading ? <div className="spinner"></div> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <button className="auth-btn guest" onClick={onGuestMode}>🚪 Continue as Guest</button>

        <button className="auth-switch" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </button>
      </div>

      <style>{`
        .auth-container-fixed {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          box-sizing: border-box;
        }
        .auth-card-clean {
          position: relative;
          width: 100%;
          max-width: 400px;
          background: #0D1128;
          border-radius: 28px;
          padding: 32px 24px;
          border: 1px solid rgba(0, 221, 179, 0.3);
          box-shadow: 0 25px 40px rgba(0, 0, 0, 0.5);
          box-sizing: border-box;
          text-align: center;
        }
        .auth-close-x {
          position: absolute;
          top: 18px;
          right: 18px;
          background: rgba(255,255,255,0.08);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: #8899CC;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .auth-close-x:hover {
          background: rgba(255,51,85,0.2);
          color: #FF3355;
          transform: scale(1.05);
        }
        .auth-header {
          margin-bottom: 24px;
        }
        .auth-logo {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .auth-logo-ear, .auth-logo-wave {
          font-size: 44px;
        }
        .auth-header h2 {
          font-size: 26px;
          font-weight: 700;
          background: linear-gradient(135deg, #00DDB3, #F5C842);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 6px 0;
        }
        .auth-header p {
          font-size: 13px;
          color: #8899CC;
          margin: 0;
        }
        .google-login-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #FFFFFF;
          color: #1F1F1F;
          border: none;
          padding: 12px;
          border-radius: 40px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }
        .google-login-btn:hover {
          background: #F1F3F4;
          transform: translateY(-1px);
        }
        .google-icon {
          width: 18px;
          height: 18px;
        }
        .divider-line {
          margin: 20px 0;
          position: relative;
          text-align: center;
        }
        .divider-line::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: 1px;
          background: rgba(255,255,255,0.1);
          z-index: 1;
        }
        .divider-line span {
          position: relative;
          z-index: 2;
          background: #0D1128;
          padding: 0 10px;
          color: #5C628A;
          font-size: 12px;
          font-weight: 600;
        }
        .input-group {
          position: relative;
          margin-bottom: 14px;
          text-align: left;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          color: #5C628A;
        }
        .input-group input {
          width: 100%;
          padding: 12px 16px 12px 42px;
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 40px;
          color: #E8EEFF;
          font-size: 14px;
          transition: 0.2s;
        }
        .input-group input:focus {
          outline: none;
          border-color: #00DDB3;
          box-shadow: 0 0 0 3px rgba(0,221,179,0.15);
        }
        .eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #5C628A;
        }
        .error-box {
          background: rgba(255,51,85,0.15);
          border: 1px solid #FF3355;
          border-radius: 40px;
          padding: 10px;
          font-size: 12px;
          color: #FF3355;
          margin-bottom: 14px;
        }
        .auth-btn {
          width: 100%;
          padding: 13px;
          border-radius: 40px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
          border: none;
        }
        .auth-btn.main {
          background: linear-gradient(135deg, #00DDB3, #00B899);
          color: #07091A;
          margin-bottom: 12px;
        }
        .auth-btn.main:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0,221,179,0.3);
        }
        .auth-btn.guest {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #D0D8FF;
        }
        .auth-btn.guest:hover {
          background: rgba(255,255,255,0.08);
          border-color: #F5C842;
          color: #F5C842;
        }
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(0,0,0,0.1);
          border-top-color: #07091A;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-switch {
          background: none;
          border: none;
          color: #00DDB3;
          font-size: 13px;
          cursor: pointer;
          margin-top: 16px;
          width: 100%;
          transition: color 0.2s;
        }
        .auth-switch:hover {
          text-decoration: underline;
          color: #F5C842;
        }
      `}</style>
    </div>
  );
};

export default Auth;