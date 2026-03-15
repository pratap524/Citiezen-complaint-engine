import React from 'react';
import { useMemo, useState } from 'react';
import SiteHeader from '../components/SiteHeader';
import SimpleFooter from '../components/SimpleFooter';
import usePageStyle from '../utils/usePageStyle';
import { getComplaints } from '../utils/api';

const statusProgress = {
  Pending: 20,
  'In Progress': 65,
  Resolved: 100,
  Closed: 100
};

const formatDate = (value) => {
  const dateObject = new Date(value);

  if (Number.isNaN(dateObject.getTime())) {
    return 'N/A';
  }

  return dateObject.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function TrackPage({ isLoggedIn }) {
  usePageStyle('/track.css');

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const onTrack = async (event) => {
    event.preventDefault();

    if (!query.trim()) {
      setError('Please enter a complaint ID.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const complaints = await getComplaints();
      const normalizedQuery = query.trim().toLowerCase();

      const found = complaints.find((complaint) => {
        const complaintId = String(complaint._id || '').toLowerCase();
        return complaintId === normalizedQuery || complaintId.includes(normalizedQuery);
      });

      if (!found) {
        setSelectedComplaint(null);
        setError('No complaint found for this ID.');
      } else {
        setSelectedComplaint(found);
      }
    } catch (requestError) {
      setSelectedComplaint(null);
      setError(requestError.message || 'Unable to fetch complaints right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStatus = selectedComplaint?.status || 'Pending';
  const progressValue = statusProgress[currentStatus] || 20;
  const headline = selectedComplaint?.originalText ? selectedComplaint.originalText.slice(0, 72) : 'Enter complaint ID to track your complaint';
  const complaintId = selectedComplaint?._id || 'N/A';
  const complaintDate = selectedComplaint?.createdAt ? formatDate(selectedComplaint.createdAt) : 'N/A';
  const complaintDepartment = selectedComplaint?.department || 'N/A';
  const urgencyScore = selectedComplaint?.urgencyScore || 0;
  const rawPriorityScore = typeof selectedComplaint?.urgencyScore === 'number'
    ? selectedComplaint.urgencyScore
    : selectedComplaint?.priorityScore;
  const priorityScore = Math.max(0, Math.min(10, Math.round(rawPriorityScore)));

  const resolvedEta = useMemo(() => {
    if (!selectedComplaint?.createdAt || !selectedComplaint?.predictedResolutionDays) {
      return 'N/A';
    }

    const sourceDate = new Date(selectedComplaint.createdAt);
    sourceDate.setDate(sourceDate.getDate() + selectedComplaint.predictedResolutionDays);
    return sourceDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [selectedComplaint]);

  return (
    <>
      <div className="floating-shape shape-left"></div>
      <div className="floating-shape shape-right"></div>

      <SiteHeader headerClass="track-header" activeRoute="track" isLoggedIn={isLoggedIn} />

      <main className="track-main">
        <section className="track-intro">
          <h1>Track Your Complaint</h1>
          <p>Monitor real-time status and updates of your civic complaint using AI-powered governance intelligence.</p>
        </section>

        <section className="container panel search-panel">
          <h2>Enter Complaint ID or Phone Number</h2>
          <form className="track-form" onSubmit={onTrack} noValidate>
            <input type="text" placeholder="Paste complaint ID" aria-label="Complaint ID" value={query} onChange={(event) => setQuery(event.target.value)} />
            <button type="submit" disabled={isLoading}>{isLoading ? 'Tracking...' : 'Track Complaint'}</button>
          </form>
          {error && <p className="track-error">{error}</p>}
        </section>

        <section className="container panel issue-panel">
          <div className="issue-left">
            <h2>{headline}</h2>
            <div className="issue-tags"><span className="tag tag-alert">{currentStatus}</span><span className="tag">{complaintDepartment}</span></div>
          </div>
          <div className="issue-meta">
            <div><p className="meta-label">Complaint ID</p><p className="meta-value">{complaintId}</p></div>
            <div><p className="meta-label">Location</p><p className="meta-value">Mapped coordinates</p></div>
            <div><p className="meta-label">Date</p><p className="meta-value">{complaintDate}</p></div>
          </div>
        </section>

        <section className="container content-grid">
          <div className="left-column">
            <article className="panel timeline-panel">
              <h2>Complaint Status Timeline</h2>
              <ol className="timeline">
                <li className="step done"><span className="dot">1</span><div className="step-content"><h3>Complaint Received</h3><p>Your complaint has been successfully registered in the system</p><time dateTime="2025-06-14T08:30">Jun 14, 2025 - 08:30 AM</time></div></li>
                <li className="step done"><span className="dot">2</span><div className="step-content"><h3>AI Classification Complete</h3><p>AI analyzed and categorized your complaint</p><time dateTime="2025-06-14T08:32">Jun 14, 2025 - 08:32 AM</time></div></li>
                <li className="step done"><span className="dot">3</span><div className="step-content"><h3>Assigned to Department</h3><p>Forwarded to {complaintDepartment}</p><time dateTime={selectedComplaint?.updatedAt || 'N/A'}>{selectedComplaint?.updatedAt ? formatDate(selectedComplaint.updatedAt) : 'Awaiting update'}</time></div></li>
                <li className="step active"><span className="dot">4</span><div className="step-content"><h3>{currentStatus}</h3><p>Department is actively working on resolution</p><time dateTime={selectedComplaint?.updatedAt || 'N/A'}>{selectedComplaint?.updatedAt ? formatDate(selectedComplaint.updatedAt) : 'Awaiting update'}</time><div className="progress-row"><span>Progress</span><strong>{progressValue}%</strong></div><div className="progress-track"><span style={{ width: `${progressValue}%` }}></span></div></div></li>
                <li className="step pending"><span className="dot">5</span><div className="step-content"><h3>Resolved</h3><p>Complaint will be marked as resolved</p></div></li>
              </ol>
            </article>

            <article className="panel location-panel">
              <h2>Complaint Location</h2>
              <div className="map-card">
                <span className="map-badge">Main Avenue &amp; 5th Street</span>
                <img className="map-visual" src="/assets/location-map.svg" alt="Map of Main Avenue and 5th Street" />
              </div>
              <div className="location-foot"><h3>Main Avenue &amp; 5th Street</h3><p>Downtown District - Sector 12</p></div>
            </article>
          </div>

          <aside className="right-column">
            <article className="panel stat-card"><h3>Assigned Department</h3><h4>{complaintDepartment}</h4><dl><div><dt>Status</dt><dd>{currentStatus}</dd></div><div><dt>Sentiment</dt><dd>{selectedComplaint?.sentiment || 'N/A'}</dd></div><div><dt>Created At</dt><dd>{complaintDate}</dd></div></dl></article>
            <article className="panel stat-card estimate-card"><h3>Estimated Resolution</h3><p className="tiny">Estimated Resolution Time</p><p className="estimate-value">{selectedComplaint?.predictedResolutionDays ? `${selectedComplaint.predictedResolutionDays} Days` : 'N/A'}</p><p className="tiny">Expected Completion</p><p className="date-value">{resolvedEta}</p></article>
            <article className="panel stat-card urgency-card"><h3>AI Urgency Score</h3><p className="tiny center">Urgency Score</p><p className="urgency-value">{urgencyScore} / 10</p><ul className="risk-list"><li><span>Priority Score</span><strong>{priorityScore} / 10</strong></li><li><span>Alert Level</span><strong>{priorityScore >= 8 ? 'High' : priorityScore >= 5 ? 'Medium' : 'Low'}</strong></li><li><span>Community Concern</span><strong>{selectedComplaint?.sentiment || 'Neutral'}</strong></li><li><span>Response Priority</span><strong>{currentStatus === 'Resolved' || currentStatus === 'Closed' ? 'Completed' : 'Active'}</strong></li></ul></article>
          </aside>
        </section>

        <section className="container panel assist-panel">
          <h2>Need Assistance?</h2>
          <div className="assist-grid"><a href="#">Contact Support</a><a href="#">Download Report</a><a href="#">Share Status</a></div>
        </section>
      </main>

      <SimpleFooter />
    </>
  );
}
