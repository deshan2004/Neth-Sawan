import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const AlertTrendChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const snap = await getDocs(
        query(collection(db, 'emergency_alerts'), orderBy('timestamp', 'desc'), limit(100))
      );
      const alerts = [];
      snap.forEach((doc) => {
        const d = doc.data();
        alerts.push({ ...d, timestamp: d.timestamp?.toDate() || new Date() });
      });

      // Group by day and type
      const groups = {};
      alerts.forEach((a) => {
        const day = a.timestamp.toISOString().split('T')[0];
        if (!groups[day]) groups[day] = { SOS: 0, FALL: 0, ROAD: 0, OTHER: 0 };
        const type = a.alertType || 'OTHER';
        if (type.includes('SOS')) groups[day].SOS++;
        else if (type.includes('FALL')) groups[day].FALL++;
        else if (type.includes('ROAD') || type.includes('HORN')) groups[day].ROAD++;
        else groups[day].OTHER++;
      });

      const chartData = Object.entries(groups)
        .map(([date, types]) => ({ date, ...types }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setData(chartData);
    };
    fetchAlerts();
  }, []);

  return (
    <div style={{ height: 200, width: '100%' }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>🚨 Alert Types (Last 100)</h4>
      <ResponsiveContainer>
        <BarChart data={data}>
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
          <Legend wrapperStyle={{ fontSize: '10px', color: '#8899CC' }} />
          <Bar dataKey="SOS" stackId="a" fill="#FF3355" />
          <Bar dataKey="FALL" stackId="a" fill="#FF8800" />
          <Bar dataKey="ROAD" stackId="a" fill="#4488FF" />
          <Bar dataKey="OTHER" stackId="a" fill="#AAAAAA" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AlertTrendChart;