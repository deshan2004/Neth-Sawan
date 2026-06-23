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
  const [retryCount, setRetryCount] = useState(0);
  const fileInputRef = useRef(null);
  const uploadTaskRef = useRef(null);
  const timeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const isUploadingRef = useRef(false);
  const uploadStartedRef = useRef(false);

  const [privacy, setPrivacy] = useState({
    shareLocation: true,
    shareEmergencyAlerts: true,
    showOnlineStatus: true,
  });

  useEffect(() => {
    isMountedRef.current = true;
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

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // 🔥 DO NOT cancel upload on unmount – let it finish
    };
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      compressImage(file).then(compressed => {
        if (isMountedRef.current) {
          setPhotoFile(compressed);
          setPhotoPreview(URL.createObjectURL(compressed));
          setError('');
          setRetryCount(0);
        }
      });
    }
  };

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
        if (isMountedRef.current) {
          setPhotoFile(compressed);
          setPhotoPreview(URL.createObjectURL(compressed));
          setError('');
          setRetryCount(0);
        }
      });
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  // ── Upload with real progress ──
  const uploadPhoto = (file, uid) => {
    return new Promise((resolve, reject) => {
      try {
        const storageRef = ref(storage, `profile_photos/${uid}`);
        console.log('📁 Storage path:', `profile_photos/${uid}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTaskRef.current = uploadTask;
        isUploadingRef.current = true;
        uploadStartedRef.current = true;

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            console.log(`📤 Upload progress: ${progress}%`);
            if (isMountedRef.current) {
              setUploadProgress(progress);
            }
          },
          (err) => {
            console.error('❌ Upload error:', err.code, err.message);
            isUploadingRef.current = false;
            let errorMsg = err.message || 'Upload failed.';
            if (err.code === 'storage/canceled') {
              errorMsg = 'Upload was cancelled.';
            } else if (err.code === 'storage/unauthorized' || err.code === 'storage/permission-denied') {
              errorMsg = 'Permission denied. Check Firebase Storage rules.';
            } else if (err.code === 'storage/retry-limit-exceeded') {
              errorMsg = 'Network error. Please check your connection.';
            }
            reject(new Error(errorMsg));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('✅ Upload complete, URL:', downloadURL);
              isUploadingRef.current = false;
              if (isMountedRef.current) {
                setUploadProgress(100);
              }
              resolve(downloadURL);
            } catch (err) {
              console.error('❌ Failed to get download URL:', err);
              isUploadingRef.current = false;
              reject(new Error('Failed to get download URL.'));
            }
          }
        );
      } catch (err) {
        console.error('❌ Upload setup error:', err);
        reject(new Error('Failed to start upload.'));
      }
    });
  };

  const handleSave = async () => {
    const currentUser = auth.currentUser;
    console.log('🔍 isGuest:', isGuest);
    console.log('🔍 currentUser:', currentUser?.uid || 'No user');
    console.log('🔍 photoFile:', photoFile ? `Yes (${photoFile.size} bytes)` : 'No');

    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);
    isUploadingRef.current = false;
    uploadStartedRef.current = false;

    // ── 120 second timeout (increased) ──
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      console.warn('⚠️ Save timeout');
      // Only cancel if upload is still in progress AND progress < 100
      if (isUploadingRef.current && uploadProgress < 100) {
        console.warn('⏹️ Cancelling upload due to timeout');
        if (uploadTaskRef.current) {
          uploadTaskRef.current.cancel();
        }
        isUploadingRef.current = false;
      }
      if (isMountedRef.current) {
        setLoading(false);
        setError('Upload timed out. Please try again with a smaller image.');
      }
    }, 120000); // 2 minutes

    try {
      // ── GUEST MODE ──
      if (isGuest) {
        console.log('👤 Guest mode – saving to localStorage');
        const guestProfile = { 
          displayName: displayName.trim(), 
          photoURL: photoPreview,
          privacy 
        };
        localStorage.setItem('neth_sawan_guest_profile', JSON.stringify(guestProfile));
        if (onUpdate) onUpdate(guestProfile);
        clearTimeout(timeoutRef.current);
        if (isMountedRef.current) setLoading(false);
        onClose();
        return;
      }

      // ── LOGGED‑IN USER ──
      if (!currentUser) {
        console.error('❌ No authenticated user!');
        setError('You must be signed in to save.');
        clearTimeout(timeoutRef.current);
        if (isMountedRef.current) setLoading(false);
        return;
      }

      console.log('👤 Logged-in user – saving to Firebase');
      let photoURL = user?.photoURL || null;

      // 1. Upload photo to Storage
      if (photoFile) {
        try {
          photoURL = await uploadPhoto(photoFile, currentUser.uid);
        } catch (uploadErr) {
          console.error('❌ Upload failed:', uploadErr);
          if (isMountedRef.current) {
            setError(`Upload failed: ${uploadErr.message}`);
          }
          clearTimeout(timeoutRef.current);
          if (isMountedRef.current) setLoading(false);
          return;
        }
      } else {
        if (isMountedRef.current) setUploadProgress(100);
      }

      // 2. Update Firebase Auth Profile
      try {
        await updateProfile(currentUser, {
          displayName: displayName.trim(),
          photoURL: photoURL,
        });
        console.log('✅ Auth profile updated');
      } catch (authErr) {
        console.warn('Auth update warning:', authErr);
        // Continue – we still want to save to Firestore
      }

      // 3. Update Firestore
      try {
        const userRef = doc(db, 'users', currentUser.uid);
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
        if (isMountedRef.current) {
          setError(`Database error: ${firestoreErr.message}`);
        }
        clearTimeout(timeoutRef.current);
        if (isMountedRef.current) setLoading(false);
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
      if (isMountedRef.current) setLoading(false);
      onClose();

    } catch (err) {
      console.error('❌ Unexpected error:', err);
      if (isMountedRef.current) {
        setError(`Error: ${err.message}`);
        setLoading(false);
      }
    }
  };

  // ── Cancel handler – DISABLED during upload ──
  const handleCancel = () => {
    if (loading) {
      console.log('⏳ Upload in progress. Cannot cancel.');
      return;
    }
    if (uploadTaskRef.current && isUploadingRef.current) {
      uploadTaskRef.current.cancel();
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      handleCancel();
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError('');
    handleSave();
  };

  return (
    <div className="profile-modal-overlay" onClick={handleOverlayClick}>
      <div className="profile-modal-container" onClick={e => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h3>✎ Edit Profile</h3>
          <button 
            className="modal-close-btn" 
            onClick={handleCancel}
            disabled={loading}
            style={{ opacity: loading ? 0.4 : 1 }}
          >
            ✕
          </button>
        </div>

        <div className="profile-modal-body">
          <div
            className="profile-photo-section"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => !loading && fileInputRef.current?.click()}
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
              disabled={loading}
            />
            <p className="photo-hint">
              {loading ? `⏳ Uploading ${uploadProgress}%...` : 'Drop an image here or click to browse'}
            </p>
          </div>

          <div className="profile-field">
            <label>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              disabled={loading}
            />
          </div>

          {error && (
            <div style={{ 
              padding: '10px 14px', 
              background: 'rgba(255,51,85,0.15)', 
              borderRadius: '12px',
              color: '#FF6B8A',
              fontSize: '0.85rem',
              marginBottom: '12px',
              wordBreak: 'break-word'
            }}>
              ⚠️ {error}
              {retryCount < 2 && (
                <button 
                  onClick={handleRetry}
                  style={{
                    marginLeft: '12px',
                    padding: '4px 16px',
                    borderRadius: '30px',
                    background: '#00DDB3',
                    color: '#000',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          )}

          <div className="privacy-section">
            <h4>Privacy Settings</h4>
            <div className="privacy-option">
              <label>
                <input
                  type="checkbox"
                  checked={privacy.shareLocation}
                  onChange={e => setPrivacy({ ...privacy, shareLocation: e.target.checked })}
                  disabled={loading}
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
                  disabled={loading}
                />
                Share emergency alerts with contacts
              </label>
            </div>
          </div>
        </div>

        <div className="profile-modal-footer">
          <button 
            className="btn-cancel" 
            onClick={handleCancel}
            disabled={loading}
            style={{ opacity: loading ? 0.4 : 1 }}
          >
            {loading ? '⏳ Please wait...' : 'Cancel'}
          </button>
          <button 
            className="btn-save" 
            onClick={handleSave}
            disabled={loading}
            style={{ opacity: loading ? 0.4 : 1 }}
          >
            {loading ? `💾 ${uploadProgress}%` : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal;