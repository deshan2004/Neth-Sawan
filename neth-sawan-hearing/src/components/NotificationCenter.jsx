import React from 'react';

const relTime = (ts) => {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000)    return 'Just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString();
};

const NotificationCenter = ({ queue, onMarkRead, onClear }) => {
  const unread = queue.filter(n => !n.read).length;

  return (
    <div className="card">
      <div className="notif-head card-head">
        <div className="card-title">
          <span className="card-title-icon icon-red">🔔</span>
          Notifications
          {unread > 0 && <span className="unread-badge">{unread}</span>}
        </div>
        {queue.length > 0 && (
          <button className="btn btn-outline-red btn-xs" onClick={onClear}>
            Clear All
          </button>
        )}
      </div>

      <div className="notif-list">
        {queue.length === 0 ? (
          <div className="notif-empty">
            <p>No notifications</p>
            <p className="hint">Emergency alerts will appear here.</p>
          </div>
        ) : (
          queue.map(n => (
            <div
              key={n.id}
              className={`notif-item ${!n.read ? 'unread' : ''}`}
              onClick={() => onMarkRead(n.id)}
            >
              <span className="notif-icon">{n.type === 'EMERGENCY' ? '⚠' : 'ℹ'}</span>
              <div className="notif-body">
                <div className="notif-msg">{n.message}</div>
                <div className="notif-meta">
                  {n.soundType && <span>{n.soundType}</span>}
                  {n.volume    && <span>{n.volume}% volume</span>}
                  <span>{relTime(n.timestamp)}</span>
                </div>
                {n.location && (
                  <div className="notif-loc">
                    <a
                      href={`https://www.google.com/maps?q=${n.location.lat},${n.location.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                    >
                      View location
                    </a>
                  </div>
                )}
              </div>
              {!n.read && <div className="unread-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;