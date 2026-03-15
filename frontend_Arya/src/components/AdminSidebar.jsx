import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminSidebar({ activeRoute }) {
  return (
    <aside className="sidebar">
      <Link className="brand" to="/">
        <span className="brand-mark">CI</span>
        <span>
          Citizen Intelligence
          <small>Engine</small>
        </span>
      </Link>

      <nav className="side-nav" aria-label="Admin">
        <Link className={activeRoute === 'complaints' ? 'active' : ''} to="/complaints">Complaints</Link>
        <Link className={activeRoute === 'analytics' ? 'active' : ''} to="/analytics">Analytics</Link>
        <Link className={activeRoute === 'insights' ? 'active' : ''} to="/insights">AI Insights</Link>
      </nav>
    </aside>
  );
}
