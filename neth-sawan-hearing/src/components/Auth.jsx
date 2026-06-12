import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import './Auth.css';

const Auth = ({ onGuestMode, initialMode = 'login', onSuccess, onClose }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(''); setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      await setDoc(doc(db, "users", res.user.uid), { uid: res.user.uid, name: res.user.displayName || 'Google User', email: res.user.email, createdAt: serverTimestamp(), role: 'user' }, { merge: true });
      try { await fetch('http://localhost:5000/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid: res.user.uid, name: res.user.displayName || 'Google User', email: res.user.email, role: 'user' }) }); } catch(e) {}
      if (onSuccess) onSuccess();
    } catch (err) { if (err.code !== 'auth/popup-closed-by-user') setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        if (onSuccess) onSuccess();
      } else {
        const res = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(res.user, { displayName: formData.name });
        await setDoc(doc(db, "users", res.user.uid), { uid: res.user.uid, name: formData.name, email: formData.email, createdAt: serverTimestamp(), role: 'user' });
        try { await fetch('http://localhost:5000/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid: res.user.uid, name: formData.name, email: formData.email, role: 'user' }) }); } catch(e) {}
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      let errorMessage = err.message;
      if (err.code === 'auth/email-already-in-use') errorMessage = 'Email already registered';
      if (err.code === 'auth/invalid-credential') errorMessage = 'Invalid email or password';
      if (err.code === 'auth/weak-password') errorMessage = 'Password should be at least 6 characters';
      setError(errorMessage);
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container-fixed">
      <div className="auth-card-clean">
        {onClose && <button className="auth-close-x" onClick={onClose}>✕</button>}
        <div className="auth-header"><div className="auth-logo"><span className="auth-logo-ear">👂</span><span className="auth-logo-wave">📡</span></div><h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2><p>{isLogin ? 'Sign in to Neth-Sawan' : 'Join the hearing assistant community'}</p></div>
        <button className="google-login-btn" onClick={handleGoogleSignIn} disabled={loading}><img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="google-icon" />{isLogin ? 'Sign in with Google' : 'Sign up with Google'}</button>
        <div className="divider-line"><span>OR</span></div>
        <form onSubmit={handleSubmit}>
          {!isLogin && (<div className="input-group"><span className="input-icon">👤</span><input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>)}
          <div className="input-group"><span className="input-icon">📧</span><input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          <div className="input-group"><span className="input-icon">🔒</span><input type={showPassword ? "text" : "password"} placeholder="Password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /><button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>{showPassword ? '👁️' : '👁️‍🗨️'}</button></div>
          {error && <div className="error-box">{error}</div>}
          <button type="submit" className="auth-btn main" disabled={loading}>{loading ? <div className="spinner"></div> : (isLogin ? 'Sign In' : 'Create Account')}</button>
        </form>
        <button className="auth-btn guest" onClick={onGuestMode}>🚪 Continue as Guest</button>
        <button className="auth-switch" onClick={() => setIsLogin(!isLogin)}>{isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}</button>
      </div>
    </div>
  );
};
export default Auth;