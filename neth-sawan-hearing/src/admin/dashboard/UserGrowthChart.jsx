import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const UserGrowthChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const now = new Date();
      const days = 7;
      const snap = await getDocs(collection(db, 'users'));
      const users = [];
      snap.forEach((doc) => {
        const d = doc.data();
        users.push({ ...d, createdAt: d.createdAt?.toDate() || new Date() });
      });

      // Group by day (last 7 days)
      const groups = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        groups[key] = 0;
      }
      users.forEach((u) => {
        const key = u.createdAt.toISOString().split('T')[0];
        if (groups[key] !== undefined) groups[key]++;
      });
      setData(
        Object.entries(groups).map(([date, count]) => ({ date, count }))
      );
    };
    fetchData();
  }, []);

  return (
    <div style={{ height: 200, width: '100%' }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>📈 New Users (Last 7 Days)</h4>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2F55" />
          <XAxis dataKey="date" stroke="#8899CC" fontSize={10} />
          <YAxis stroke="#8899CC" fontSize={10} />
          <Tooltip
            contentStyle={{
              background: '#0D1128',
              border: '1px solid #2A2F55',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#00DDB3"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UserGrowthChart;