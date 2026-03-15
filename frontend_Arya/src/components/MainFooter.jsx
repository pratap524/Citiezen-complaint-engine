import React from 'react';
import { Link } from 'react-router-dom';

export default function MainFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand" to="/">
            <span className="brand-mark">CI</span>
            Citizen Intelligence Engine
          </Link>
          <p>Transforming civic governance through artificial intelligence and smarter city solutions.</p>
        </div>

        <div>
          <h3>Platform</h3>
          <Link to="/submit">Submit Complains</Link>
          <Link to="/track">Track Complaint</Link>
          <Link to="/insights">AI Insights</Link>
        </div>

        <div>
          <h3>Company</h3>
          <a href="#">About</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Contact</a>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>&copy; {new Date().getFullYear()} Citizen Intelligence Engine. All rights reserved.</p>
      </div>
    </footer>
  );
}
