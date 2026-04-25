import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const Auth = ({ onGuestMode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
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
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-ear">👂</span>
            <span className="auth-logo-wave">📡</span>
          </div>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Sign in to Neth-Sawan' : 'Join the hearing assistant community'}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <span className="input-icon">👤</span>
              <input 
                type="text" 
                placeholder="Full Name" 
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
          )}
          <div className="input-group">
            <span className="input-icon">📧</span>
            <input 
              type="email" 
              placeholder="Email Address" 
              required 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
          </div>
          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              required 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
            <button 
              type="button" 
              className="eye-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          
          {error && <div className="error-box">{error}</div>}
          
          <button type="submit" className="auth-btn main" disabled={loading}>
            {loading ? <div className="spinner"></div> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button className="auth-btn guest" onClick={onGuestMode}>
          🚪 Continue as Guest
        </button>

        <button className="auth-switch" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </button>

        <div className="auth-footer">
          <p>Neth-Sawan - Hearing Assistant for Everyone</p>
        </div>
      </div>

      <style>{`
        .auth-wrapper {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: radial-gradient(ellipse at 30% 40%, #0D1128, #04050F);
          position: relative;
          overflow: hidden;
        }
        .auth-wrapper::before {
          content: '';
          position: absolute;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 20% 80%, rgba(0,221,179,0.08), transparent 50%);
          animation: rotate 20s linear infinite;
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .auth-card {
          position: relative;
          width: 100%;
          max-width: 450px;
          background: rgba(13, 17, 40, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 32px;
          padding: 40px 32px;
          border: 1px solid rgba(0, 221, 179, 0.2);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.5s ease;
          z-index: 1;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .auth-logo {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .auth-logo-ear, .auth-logo-wave {
          font-size: 48px;
          animation: pulse 2s ease-in-out infinite;
        }
        .auth-logo-ear { animation-delay: 0s; }
        .auth-logo-wave { animation-delay: 0.3s; }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        .auth-header h2 {
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #00DDB3, #F5C842);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }
        .auth-header p {
          font-size: 13px;
          color: #8899CC;
        }
        .input-group {
          position: relative;
          margin-bottom: 16px;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          color: #5c628a;
        }
        .input-group input {
          width: 100%;
          padding: 14px 16px 14px 44px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          color: #E8EEFF;
          font-size: 14px;
          transition: all 0.2s;
        }
        .input-group input:focus {
          outline: none;
          border-color: #00DDB3;
          box-shadow: 0 0 0 3px rgba(0, 221, 179, 0.1);
        }
        .eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #5c628a;
        }
        .error-box {
          background: rgba(255, 51, 85, 0.15);
          border: 1px solid #FF3355;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 12px;
          color: #FF3355;
          margin-bottom: 20px;
        }
        .auth-btn {
          width: 100%;
          padding: 14px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .auth-btn.main {
          background: linear-gradient(135deg, #00DDB3, #00B899);
          color: #07091A;
          margin-bottom: 16px;
        }
        .auth-btn.main:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 221, 179, 0.3);
        }
        .auth-btn.guest {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #E8EEFF;
        }
        .auth-btn.guest:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: #F5C842;
        }
        .auth-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(0, 0, 0, 0.2);
          border-top-color: #07091A;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .divider {
          margin: 24px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }
        .divider span {
          background: rgba(13, 17, 40, 0.95);
          padding: 0 12px;
          color: #5c628a;
          font-size: 12px;
        }
        .auth-switch {
          background: none;
          border: none;
          color: #00DDB3;
          font-size: 13px;
          cursor: pointer;
          margin-top: 20px;
          width: 100%;
          text-align: center;
        }
        .auth-switch:hover {
          text-decoration: underline;
        }
        .auth-footer {
          margin-top: 28px;
          text-align: center;
          font-size: 11px;
          color: #4A5578;
        }
      `}</style>
    </div>
  );
};

export default Auth;