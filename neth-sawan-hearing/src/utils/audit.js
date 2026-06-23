// src/utils/audit.js
import { db, auth } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export const logAdminAction = async (action, details) => {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, 'admin_logs'), {
      action,
      details,
      adminUid: user?.uid || 'system',
      adminEmail: user?.email || 'system',
      adminName: user?.displayName || 'System',
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
};