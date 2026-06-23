// src/admin/dashboard/SoundHeatmap.jsx
import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SoundHeatmap = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchSounds = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const hourCount = Array(24).fill(0);
      for (const userDoc of usersSnap.docs) {
        const soundsSnap = await getDocs(collection(db, 'users', userDoc.id, 'sound_history'));
        soundsSnap.forEach(doc => {
          const ts = doc.data().timestamp?.toDate?.();
          if (ts) {
            const hour = ts.getHours();
            hourCount[hour] += 1;
          }
        });
      }
      const chartData = hourCount.map((count, hour) => ({
        hour: `${hour}:00`,
        count,
      }));
      setData(chartData);
    };
    fetchSounds();
  }, []);

  return (
    <div style={{ height: 180, width: '100%' }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>🔊 Sound Events by Hour</h4>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2F55" />
          <XAxis dataKey="hour" stroke="#8899CC" fontSize={9} tick={{ angle: -45, textAnchor: 'end' }} height={40} />
          <YAxis stroke="#8899CC" fontSize={10} />
          <Tooltip
            contentStyle={{
              background: '#0D1128',
              border: '1px solid #2A2F55',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Bar dataKey="count" fill="#00DDB3" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SoundHeatmap;