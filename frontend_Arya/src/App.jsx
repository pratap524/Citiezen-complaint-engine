import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SubmitPage from './pages/SubmitPage';
import TrackPage from './pages/TrackPage';
import InsightsPage from './pages/InsightsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ComplaintsPage from './pages/ComplaintsPage';
import SettingsPage from './pages/SettingsPage';
import { getSession, isLoggedIn } from './utils/auth';

export default function App() {
  const location = useLocation();
  const [authVersion, setAuthVersion] = useState(0);

  const loggedIn = useMemo(() => isLoggedIn(), [authVersion, location.pathname]);
  const session = useMemo(() => getSession(), [authVersion, location.pathname]);
  const isGovernmentUser = Boolean(session && session.accountType === 'government');

  useEffect(() => {
    const onStorageChange = () => setAuthVersion((current) => current + 1);
    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, []);

  return (
    <Routes>
      <Route path="/" element={loggedIn && isGovernmentUser ? <Navigate to="/analytics" replace /> : <HomePage isLoggedIn={loggedIn} />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/submit" element={loggedIn ? (isGovernmentUser ? <Navigate to="/analytics" replace /> : <SubmitPage isLoggedIn={loggedIn} />) : <Navigate to="/login" replace />} />
      <Route path="/track" element={loggedIn ? (isGovernmentUser ? <Navigate to="/analytics" replace /> : <TrackPage isLoggedIn={loggedIn} />) : <Navigate to="/login" replace />} />
      <Route path="/insights" element={<InsightsPage isLoggedIn={loggedIn} />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/complaints" element={<ComplaintsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
