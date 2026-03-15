import React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import SiteHeader from '../components/SiteHeader';
import { createComplaint, getComplaintCategories, suggestComplaintCategory } from '../utils/api';
import usePageStyle from '../utils/usePageStyle';

const DEFAULT_CATEGORY_OPTIONS = ['Road and Traffic', 'Waste Management', 'Street Lighting', 'Water Supply', 'Drainage'];
const WARD_OPTIONS = ['Ward 15', 'Ward 01', 'Ward 07', 'Ward 22'];

function FormDropdown({ name, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
    };
  }, []);

  return (
    <div className={`custom-select ${isOpen ? 'open' : ''}`} ref={dropdownRef}>
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{value}</span>
      </button>

      <ul className="custom-select-menu" role="listbox" aria-label={name}>
        {options.map((option) => (
          <li key={option} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={value === option}
              className={`custom-option ${value === option ? 'selected' : ''}`}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>

      <input type="hidden" name={name} value={value} />
    </div>
  );
}

export default function SubmitPage({ isLoggedIn }) {
  usePageStyle('/submit.css');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Road and Traffic');
  const [locationText, setLocationText] = useState('');
  const [ward, setWard] = useState('Ward 15');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [analysis, setAnalysis] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState(DEFAULT_CATEGORY_OPTIONS);

  const resolveCoordinates = async () => {
    if (!navigator.geolocation) {
      return { longitude: 77.209, latitude: 28.6139 };
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 0
        });
      });

      return {
        longitude: Number(position.coords.longitude),
        latitude: Number(position.coords.latitude)
      };
    } catch {
      return { longitude: 77.209, latitude: 28.6139 };
    }
  };

  useEffect(() => {
    let ignore = false;

    getComplaintCategories()
      .then((response) => {
        if (ignore) {
          return;
        }

        const categories = Array.isArray(response?.categories) ? response.categories : [];
        if (categories.length > 0) {
          setCategoryOptions(categories);
          if (!categories.includes(category)) {
            setCategory(categories[0]);
          }
        }
      })
      .catch(() => {
        if (!ignore) {
          setCategoryOptions(DEFAULT_CATEGORY_OPTIONS);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const issueText = `${title} ${description}`.trim();
    if (issueText.length < 8) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      suggestComplaintCategory(issueText)
        .then((response) => {
          const suggested = response?.suggestedCategory;
          if (suggested && categoryOptions.includes(suggested)) {
            setCategory(suggested);
          }
        })
        .catch(() => {
          // no-op
        });
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [title, description, categoryOptions]);

  const submitComplaint = async (event) => {
    event.preventDefault();

    if (!title.trim() || !description.trim()) {
      setMessageType('error');
      setMessage('Please add both complaint title and description.');
      return;
    }

    setIsSubmitting(true);
    setMessageType('info');
    setMessage('Submitting complaint...');

    try {
      const { longitude, latitude } = await resolveCoordinates();
      const complaintText = [
        title.trim(),
        description.trim(),
        `Category: ${category}`,
        `Location: ${locationText || 'Not provided'}`,
        `Ward: ${ward}`
      ].join('. ');

      const created = await createComplaint({
        text: complaintText,
        category,
        longitude,
        latitude
      });

      setAnalysis(created);
      setMessageType('success');
      setMessage(`Complaint submitted successfully. Complaint ID: ${created._id}`);
      setTitle('');
      setDescription('');
      setLocationText('');
      setWard('Ward 15');
    } catch (error) {
      setMessageType('error');
      setMessage(error.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const urgencyPercentage = useMemo(() => {
    const scoreValue = typeof analysis?.priorityScore === 'number'
      ? analysis.priorityScore
      : analysis?.urgencyScore;

    if (typeof scoreValue !== 'number') {
      return 70;
    }

    return Math.max(10, Math.min(100, Math.round((scoreValue / 10) * 100)));
  }, [analysis]);

  const displayUrgencyScore = useMemo(() => {
    const scoreValue = typeof analysis?.priorityScore === 'number'
      ? analysis.priorityScore
      : analysis?.urgencyScore;

    if (typeof scoreValue !== 'number') {
      return 7;
    }

    return Math.max(0, Math.min(10, Math.round(scoreValue)));
  }, [analysis]);

  return (
    <>
      <div className="floating-shape shape-left"></div>
      <div className="floating-shape shape-right"></div>

      <SiteHeader headerClass="submit-header" activeRoute="submit" isLoggedIn={isLoggedIn} />

      <main className="submit-main">
        <section className="submit-intro">
          <h1>Submit a Civic Complaint</h1>
          <p>Our AI system will analyze your complaint, detect the correct department, and prioritize the issue instantly.</p>
          <span className="intro-line" aria-hidden="true"></span>
        </section>

        <section className="container form-layout">
          <article className="panel form-panel">
            <h2>Complaint Details</h2>

            <form className="complaint-form" onSubmit={submitComplaint} noValidate>
              <label className="field"><span>Complaint Title</span><input type="text" placeholder="Briefly describe the issue..." value={title} onChange={(event) => setTitle(event.target.value)} /></label>
              <label className="field"><span>Description</span><textarea rows="4" placeholder="Provide detailed information about the civic problem" value={description} onChange={(event) => setDescription(event.target.value)}></textarea></label>
              <label className="field">
                <span>Category</span>
                <FormDropdown name="category" value={category} options={categoryOptions} onChange={setCategory} />
              </label>
              <label className="field"><span>Upload Photo</span><div className="upload-box"><div className="upload-icon">U</div><p>Drag and drop images or click to upload</p></div></label>
              <label className="field"><span>Location</span><div className="input-icon"><span className="mini-icon">L</span><input type="text" placeholder="Enter location or address" value={locationText} onChange={(event) => setLocationText(event.target.value)} /></div></label>
              <label className="field"><span>Map</span><div className="map-preview"><div className="map-icon">M</div><p>Interactive map preview</p></div></label>
              <label className="field">
                <span>Ward Number</span>
                <FormDropdown name="ward" value={ward} options={WARD_OPTIONS} onChange={setWard} />
              </label>
              <button className="submit-btn" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Complaint'}</button>
              <p className={`form-message ${messageType === 'error' ? 'error' : ''} ${messageType === 'success' ? 'success' : ''}`.trim()} role="status" aria-live="polite">{message}</p>
            </form>
          </article>

          <aside className="side-column">
            <article className="panel analysis-panel">
              <div className="analysis-header">
                <div><h3>AI Analysis</h3><p>Real-time complaint intelligence</p></div>
                <span className="live-dot" aria-hidden="true"></span>
              </div>

              <div className="analysis-block"><p className="analysis-label">Detected Department</p><p className="analysis-value">{analysis?.department || 'Public Works Department'}</p></div>

              <div className="metric-card"><div className="metric-head"><span>Urgency Score</span><strong>{displayUrgencyScore} / 10</strong></div><div className="meter"><span style={{ width: `${urgencyPercentage}%` }}></span></div></div>
              <div className="metric-card"><div className="metric-head"><span>Sentiment Detection</span><strong>{analysis?.sentiment || 'Concerned'}</strong></div><div className="meter sentiment"><span style={{ width: '62%' }}></span></div><p className="tiny-note">AI detects citizen frustration level</p></div>
              <div className="resolution-box"><p>Estimated Resolution</p><strong>{analysis?.predictedResolutionDays ? `${analysis.predictedResolutionDays} Business Days` : '5-7 Business Days'}</strong></div>
            </article>

            <article className="panel tips-panel">
              <h3>Tips for Effective Complaints</h3>
              <ul className="tips-list">
                <li className="tip-item"><span className="tip-icon ic-blue">1</span><div><h4>Be Specific</h4><p>Include exact location and details.</p></div></li>
                <li className="tip-item"><span className="tip-icon ic-green">2</span><div><h4>Add Photos</h4><p>Images help departments respond faster.</p></div></li>
                <li className="tip-item"><span className="tip-icon ic-orange">3</span><div><h4>Stay Objective</h4><p>Focus on facts rather than emotions.</p></div></li>
                <li className="tip-item"><span className="tip-icon ic-pink">4</span><div><h4>One Issue per Complaint</h4><p>Submit separate complaints for different issues.</p></div></li>
              </ul>
            </article>
          </aside>
        </section>
      </main>
    </>
  );
}
