// src/components/ProfileEditModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './ProfileEditModal.css';

const ProfileEditModal = ({ user, isGuest, onClose, onUpdate }) => {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.photoURL || null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const [privacy, setPrivacy] = useState({
    shareLocation: true,
    shareEmergencyAlerts: true,
    showOnlineStatus: true,
  });

  // Load existing data for logged‑in users
  useEffect(() => {
    if (user && !isGuest) {
      const loadData = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setDisplayName(data.displayName || data.name || user.displayName || '');
            setPhotoPreview(data.photoURL || user.photoURL || null);
            if (data.privacy) setPrivacy(prev => ({ ...prev, ...data.privacy }));
          }
        } catch (err) {
          console.error('Failed to load user data:', err);
        }
      };
      loadData();
    }
  }, [user, isGuest]);

  // Guest mode: load from localStorage
  useEffect(() => {
    if (isGuest) {
      const saved = localStorage.getItem('neth_sawan_guest_profile');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setDisplayName(data.displayName || 'Guest User');
          setPhotoPreview(data.photoURL || null);
        } catch {}
      }
    }
  }, [isGuest]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleSave = async () => {
    if (isGuest) {
      const guestProfile = { displayName, photoURL: photoPreview, privacy };
      localStorage.setItem('neth_sawan_guest_profile', JSON.stringify(guestProfile));
      if (onUpdate) onUpdate(guestProfile);
      onClose();
      return;
    }

    if (!user) return;
    setLoading(true);
    setUploadProgress(0);

    try {
      let photoURL = user.photoURL || null;

      if (photoFile) {
        const storageRef = ref(storage, `profile_photos/${user.uid}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
        setUploadProgress(100);
      }

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: displayName,
        photoURL: photoURL,
      });

      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName,
        photoURL,
        privacy,
        updatedAt: new Date().toISOString(),
      });

      if (onUpdate) onUpdate({ displayName, photoURL, privacy });
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="profile-modal-header">
          <h3>✎ Edit Profile</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="profile-modal-body">
          {/* Photo upload – click or drag */}
          <div
            className="profile-photo-section"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="profile-photo-preview">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile preview" />
              ) : (
                <div className="profile-photo-placeholder">
                  {displayName?.charAt(0)?.toUpperCase() || '📷'}
                </div>
              )}
              <div className="photo-edit-badge">📷 Change</div>
              {loading && (
                <div className="upload-progress-bar">
                  <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <p className="photo-hint">Drop an image here or click to browse</p>
          </div>

          {/* Display Name */}
          <div className="profile-field">
            <label>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          {/* Privacy (optional but useful) */}
          <div className="privacy-section">
            <h4>Privacy Settings</h4>
            <div className="privacy-option">
              <label>
                <input
                  type="checkbox"
                  checked={privacy.shareLocation}
                  onChange={e => setPrivacy({ ...privacy, shareLocation: e.target.checked })}
                />
                Share live location during emergencies
              </label>
            </div>
            <div className="privacy-option">
              <label>
                <input
                  type="checkbox"
                  checked={privacy.shareEmergencyAlerts}
                  onChange={e => setPrivacy({ ...privacy, shareEmergencyAlerts: e.target.checked })}
                />
                Share emergency alerts with contacts
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="profile-modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal;