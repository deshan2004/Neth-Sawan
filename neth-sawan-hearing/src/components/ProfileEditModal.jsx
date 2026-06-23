// src/components/ProfileEditModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import './ProfileEditModal.css';

const ProfileEditModal = ({ user, isGuest, onClose, onUpdate }) => {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.photoURL || null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const uploadTaskRef = useRef(null);
  const timeoutRef = useRef(null);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (uploadTaskRef.current) uploadTaskRef.current.cancel();
    };
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      // Compress large images (max 1MB)
      compressImage(file).then(compressed => {
        setPhotoFile(compressed);
        setPhotoPreview(URL.createObjectURL(compressed));
        setError('');
      });
    }
  };

  // ── Compress image to max 1MB ──
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 800;
          if (width > height) {
            if (width > MAX_SIZE) {
              height = (height * MAX_SIZE) / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = (width * MAX_SIZE) / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
            resolve(compressedFile);
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      compressImage(file).then(compressed => {
        setPhotoFile(compressed);
        setPhotoPreview(URL.createObjectURL(compressed));
        setError('');
      });
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  // ── Upload with real progress ──
  const uploadPhoto = (file, uid) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `profile_photos/${uid}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTaskRef.current = uploadTask;

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          console.log(`📤 Upload progress: ${progress}%`);
          setUploadProgress(progress);
        },
        (err) => {
          console.error('❌ Upload error:', err);
          reject(err);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('✅ Upload complete, URL:', downloadURL);
            setUploadProgress(100);
            resolve(downloadURL);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);

    // ── Timeout safety (30 seconds) ──
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      console.warn('⚠️ Save timeout – forcing reset');
      setLoading(false);
      setError('Operation timed out. Please try again.');
      if (uploadTaskRef.current) uploadTaskRef.current.cancel();
    }, 30000);

    try {
      // ── GUEST MODE ──
      if (isGuest) {
        const guestProfile = { 
          displayName: displayName.trim(), 
          photoURL: photoPreview,
          privacy 
        };
        localStorage.setItem('neth_sawan_guest_profile', JSON.stringify(guestProfile));
        if (onUpdate) onUpdate(guestProfile);
        clearTimeout(timeoutRef.current);
        setLoading(false);
        onClose();
        return;
      }

      // ── LOGGED‑IN USER ──
      let photoURL = user?.photoURL || null;

      // 1. Upload photo (if selected)
      if (photoFile) {
        try {
          photoURL = await uploadPhoto(photoFile, user.uid);
        } catch (uploadErr) {
          console.error('❌ Upload failed:', uploadErr);
          setError(`Failed to upload: ${uploadErr.message || 'Please try again'}`);
          clearTimeout(timeoutRef.current);
          setLoading(false);
          return;
        }
      } else {
        setUploadProgress(100);
      }

      // 2. Update Auth Profile
      try {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
          photoURL: photoURL,
        });
        console.log('✅ Auth profile updated');
      } catch (authErr) {
        console.warn('Auth update warning:', authErr);
      }

      // 3. Update Firestore
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          displayName: displayName.trim(),
          name: displayName.trim(),
          photoURL: photoURL,
          privacy: privacy,
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ Firestore updated');
      } catch (firestoreErr) {
        console.error('❌ Firestore error:', firestoreErr);
        setError(`Database error: ${firestoreErr.message}`);
        clearTimeout(timeoutRef.current);
        setLoading(false);
        return;
      }

      // 4. Update local state
      const updatedData = { 
        displayName: displayName.trim(), 
        photoURL: photoURL,
        privacy 
      };
      if (onUpdate) onUpdate(updatedData);

      clearTimeout(timeoutRef.current);
      setLoading(false);
      onClose();

    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError(`Error: ${err.message}`);
      clearTimeout(timeoutRef.current);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (uploadTaskRef.current) uploadTaskRef.current.cancel();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setLoading(false);
    onClose();
  };

  return (
    <div className="profile-modal-overlay" onClick={handleCancel}>
      <div className="profile-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="profile-modal-header">
          <h3>✎ Edit Profile</h3>
          <button className="modal-close-btn" onClick={handleCancel}>✕</button>
        </div>

        {/* Body */}
        <div className="profile-modal-body">
          {/* Photo upload */}
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
              {loading && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="upload-progress-bar">
                  <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}
              {loading && uploadProgress === 100 && (
                <div className="upload-progress-bar">
                  <div className="upload-progress-fill" style={{ width: '100%', background: '#00FF88' }}></div>
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

          {/* Error Message */}
          {error && (
            <div style={{ 
              padding: '10px 14px', 
              background: 'rgba(255,51,85,0.15)', 
              borderRadius: '12px',
              color: '#FF6B8A',
              fontSize: '0.85rem',
              marginBottom: '16px',
              wordBreak: 'break-word'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Privacy */}
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
          <button className="btn-cancel" onClick={handleCancel} disabled={loading}>
            {loading ? '⏳ Please wait...' : 'Cancel'}
          </button>
          <button className="btn-save" onClick={handleSave} disabled={loading}>
            {loading ? `💾 Saving ${uploadProgress}%` : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal;