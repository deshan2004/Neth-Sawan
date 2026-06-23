// src/admin/emergencies/AlertMap.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Fix for Vite: import marker images directly ───
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Create a custom default icon
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Set it as the default for all markers
L.Marker.prototype.options.icon = defaultIcon;

const AlertMap = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      const snap = await getDocs(collection(db, 'emergency_alerts'));
      const list = [];
      snap.forEach(doc => {
        const data = doc.data();
        // Check for location data (supports both { lat, lng } and { latitude, longitude })
        let lat, lng;
        if (data.location && typeof data.location === 'object') {
          lat = data.location.latitude || data.location.lat;
          lng = data.location.longitude || data.location.lng;
        }
        // Also check for top‑level lat/lng fields
        if (!lat && data.lat) lat = data.lat;
        if (!lng && data.lng) lng = data.lng;

        if (lat && lng) {
          list.push({
            id: doc.id,
            lat,
            lng,
            type: data.alertType || 'Emergency',
            time: data.timestamp?.toDate?.()?.toLocaleString() || 'Just now',
            status: data.status || 'NEW',
          });
        }
      });
      setAlerts(list);
      setLoading(false);
    };
    fetchAlerts();
  }, []);

  if (loading) return <div className="admin-loading-cell">Loading map...</div>;

  return (
    <div style={{ height: 400, width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
      <MapContainer
        center={[7.8731, 80.7718]} // Sri Lanka
        zoom={7}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {alerts.map((alert) => (
          <Marker key={alert.id} position={[alert.lat, alert.lng]}>
            <Popup>
              <strong>{alert.type}</strong>
              <br />
              Status: {alert.status}
              <br />
              {alert.time}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default AlertMap;