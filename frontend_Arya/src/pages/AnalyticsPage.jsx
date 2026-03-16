import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import usePageStyle from '../utils/usePageStyle';
import { getAdminIdentity, getAdminSessionInfo } from '../utils/adminAuth';
import { getComplaints, getDashboardStats, getTopIssues, getUrgencyRanking } from '../utils/api';

const FALLBACK_WARD_DATA = [
  { ward: 'W1', score: 81 }, { ward: 'W2', score: 69 }, { ward: 'W3', score: 58 },
  { ward: 'W4', score: 43 }, { ward: 'W5', score: 72 }, { ward: 'W6', score: 64 },
  { ward: 'W7', score: 84 }, { ward: 'W8', score: 37 }, { ward: 'W9', score: 55 },
  { ward: 'W10', score: 61 }, { ward: 'W11', score: 76 }, { ward: 'W12', score: 88 }
];

const PRIORITY_SEGMENTS = [
  { key: 'High', color: '#f24848', swatch: 'high' },
  { key: 'Medium', color: '#f7d63a', swatch: 'medium' },
  { key: 'Low', color: '#2ecc71', swatch: 'low' }
];

const buildMonthLabels = () => {
  const labels = [];
  const current = new Date();

  for (let monthOffset = 8; monthOffset >= 0; monthOffset -= 1) {
    const value = new Date(current.getFullYear(), current.getMonth() - monthOffset, 1);
    labels.push(value.toLocaleString('en-US', { month: 'short' }));
  }

  return labels;
};

const buildPolyline = (values) => {
  if (!values.length) {
    return '40,200 470,200';
  }

  const maxValue = Math.max(...values, 1);

  return values
    .map((value, index) => {
      const x = 40 + ((470 - 40) * index) / Math.max(values.length - 1, 1);
      const y = 200 - ((Math.max(value, 0) / maxValue) * (200 - 40));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
};

const buildPointCoordinates = (values) => {
  if (!values.length) {
    return [];
  }

  const maxValue = Math.max(...values, 1);

  return values.map((value, index) => {
    const x = 40 + ((470 - 40) * index) / Math.max(values.length - 1, 1);
    const y = 200 - ((Math.max(value, 0) / maxValue) * (200 - 40));
    return {
      value,
      x,
      y
    };
  });
};

const getHeatColor = (score) => {
  if (score >= 80) return 'rgba(242, 72, 72, 0.34)';
  if (score >= 65) return 'rgba(247, 214, 58, 0.28)';
  if (score >= 50) return 'rgba(79, 157, 255, 0.28)';
  return 'rgba(46, 204, 113, 0.22)';
};

export default function AnalyticsPage() {
  usePageStyle('/analytics.css');

  const { isAuthenticated, isGovernment, session } = getAdminSessionInfo();
  const { adminName, adminAvatar } = useMemo(() => getAdminIdentity(session), [session]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplaintsLoading, setIsComplaintsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [topIssues, setTopIssues] = useState([]);
  const [urgencyRanking, setUrgencyRanking] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [activePriority, setActivePriority] = useState('all');
  const [activeMonthIndex, setActiveMonthIndex] = useState(null);
  const [activePrioritySegment, setActivePrioritySegment] = useState(null);

  useEffect(() => {
    let ignore = false;

    Promise.all([getDashboardStats(), getTopIssues(), getUrgencyRanking()])
      .then(([statsResponse, topIssuesResponse, urgencyResponse]) => {
        if (ignore) {
          return;
        }

        setDashboardStats(statsResponse || null);
        setTopIssues(Array.isArray(topIssuesResponse) ? topIssuesResponse : []);
        setUrgencyRanking(Array.isArray(urgencyResponse) ? urgencyResponse : []);
      })
      .catch(() => {
        if (ignore) {
          return;
        }

        setDashboardStats(null);
        setTopIssues([]);
        setUrgencyRanking([]);
        setComplaints([]);
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    getComplaints()
      .then((complaintsResponse) => {
        if (ignore) {
          return;
        }

        setComplaints(Array.isArray(complaintsResponse) ? complaintsResponse : []);
      })
      .catch(() => {
        if (ignore) {
          return;
        }

        setComplaints([]);
      })
      .finally(() => {
        if (!ignore) {
          setIsComplaintsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter((item) => item.status === 'Resolved' || item.status === 'Closed').length;
  const pendingComplaints = complaints.filter((item) => item.status === 'Pending' || item.status === 'In Progress').length;
  const positiveComplaints = complaints.filter((item) => item.sentiment === 'Positive' || item.sentiment === 'Very Positive').length;
  const resolutionRate = totalComplaints > 0 ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1) : '0.0';
  const positivityRate = totalComplaints > 0 ? ((positiveComplaints / totalComplaints) * 100).toFixed(1) : '0.0';
  const averageResolutionDays = dashboardStats?.avgPredictedResolutionDays ? Number(dashboardStats.avgPredictedResolutionDays).toFixed(1) : '0.0';
  const departmentEntries = Object.entries(dashboardStats?.countByDepartment || {});

  const monthLabels = buildMonthLabels();
  const monthBucket = monthLabels.map(() => ({ total: 0, resolved: 0 }));
  const monthIndexLookup = new Map(monthLabels.map((label, index) => [label, index]));

  complaints.forEach((item) => {
    const date = new Date(item.createdAt);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    const label = date.toLocaleString('en-US', { month: 'short' });
    const monthIndex = monthIndexLookup.get(label);

    if (monthIndex === undefined) {
      return;
    }

    monthBucket[monthIndex].total += 1;
    if (item.status === 'Resolved' || item.status === 'Closed') {
      monthBucket[monthIndex].resolved += 1;
    }
  });

  const monthTotalValues = monthBucket.map((item) => item.total);
  const monthResolvedValues = monthBucket.map((item) => item.resolved);
  const totalCoordinates = buildPointCoordinates(monthTotalValues);
  const resolvedCoordinates = buildPointCoordinates(monthResolvedValues);
  const lineTotalPoints = buildPolyline(monthTotalValues);
  const lineResolvedPoints = buildPolyline(monthResolvedValues);

  const priorityBreakdown = complaints.reduce((accumulator, item) => {
    const score = typeof item.urgencyScore === 'number'
      ? item.urgencyScore
      : (typeof item.priorityScore === 'number' ? item.priorityScore : 0);

    if (score >= 8) {
      accumulator.High += 1;
    } else if (score >= 5) {
      accumulator.Medium += 1;
    } else {
      accumulator.Low += 1;
    }

    return accumulator;
  }, { High: 0, Medium: 0, Low: 0 });

  const issueTotalCount = priorityBreakdown.High + priorityBreakdown.Medium + priorityBreakdown.Low;
  const issueLegends = PRIORITY_SEGMENTS.map((segment) => {
    const count = priorityBreakdown[segment.key] || 0;
    const percentage = issueTotalCount > 0 ? Math.round((count / issueTotalCount) * 100) : 0;

    return {
      label: segment.key,
      count,
      percentage,
      swatch: segment.swatch,
      color: segment.color
    };
  });

  const activePriorityData = activePriority === 'all'
    ? { label: 'Total', count: issueTotalCount, percentage: 100 }
    : (issueLegends.find((item) => item.label === activePriority) || { label: activePriority, count: 0, percentage: 0 });

  const hoveredPriorityData = activePrioritySegment
    ? (issueLegends.find((item) => item.label === activePrioritySegment) || null)
    : null;

  const donutRadius = 54;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let donutOffset = 0;
  const donutSegments = issueLegends.map((item) => {
    const ratio = issueTotalCount > 0 ? item.count / issueTotalCount : 0;
    const arcLength = ratio * donutCircumference;
    const segment = {
      ...item,
      dash: `${arcLength} ${Math.max(0, donutCircumference - arcLength)}`,
      offset: donutOffset
    };
    donutOffset += arcLength;
    return segment;
  });

  const wardHeatData = urgencyRanking.length > 0
    ? urgencyRanking.slice(0, 12).map((item, index) => ({
      ward: `W${index + 1}`,
      score: Math.max(10, Math.min(100, Math.round((Number(item.urgencyScore || 0) / 10) * 100)))
    }))
    : FALLBACK_WARD_DATA;

  const deptPerformance = departmentEntries.length > 0
    ? departmentEntries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([department, count], index) => ({
        department,
        height: `${Math.max(20, Math.round((count / Math.max(...departmentEntries.map((entry) => entry[1]), 1)) * 100))}%`,
        color: ['#4f9dff', '#8b5cf6', '#2ecc71', '#f7d63a', '#f24848'][index % 5]
      }))
    : [
      { department: 'Water', height: '82%', color: '#4f9dff' },
      { department: 'Roads', height: '74%', color: '#8b5cf6' },
      { department: 'Sanitation', height: '69%', color: '#2ecc71' },
      { department: 'Electricity', height: '63%', color: '#f7d63a' },
      { department: 'Other', height: '58%', color: '#f24848' }
    ];

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isGovernment) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-app">
      <AdminSidebar activeRoute="analytics" />

      <section className="main-area">
        <AdminTopbar
          searchPlaceholder="Search metric, ward, or department..."
          alertCount={2}
          adminName={adminName}
          adminAvatar={adminAvatar}
        />

        <main className="content">
          <h1>Analytics Overview</h1>
          <p className="subhead">Deep insights on complaints, response quality, and operational efficiency</p>
          {isLoading && <p className="subhead">Loading live analytics...</p>}

          <section className="metric-grid">
            <article className="metric-card"><p>Resolution Rate</p><h2>{resolutionRate}%</h2><strong className="good">{resolvedComplaints} resolved complaints</strong></article>
            <article className="metric-card"><p>Avg Resolution ETA</p><h2>{averageResolutionDays} days</h2><strong className="neutral">AI predicted timeline</strong></article>
            <article className="metric-card"><p>Backlog Cases</p><h2>{pendingComplaints}</h2><strong className="warn">Pending + in progress</strong></article>
            <article className="metric-card"><p>Positive Sentiment</p><h2>{positivityRate}%</h2><strong className="good">Across {totalComplaints} complaints</strong></article>
          </section>

          <section className="panel-grid">
            <article className="panel">
              <h3>Monthly Complaints Trend</h3>
              <div className="line-chart">
                <svg
                  viewBox="0 0 500 240"
                  role="img"
                  aria-label="Monthly complaints trend"
                  onMouseLeave={() => setActiveMonthIndex(null)}
                >
                  <line x1="40" y1="20" x2="40" y2="200" className="axis" />
                  <line x1="40" y1="200" x2="470" y2="200" className="axis" />
                  <line x1="40" y1="160" x2="470" y2="160" className="grid" />
                  <line x1="40" y1="120" x2="470" y2="120" className="grid" />
                  <line x1="40" y1="80" x2="470" y2="80" className="grid" />
                  <line x1="40" y1="40" x2="470" y2="40" className="grid" />
                  {totalCoordinates.map((point, index) => {
                    const prevX = index > 0 ? totalCoordinates[index - 1].x : point.x;
                    const nextX = index < totalCoordinates.length - 1 ? totalCoordinates[index + 1].x : point.x;
                    const startX = index === 0 ? 40 : (prevX + point.x) / 2;
                    const endX = index === totalCoordinates.length - 1 ? 470 : (point.x + nextX) / 2;

                    return (
                      <rect
                        key={`month-zone-${monthLabels[index]}`}
                        x={startX}
                        y="20"
                        width={Math.max(1, endX - startX)}
                        height="180"
                        className={`hover-band ${activeMonthIndex === index ? 'active' : ''}`}
                        onMouseEnter={() => setActiveMonthIndex(index)}
                      />
                    );
                  })}
                  <polyline points={lineTotalPoints} className="line-total" />
                  <polyline points={lineResolvedPoints} className="line-resolved" />
                  {totalCoordinates.map((point, index) => (
                    <circle
                      key={`total-point-${monthLabels[index]}`}
                      cx={point.x}
                      cy={point.y}
                      r={activeMonthIndex === index ? 4.5 : 3.4}
                      className="line-point total"
                    />
                  ))}
                  {resolvedCoordinates.map((point, index) => (
                    <circle
                      key={`resolved-point-${monthLabels[index]}`}
                      cx={point.x}
                      cy={point.y}
                      r={activeMonthIndex === index ? 4.3 : 3.2}
                      className="line-point resolved"
                    />
                  ))}
                </svg>
                <div className="month-labels">{monthLabels.map((label) => <span key={label}>{label}</span>)}</div>
                {activeMonthIndex !== null && (
                  <div className="chart-tooltip" role="status" aria-live="polite">
                    <strong>{monthLabels[activeMonthIndex]}</strong>
                    <span>Total complaints: {monthBucket[activeMonthIndex]?.total || 0}</span>
                    <span>Resolved complaints: {monthBucket[activeMonthIndex]?.resolved || 0}</span>
                  </div>
                )}
              </div>
              <div className="legend-row"><span><i className="dot total"></i>Total</span><span><i className="dot resolved"></i>Resolved</span></div>
            </article>

            <article className="panel">
              <h3>Priority Distribution</h3>
              {isComplaintsLoading ? (
                <div className="priority-loading" role="status" aria-live="polite">
                  Loading priority distribution...
                </div>
              ) : (
                <div className="donut-wrap">
                  <div className="donut-chart" onMouseLeave={() => setActivePrioritySegment(null)}>
                    <svg viewBox="0 0 150 150" role="img" aria-label="Priority distribution chart">
                      <circle cx="75" cy="75" r={donutRadius} className="donut-track" />
                      {issueTotalCount > 0 && donutSegments.map((segment) => (
                        segment.count > 0 ? (
                          <circle
                            key={segment.label}
                            cx="75"
                            cy="75"
                            r={donutRadius}
                            className={`donut-segment ${activePrioritySegment === segment.label ? 'active' : ''}`}
                            style={{
                              stroke: segment.color,
                              strokeDasharray: segment.dash,
                              strokeDashoffset: -segment.offset
                            }}
                            transform="rotate(-90 75 75)"
                            onMouseEnter={() => setActivePrioritySegment(segment.label)}
                          />
                        ) : null
                      ))}
                    </svg>
                    <div className="donut-center">
                      <strong>{activePriorityData.count}</strong>
                      <span>{activePriorityData.label}</span>
                    </div>
                  </div>
                  {hoveredPriorityData && (
                    <div className="priority-tooltip" role="status" aria-live="polite">
                      <strong>{hoveredPriorityData.label} priority</strong>
                      <span>{hoveredPriorityData.count} complaints</span>
                      <span>{hoveredPriorityData.percentage}% of total complaints</span>
                    </div>
                  )}
                  <ul className="legend-list">
                    {issueLegends.length > 0 ? issueLegends.map((item) => (
                      <li key={item.label}>
                        <button
                          type="button"
                          className={`legend-chip ${activePriority === item.label ? 'active' : ''}`}
                          onClick={() => setActivePriority((current) => (current === item.label ? 'all' : item.label))}
                          onMouseEnter={() => setActivePrioritySegment(item.label)}
                          onMouseLeave={() => setActivePrioritySegment((current) => (current === item.label ? null : current))}
                        >
                          <span className={`swatch ${item.swatch}`}></span>
                          {item.label}: {item.count} ({item.percentage}%)
                        </button>
                      </li>
                    )) : (
                      <li><span className="swatch low"></span>No complaint data yet</li>
                    )}
                  </ul>
                </div>
              )}
            </article>
          </section>

          <section className="panel-grid second">
            <article className="panel">
              <h3>Ward-Wise Heat Score</h3>
              <div className="heat-grid">
                {wardHeatData.map((entry) => (
                  <article key={entry.ward} className="heat-cell" style={{ background: getHeatColor(entry.score) }}>
                    <span>{entry.ward}</span>
                    <strong>{entry.score}</strong>
                  </article>
                ))}
              </div>
            </article>

            <article className="panel">
              <h3>Department Performance</h3>
              <div className="bar-chart">
                {deptPerformance.map((item) => (
                  <div className="bar-group" key={item.department}><div className="bar" style={{ '--h': item.height, '--c': item.color }}></div><span>{item.department}</span></div>
                ))}
              </div>
            </article>
          </section>
        </main>
      </section>
    </div>
  );
}
