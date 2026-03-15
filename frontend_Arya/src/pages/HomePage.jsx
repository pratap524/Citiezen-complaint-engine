import React from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import MainFooter from '../components/MainFooter';
import usePageStyle from '../utils/usePageStyle';

export default function HomePage({ isLoggedIn }) {
  usePageStyle('/styles.css');

  useEffect(() => {
    const revealItems = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -24px 0px'
      }
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="floating-shape shape-left"></div>
      <div className="floating-shape shape-right"></div>

      <SiteHeader headerClass="site-header" activeRoute="home" isLoggedIn={isLoggedIn} />

      <main>
        <section className="hero">
          <div className="container hero-inner">
            <p className="hero-tag reveal">AI Governance Platform</p>
            <h1 className="reveal delay-1">Transform Citizen Complaints into AI-Powered Governance Intelligence</h1>
            <p className="hero-sub reveal delay-2">
              Automatically classify complaints, assign urgency scores, detect recurring civic issues,
              and help city authorities respond faster using AI.
            </p>
            <div className="hero-actions reveal delay-3">
              <Link className="btn btn-primary" to="/submit">Submit Complaint</Link>
              <a className="btn btn-secondary" href="#dashboard">Explore Dashboard</a>
            </div>
          </div>
        </section>

        <section className="section section-features" id="platform">
          <div className="container">
            <h2 className="section-title reveal">AI-Powered Governance</h2>
            <p className="section-subtitle reveal delay-1">Advanced intelligence for smarter city management</p>

            <div className="feature-grid">
              <article className="feature-card reveal">
                <div className="feature-icon icon-violet">A</div>
                <h3>AI Complaint Classification</h3>
                <p>Automatically categorize and route complaints to the right departments using multilingual language processing.</p>
              </article>

              <article className="feature-card reveal delay-1">
                <div className="feature-icon icon-cyan">U</div>
                <h3>Urgency Detection Engine</h3>
                <p>Intelligent prioritization system that identifies critical issues requiring immediate attention.</p>
              </article>

              <article className="feature-card reveal delay-2">
                <div className="feature-icon icon-green">C</div>
                <h3>Cluster Problem Detection</h3>
                <p>Identify hotspots and clusters of related issues across different areas for proactive resolution.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section section-process" id="process">
          <div className="container">
            <h2 className="section-title reveal">How the AI Works</h2>
            <p className="section-subtitle reveal delay-1">Seamless complaint processing in 4 intelligent steps</p>

            <ol className="process-track">
              <li className="process-step reveal">
                <span className="step-dot dot-blue">1</span>
                <h3>Step 1</h3>
                <p>Citizen submits complaint</p>
              </li>
              <li className="process-step reveal delay-1">
                <span className="step-dot dot-teal">2</span>
                <h3>Step 2</h3>
                <p>AI analyzes complaint text</p>
              </li>
              <li className="process-step reveal delay-2">
                <span className="step-dot dot-green">3</span>
                <h3>Step 3</h3>
                <p>System assigns department and urgency</p>
              </li>
              <li className="process-step reveal delay-3">
                <span className="step-dot dot-pink">4</span>
                <h3>Step 4</h3>
                <p>Authorities receive issue tracker</p>
              </li>
            </ol>
          </div>
        </section>

        <section className="section section-dashboard" id="dashboard">
          <div className="container">
            <h2 className="section-title reveal">Smart Governance Dashboard</h2>
            <p className="section-subtitle reveal delay-1">Real-time insights for data-driven decisions</p>

            <div className="dashboard-shell reveal delay-2">
              <div className="dash-topbar"></div>

              <div className="dash-grid">
                <article className="dash-card donut-card">
                  <h4>Incident Flow</h4>
                  <div className="donut"></div>
                  <div className="sparkline">
                    <span></span><span></span><span></span><span></span><span></span><span></span>
                  </div>
                </article>

                <article className="dash-card cluster-card">
                  <h4>Complaint Clusters</h4>
                  <div className="cluster-field">
                    <span style={{ '--x': '14%', '--y': '34%', '--s': '8px' }}></span>
                    <span style={{ '--x': '21%', '--y': '26%', '--s': '11px' }}></span>
                    <span style={{ '--x': '28%', '--y': '42%', '--s': '9px' }}></span>
                    <span style={{ '--x': '39%', '--y': '38%', '--s': '13px' }}></span>
                    <span style={{ '--x': '45%', '--y': '25%', '--s': '8px' }}></span>
                    <span style={{ '--x': '55%', '--y': '31%', '--s': '12px' }}></span>
                    <span style={{ '--x': '62%', '--y': '47%', '--s': '10px' }}></span>
                    <span style={{ '--x': '69%', '--y': '28%', '--s': '8px' }}></span>
                    <span style={{ '--x': '75%', '--y': '43%', '--s': '11px' }}></span>
                    <span style={{ '--x': '83%', '--y': '34%', '--s': '9px' }}></span>
                    <span style={{ '--x': '49%', '--y': '56%', '--s': '12px' }}></span>
                    <span style={{ '--x': '33%', '--y': '56%', '--s': '8px' }}></span>
                  </div>
                </article>

                <article className="dash-card bars-card">
                  <h4>Department Trend</h4>
                  <div className="bar-chart">
                    <span></span><span></span><span></span><span></span><span></span>
                  </div>
                </article>

                <article className="dash-card map-card">
                  <h4>Hotspot Map</h4>
                  <div className="map-surface"></div>
                </article>

                <article className="dash-card region-card">
                  <h4>District Reach</h4>
                  <div className="region-grid">
                    <span></span><span></span><span></span><span></span><span></span><span></span>
                  </div>
                </article>

                <article className="dash-card trend-card">
                  <h4>Response Health</h4>
                  <div className="bar-chart alt">
                    <span></span><span></span><span></span><span></span><span></span>
                  </div>
                </article>
              </div>

              <div className="dash-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Urgency Ranking</th>
                      <th>Department</th>
                      <th>Cases</th>
                      <th>Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>1</td><td>Water Supply</td><td>128</td><td>79%</td></tr>
                    <tr><td>2</td><td>Road Damage</td><td>98</td><td>72%</td></tr>
                    <tr><td>3</td><td>Waste Management</td><td>84</td><td>68%</td></tr>
                    <tr><td>4</td><td>Street Lighting</td><td>63</td><td>81%</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-insights">
          <div className="container">
            <h2 className="section-title reveal">Live City Insights</h2>

            <div className="stats-grid">
              <article className="stat-card reveal"><h3>12,847</h3><p>Complaints Processed</p></article>
              <article className="stat-card reveal delay-1"><h3>24</h3><p>Departments Connected</p></article>
              <article className="stat-card reveal delay-2"><h3>2.4 days</h3><p>Average Resolution Time</p></article>
              <article className="stat-card reveal delay-3"><h3>156</h3><p>Active Wards Monitored</p></article>
            </div>
          </div>
        </section>

        <section className="section section-cta">
          <div className="container cta-shell reveal">
            <h2>Build Smarter Cities with AI</h2>
            <p>Join the future of civic governance today.</p>
            <div className="hero-actions">
              <Link className="btn btn-light" to="/submit">Submit Complaint</Link>
              <a className="btn btn-outline-light" href="#dashboard">View City Analytics</a>
            </div>
          </div>
        </section>
      </main>

      <MainFooter />
    </>
  );
}
