import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession } from '../utils/auth';

export default function AdminTopbar({ searchPlaceholder, alertCount, adminName, adminAvatar, onSearchChange }) {
  const navigate = useNavigate();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!popoverRef.current) {
        return;
      }

      if (!popoverRef.current.contains(event.target)) {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearSession();
    setIsPopoverOpen(false);
    navigate('/');
  };

  return (
    <header className="topbar">
      <label className="search-wrap">
        <span aria-hidden="true">S</span>
        <input type="text" placeholder={searchPlaceholder} onChange={onSearchChange} />
      </label>

      <div className="profile-wrap">
        <button className="alert-btn" type="button" aria-label="Notifications">
          N
          <em>{alertCount}</em>
        </button>

        <div className="profile-card" ref={popoverRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="avatar"
            onClick={() => setIsPopoverOpen((current) => !current)}
            aria-label="Open account menu"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            {adminAvatar}
          </button>
          <div>
            <p>{adminName}</p>
            <small>City Administrator</small>
          </div>

          {isPopoverOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                minWidth: '180px',
                borderRadius: '12px',
                border: '1px solid rgba(157, 179, 235, 0.24)',
                background: 'linear-gradient(155deg, rgba(24, 33, 63, 0.96), rgba(17, 22, 44, 0.98))',
                boxShadow: '0 12px 30px rgba(4, 10, 28, 0.35)',
                padding: '8px',
                zIndex: 500
              }}
            >
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: '#dbe8ff',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  fontSize: '0.92rem'
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
