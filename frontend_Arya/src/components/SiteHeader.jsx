import React from 'react';
import { Link } from 'react-router-dom';
import { clearSession, getSession } from '../utils/auth';

export default function SiteHeader({
  headerClass,
  activeRoute,
  isLoggedIn,
  showAuthActions = true
}) {
  const session = isLoggedIn ? getSession() : null;
  const isGovernmentUser = Boolean(session && session.accountType === 'government');
  const submitVisible = isLoggedIn && !isGovernmentUser;
  const trackVisible = isLoggedIn && !isGovernmentUser;
  const analyticsVisible = isLoggedIn && isGovernmentUser;
  const complaintsVisible = isLoggedIn && isGovernmentUser;
  const settingsVisible = isLoggedIn && isGovernmentUser;

  const handleLogout = () => {
    clearSession();
    window.location.href = '/';
  };

  return (
    <header className={headerClass} id="home">
      <div className="container nav-wrap">
        <Link className="brand" to="/">
          <span className="brand-mark">CI</span>
          Citizen Intelligence Engine
        </Link>

        <nav className="main-nav" aria-label="Primary">
          <Link className={activeRoute === 'home' ? 'active' : ''} to="/">
            Home
          </Link>
          {submitVisible && (
            <Link className={activeRoute === 'submit' ? 'active' : ''} to="/submit">
              Submit Complaint
            </Link>
          )}
          {trackVisible && (
            <Link className={activeRoute === 'track' ? 'active' : ''} to="/track">
              Track Complaint
            </Link>
          )}
          {analyticsVisible && (
            <Link className={activeRoute === 'analytics' ? 'active' : ''} to="/analytics">
              Analytics
            </Link>
          )}
          {complaintsVisible && (
            <Link className={activeRoute === 'complaints' ? 'active' : ''} to="/complaints">
              Complaints
            </Link>
          )}
          <Link className={activeRoute === 'insights' ? 'active' : ''} to="/insights">
            AI Insights
          </Link>
          {settingsVisible && (
            <Link className={activeRoute === 'settings' ? 'active' : ''} to="/settings">
              Settings
            </Link>
          )}
        </nav>

        {showAuthActions && (
          <div className="auth-actions">
            {!isLoggedIn ? (
              <Link className="login-pill" to="/login">
                Login
              </Link>
            ) : (
              <button className="login-pill" type="button" onClick={handleLogout}>
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
