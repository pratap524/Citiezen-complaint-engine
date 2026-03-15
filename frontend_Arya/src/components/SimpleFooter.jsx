import React from 'react';
import { Link } from 'react-router-dom';

export default function SimpleFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand" to="/">
            <span className="brand-mark">CI</span>
            Citizen Intelligence Engine
          </Link>
          <p>AI-powered civic governance platform.</p>
        </div>

        <div>
          <h3>Quick Links</h3>
          <Link to="/submit">Submit Complaint</Link>
          <Link to="/track">Track Complaint</Link>
          <Link to="/insights">AI Insights</Link>
        </div>

        <div>
          <h3>Support</h3>
          <a href="#">Help Center</a>
          <a href="#">Contact</a>
          <a href="#">FAQs</a>
        </div>

        <div>
          <h3>Connect</h3>
          <div className="social-row">
            <a href="#" aria-label="Twitter">T</a>
            <a href="#" aria-label="Facebook">F</a>
            <a href="#" aria-label="LinkedIn">L</a>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>&copy; 2025 Citizen Intelligence Engine. All rights reserved.</p>
      </div>
    </footer>
  );
}
