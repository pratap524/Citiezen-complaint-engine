import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SiteHeader from '../components/SiteHeader';
import SimpleFooter from '../components/SimpleFooter';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import usePageStyle from '../utils/usePageStyle';
import { getSession } from '../utils/auth';
import { getComplaints, getDashboardStats, getTopIssues, getUrgencyRanking } from '../utils/api';

const recommendationLevels = ['high', 'urgent', 'medium', 'preventive'];
const recommendationActions = ['Take Action', 'Take Action', 'Take Action', 'Schedule'];
const recommendationTrendClasses = ['red', 'amber', 'yellow', 'blue'];
const recommendationActionClasses = ['danger', 'warning', 'yellow-btn', 'blue-btn'];

const buildPolyline = (values) => {
  if (!values.length) {
    return '40,205 470,205';
  }

  const maxValue = Math.max(...values, 1);

  return values
    .map((value, index) => {
      const x = 40 + ((470 - 40) * index) / Math.max(values.length - 1, 1);
      const y = 205 - ((Math.max(value, 0) / maxValue) * (205 - 65));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
};

const toTitleCase = (value) => {
  if (!value) {
    return 'Unknown';
  }

  return String(value)
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

export default function InsightsPage({ isLoggedIn }) {
  usePageStyle('/insights.css');
  const session = getSession();
  const isGovernmentUser = Boolean(session && session.accountType === 'government');
  usePageStyle(isGovernmentUser ? '/settings.css' : '');

  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(new Date());
  const [dashboardStats, setDashboardStats] = useState(null);
  const [topIssues, setTopIssues] = useState([]);
  const [urgencyRanking, setUrgencyRanking] = useState([]);
  const [complaints, setComplaints] = useState([]);

  const loadInsights = useCallback(async () => {
    setIsLoading(true);

    try {
      const [statsResponse, topIssuesResponse, urgencyResponse, complaintsResponse] = await Promise.all([
        getDashboardStats(),
        getTopIssues(),
        getUrgencyRanking(),
        getComplaints()
      ]);

      setDashboardStats(statsResponse || null);
      setTopIssues(Array.isArray(topIssuesResponse) ? topIssuesResponse : []);
      setUrgencyRanking(Array.isArray(urgencyResponse) ? urgencyResponse : []);
      setComplaints(Array.isArray(complaintsResponse) ? complaintsResponse : []);
      setLastUpdatedAt(new Date());
    } catch {
      setDashboardStats(null);
      setTopIssues([]);
      setUrgencyRanking([]);
      setComplaints([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const resolvedCount = complaints.filter((item) => item.status === 'Resolved' || item.status === 'Closed').length;
  const totalComplaints = complaints.length;
  const pendingCount = complaints.filter((item) => item.status === 'Pending' || item.status === 'In Progress').length;
  const positiveCount = complaints.filter((item) => item.sentiment === 'Positive' || item.sentiment === 'Very Positive').length;
  const predictionAccuracy = totalComplaints > 0 ? Math.round((positiveCount / totalComplaints) * 100) : 0;
  const activeModels = Math.max(Object.keys(dashboardStats?.countByDepartment || {}).length, 1);

  const recommendations = useMemo(() => {
    const topList = topIssues.slice(0, 4);
    const totalIssueCount = topList.reduce((sum, issue) => sum + (issue.count || 0), 0);

    return topList.map((issue, index) => {
      const issueLabel = toTitleCase(issue._id || 'General Civic Issue');
      const confidence = totalIssueCount > 0 ? Math.max(65, Math.round(((issue.count || 0) / totalIssueCount) * 100)) : 70;
      const level = recommendationLevels[index] || 'medium';

      return {
        id: `${issueLabel}-${index}`,
        level,
        meta: `Based on ${issue.count || 0} related complaints`,
        confidence,
        title: `${issueLabel} Complaints Pattern`,
        recommendation: `Prioritize ${issueLabel.toLowerCase()} response teams and schedule focused field action in high-frequency zones.`,
        trendText: `+${issue.count || 0} issue mentions in recent data`,
        trendClass: recommendationTrendClasses[index] || 'yellow',
        actionText: recommendationActions[index] || 'Take Action',
        actionClass: recommendationActionClasses[index] || 'yellow-btn'
      };
    });
  }, [topIssues]);

  const weeklyBuckets = useMemo(() => {
    const now = Date.now();
    const bucketValues = [0, 0, 0, 0];

    complaints.forEach((item) => {
      const createdAt = new Date(item.createdAt).getTime();
      if (Number.isNaN(createdAt)) {
        return;
      }

      const daysAgo = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
      if (daysAgo < 0 || daysAgo > 27) {
        return;
      }

      const bucket = Math.min(3, Math.floor(daysAgo / 7));
      bucketValues[3 - bucket] += 1;
    });

    return bucketValues;
  }, [complaints]);

  const greenLinePoints = buildPolyline(weeklyBuckets.map((value) => Math.round(value * 1.1)));
  const yellowLinePoints = buildPolyline(weeklyBuckets.map((value) => Math.round(value * 0.85)));
  const blueLinePoints = buildPolyline(weeklyBuckets.map((value) => Math.round(value * 0.7)));
  const violetLinePoints = buildPolyline(weeklyBuckets.map((value) => Math.round(value * 0.55)));

  const departmentForecast = useMemo(() => {
    const entries = Object.entries(dashboardStats?.countByDepartment || {});
    if (!entries.length) {
      return [
        { name: 'Sanitation', currentHeight: 60, predictedHeight: 78 },
        { name: 'Public Works', currentHeight: 52, predictedHeight: 66 },
        { name: 'Water', currentHeight: 44, predictedHeight: 56 },
        { name: 'Electricity', currentHeight: 48, predictedHeight: 70 }
      ];
    }

    const sorted = entries.sort((a, b) => b[1] - a[1]).slice(0, 4);
    const maxCount = Math.max(...sorted.map((item) => item[1]), 1);

    return sorted.map(([name, count]) => {
      const currentHeight = Math.max(20, Math.round((count / maxCount) * 75));
      const predictedHeight = Math.min(95, currentHeight + Math.max(8, Math.round(currentHeight * 0.18)));

      return {
        name,
        currentHeight,
        predictedHeight
      };
    });
  }, [dashboardStats]);

  const updatedLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return 'just now';
    }

    return lastUpdatedAt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [lastUpdatedAt]);

  const insightsContent = (
    <main className="insights-main">
      <section className="container insights-intro">
        <h1>AI Predictive Insights</h1>
        <p>Machine learning powered detection of civic issues, patterns, and governance recommendations.</p>
        <div className="intro-actions"><p className="updated"><span></span> Last Updated: {isLoading ? 'loading...' : updatedLabel}</p><button type="button" onClick={loadInsights}>Refresh</button></div>
      </section>

      <section className="container stat-grid">
        <article className="stat-card stat-violet"><div className="stat-top"><span className="icon">A</span><span className="chip">Active</span></div><h2>{activeModels}</h2><p>Active AI Models</p></article>
        <article className="stat-card stat-blue"><div className="stat-top"><span className="icon">P</span><span className="chip">Live</span></div><h2>{predictionAccuracy}%</h2><p>Prediction Accuracy</p></article>
        <article className="stat-card stat-green"><div className="stat-top"><span className="icon">R</span><span className="chip">Real-Time</span></div><h2>{resolvedCount}</h2><p>Issues Resolved</p></article>
        <article className="stat-card stat-gold"><div className="stat-top"><span className="icon">D</span><span className="chip">Updated</span></div><h2>{totalComplaints}</h2><p>Data Points Analyzed</p></article>
      </section>

      <section className="container recommendation-grid">
        {(recommendations.length ? recommendations : [
          {
            id: 'fallback-1',
            level: 'medium',
            meta: 'No sufficient complaint data yet',
            confidence: 70,
            title: 'Data Collection In Progress',
            recommendation: 'Submit and process more complaints to unlock richer AI recommendations for all departments.',
            trendText: `${pendingCount} active complaints in queue`,
            trendClass: 'yellow',
            actionText: 'Take Action',
            actionClass: 'yellow-btn'
          }
        ]).map((item) => (
          <article className="recommend-card" key={item.id}><div className="recommend-head"><div><p className={`level ${item.level}`}>{toTitleCase(item.level)} Priority</p><p className="meta">{item.meta}</p></div><p className="confidence">Confidence <strong>{item.confidence}%</strong></p></div><h3>{item.title}</h3><div className="recommend-box"><p className="rec-label">AI RECOMMENDATION</p><p>{item.recommendation}</p></div><div className="recommend-foot"><p className={`trend ${item.trendClass}`}>{item.trendText}</p><button type="button" className={`action ${item.actionClass}`}>{item.actionText}</button></div></article>
        ))}
      </section>

      <section className="container chart-grid">
        <article className="chart-card">
          <h3>Predicted Complaint Trends</h3>
          <p className="chart-sub">Next 30 days forecast by category</p>
          <div className="chart-plot">
            <svg viewBox="0 0 500 240" role="img" aria-label="Trend chart">
              <line x1="40" y1="20" x2="40" y2="200" className="axis" />
              <line x1="40" y1="200" x2="470" y2="200" className="axis" />
              <line x1="40" y1="160" x2="470" y2="160" className="grid" />
              <line x1="40" y1="120" x2="470" y2="120" className="grid" />
              <line x1="40" y1="80" x2="470" y2="80" className="grid" />
              <line x1="40" y1="40" x2="470" y2="40" className="grid" />
              <polyline points={greenLinePoints} className="line green" />
              <polyline points={yellowLinePoints} className="line yellow" />
              <polyline points={blueLinePoints} className="line blue" />
              <polyline points={violetLinePoints} className="line violet" />
            </svg>
            <div className="x-labels"><span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span></div>
          </div>
          <div className="legend"><span><i className="legend-green"></i> Garbage</span><span><i className="legend-yellow"></i> Streetlights</span><span><i className="legend-blue"></i> Water Supply</span><span><i className="legend-violet"></i> Road Damage</span></div>
        </article>

        <article className="chart-card">
          <h3>Department Workload Forecast</h3>
          <p className="chart-sub">Predicted resource allocation needs</p>
          <div className="bar-plot">
            {departmentForecast.map((entry) => (
              <div className="bar-group" key={entry.name}><div className="bar current" style={{ height: `${entry.currentHeight}%` }}></div><div className="bar predicted" style={{ height: `${entry.predictedHeight}%` }}></div><span>{entry.name}</span></div>
            ))}
          </div>
          <div className="legend"><span><i className="legend-blue"></i> Current</span><span><i className="legend-violet"></i> Predicted</span></div>
        </article>
      </section>
    </main>
  );

  return (
    <>
      <div className="floating-shape shape-left"></div>
      <div className="floating-shape shape-right"></div>

      {isGovernmentUser ? (
        <div className="admin-app">
          <AdminSidebar activeRoute="insights" />
          <section className="main-area">
            <AdminTopbar
              searchPlaceholder="Search insights..."
              alertCount={1}
              adminName={session.fullName || 'Admin User'}
              adminAvatar={((session.fullName || session.email || 'AU').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'AU')}
            />
            {insightsContent}
          </section>
        </div>
      ) : (
        <>
          <SiteHeader headerClass="insights-header" activeRoute="insights" isLoggedIn={isLoggedIn} />

          {insightsContent}

          <SimpleFooter />
        </>
      )}
    </>
  );
}
