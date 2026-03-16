import React, { useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const TRANSITION_MS = 520;

export default function RouteTransitionLoader() {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const [isVisible, setIsVisible] = useState(false);

  useLayoutEffect(() => {
    if (previousPathRef.current === location.pathname) {
      return undefined;
    }

    previousPathRef.current = location.pathname;
    setIsVisible(true);

    const timer = window.setTimeout(() => {
      setIsVisible(false);
    }, TRANSITION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [location.pathname]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      aria-label="Loading next page"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'grid',
        placeItems: 'center',
        background:
          'radial-gradient(circle at 80% 10%, rgba(155, 88, 255, 0.28), transparent 34%), radial-gradient(circle at 16% 78%, rgba(66, 124, 255, 0.24), transparent 40%), linear-gradient(130deg, #040a1e 18%, #050c21 52%, #050913 100%)'
      }}
    >
      <div
        style={{
          display: 'grid',
          justifyItems: 'center',
          gap: '0.75rem',
          fontFamily: 'Outfit, Segoe UI, sans-serif',
          color: '#eaf1ff'
        }}
      >
        <div
          style={{
            width: '2.6rem',
            height: '2.6rem',
            borderRadius: '0.75rem',
            display: 'grid',
            placeItems: 'center',
            fontSize: '0.86rem',
            fontWeight: 700,
            color: '#fff',
            background: 'linear-gradient(145deg, #4b68ff, #cc64ff)'
          }}
        >
          CI
        </div>
        <div style={{ fontSize: '0.98rem', fontWeight: 600, letterSpacing: '0.01em' }}>
          Loading next page...
        </div>
        <div
          aria-hidden="true"
          style={{
            width: '1.6rem',
            height: '1.6rem',
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.22)',
            borderTopColor: '#8e78ff',
            animation: 'route-loader-spin 0.8s linear infinite'
          }}
        />
      </div>
      <style>
        {`@keyframes route-loader-spin { to { transform: rotate(360deg); } }`}
      </style>
    </div>
  );
}
