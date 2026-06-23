// src/admin/sounds/SoundHistory.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import '../admin.css';

const SoundHistory = () => {
  const [sounds, setSounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [totalSounds, setTotalSounds] = useState(0);

  useEffect(() => {
    const loadSounds = async () => {
      setLoading(true);
      try {
        // Get all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        let allSounds = [];
        
        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          const soundSnapshot = await getDocs(
            query(collection(db, 'users', userId, 'sound_history'), orderBy('timestamp', 'desc'), limit(20))
          );
          soundSnapshot.forEach(doc => {
            const data = doc.data();
            allSounds.push({
              id: doc.id,
              userId: userId,
              ...data,
              timestamp: data.timestamp?.toDate?.() || new Date(),
            });
          });
        }

        // Sort by timestamp
        allSounds.sort((a, b) => b.timestamp - a.timestamp);
        setSounds(allSounds.slice(0, 50));
        setTotalSounds(allSounds.length);
      } catch (err) {
        console.error('Sound fetch error:', err);
      }
      setLoading(false);
    };

    loadSounds();
  }, []);

  const filteredSounds = sounds.filter(sound => {
    if (filter === 'all') return true;
    return sound.type?.toLowerCase().includes(filter.toLowerCase());
  });

  const getSoundIcon = (type) => {
    if (type?.includes('Alarm')) return '🔔';
    if (type?.includes('Vehicle')) return '🚗';
    if (type?.includes('Phone')) return '📞';
    if (type?.includes('Voice')) return '👤';
    if (type?.includes('Loud')) return '💥';
    return '🔊';
  };

  return (
    <div className="admin-sounds">
      <div className="admin-page-header">
        <h2>🔊 Sound History</h2>
        <div className="admin-page-actions">
          <span className="admin-total-sounds">{totalSounds} events</span>
        </div>
      </div>

      <div className="admin-filters">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="admin-filter-select">
          <option value="all">All Sounds</option>
          <option value="alarm">Alarm</option>
          <option value="vehicle">Vehicle</option>
          <option value="phone">Phone</option>
          <option value="voice">Voice</option>
          <option value="loud">Loud</option>
        </select>
      </div>

      <div className="admin-sounds-list">
        {loading ? (
          <div className="admin-loading-cell">Loading sounds...</div>
        ) : filteredSounds.length === 0 ? (
          <div className="admin-empty-cell">No sounds found</div>
        ) : (
          filteredSounds.map((sound) => (
            <div key={sound.id} className="admin-sound-item">
              <span className="admin-sound-icon">{getSoundIcon(sound.type)}</span>
              <div className="admin-sound-info">
                <span className="admin-sound-type">{sound.type || 'Sound Detected'}</span>
                <span className="admin-sound-meta">
                  <span className="admin-sound-vol">{Math.round(sound.volume * 100)}%</span>
                  <span className="admin-sound-user">User: {sound.userId?.slice(0, 8)}...</span>
                </span>
              </div>
              <span className="admin-sound-time">
                {sound.timestamp?.toLocaleString?.() || 'Just now'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SoundHistory;