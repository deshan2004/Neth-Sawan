// src/components/ProfileEditModal.jsx
import React, { useState, useRef } from 'react';
import { auth, db, storage } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ProfileEditModal = ({ user, isGuest, onClose, onUpdate }) => {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.photoURL || null);
  const [privacy, setPrivacy] = useState({
    shareLocation: true,
    shareEmergencyAlerts: true,
    showOnlineStatus: true,
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Load privacy settings from Firestore if user exists
  React.useEffect(() => {
    if (user && !isGuest) {
      const loadPrivacy = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().privacy) {
          setPrivacy(prev => ({ ...prev, ...userDoc.data().privacy }));
        }
      };
      loadPrivacy();
    }
  }, [user, isGuest]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (isGuest) {
      // Guest mode: save to localStorage only
      const guestProfile = {
        displayName,
        photoURL: photoPreview,
        privacy,
      };
      localStorage.setItem('neth_sawan_guest_profile', JSON.stringify(guestProfile));
      if (onUpdate) onUpdate(guestProfile);
      onClose();
      return;
    }

    setLoading(true);
    try {
      let photoURL = user?.photoURL;
      // Upload new photo if selected
      if (photoFile) {
        const storageRef = ref(storage, `profile_photos/${user.uid}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: displayName,
        photoURL: photoURL,
      });

      // Update Firestore user document
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
        <div className="profile-modal-header">
          <h3>Edit Profile</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="profile-modal-body">
          {/* Profile Photo */}
          <div className="profile-photo-section">
            <div className="profile-photo-preview" onClick={() => fileInputRef.current?.click()}>
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" />
              ) : (
                <div className="profile-photo-placeholder">
                  {displayName?.charAt(0)?.toUpperCase() || '👤'}
                </div>
              )}
              <div className="photo-edit-icon">📷</div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <p className="photo-hint">Click to change profile picture</p>
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

          {/* Privacy Settings */}
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
                Allow emergency alerts to be shared with contacts
              </label>
            </div>
            <div className="privacy-option">
              <label>
                <input
                  type="checkbox"
                  checked={privacy.showOnlineStatus}
                  onChange={e => setPrivacy({ ...privacy, showOnlineStatus: e.target.checked })}
                />
                Show online status
              </label>
            </div>
          </div>
        </div>

        <div className="profile-modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <style>{`
        .profile-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          z-index: 2100;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .profile-modal-container {
          background: #0D1128;
          border-radius: 28px;
          width: 90%;
          max-width: 450px;
          max-height: 85vh;
          overflow-y: auto;
          border: 1px solid rgba(0,221,179,0.3);
        }
        .profile-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #2A2F55;
        }
        .profile-modal-header h3 {
          font-size: 20px;
          color: #00DDB3;
        }
        .modal-close-btn {
          background: none;
          border: none;
          color: #8899CC;
          font-size: 24px;
          cursor: pointer;
        }
        .profile-modal-body {
          padding: 20px;
        }
        .profile-photo-section {
          text-align: center;
          margin-bottom: 24px;
        }
        .profile-photo-preview {
          width: 100px;
          height: 100px;
          margin: 0 auto;
          border-radius: 50%;
          background: linear-gradient(135deg, #00CCAA, #008877);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .profile-photo-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .profile-photo-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: bold;
          color: #000;
        }
        .photo-edit-icon {
          position: absolute;
          bottom: 0;
          right: 0;
          background: #00DDB3;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        .photo-hint {
          font-size: 11px;
          color: #8899CC;
          margin-top: 8px;
        }
        .profile-field {
          margin-bottom: 20px;
        }
        .profile-field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #D0D8FF;
          margin-bottom: 6px;
        }
        .profile-field input {
          width: 100%;
          padding: 12px;
          background: #1A1E3A;
          border: 1px solid #2A2F55;
          border-radius: 16px;
          color: white;
        }
        .privacy-section h4 {
          font-size: 16px;
          margin-bottom: 12px;
          color: #F5C842;
        }
        .privacy-option {
          margin: 12px 0;
        }
        .privacy-option label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }
        .privacy-option input {
          width: 18px;
          height: 18px;
        }
        .profile-modal-footer {
          display: flex;
          gap: 12px;
          padding: 20px;
          border-top: 1px solid #2A2F55;
        }
        .btn-cancel, .btn-save {
          flex: 1;
          padding: 12px;
          border-radius: 40px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-cancel {
          background: rgba(255,255,255,0.05);
          border: 1px solid #FF3355;
          color: #FF3355;
        }
        .btn-save {
          background: linear-gradient(135deg, #00DDB3, #00B899);
          border: none;
          color: #000;
        }
        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ProfileEditModal;