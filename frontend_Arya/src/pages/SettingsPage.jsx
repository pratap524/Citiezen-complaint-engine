import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import usePageStyle from '../utils/usePageStyle';
import { getAdminIdentity, getAdminSessionInfo } from '../utils/adminAuth';

const SETTINGS_KEY = 'cie_admin_settings';

const DEFAULT_SETTINGS = {
  municipalityName: 'Greater City Municipal Corporation',
  complaintPrefix: 'CMP',
  timezone: 'Asia/Kolkata',
  supportEmail: 'support@city.gov',
  autoAssign: true,
  maintenanceMode: false,
  defaultPriority: 'Medium',
  slaHours: 72,
  escalationHours: 24,
  emailEscalations: true,
  dailyDigest: true,
  digestTime: '08:00',
  reportRecipients: 'commissioner@city.gov, zonal-head@city.gov',
  sessionTimeoutMinutes: '60',
  requireGov2FA: false,
  maskCitizenPhone: true
};

const getMergedSettings = () => {
  try {
    const rawSettings = localStorage.getItem(SETTINGS_KEY);
    const storedSettings = rawSettings ? JSON.parse(rawSettings) : {};
    return { ...DEFAULT_SETTINGS, ...storedSettings };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

export default function SettingsPage() {
  usePageStyle('/settings.css');

  const { isAuthenticated, isGovernment, session } = getAdminSessionInfo();
  const { adminName, adminAvatar } = useMemo(() => getAdminIdentity(session), [session]);
  const [settings, setSettings] = useState(getMergedSettings);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isGovernment) {
    return <Navigate to="/" replace />;
  }

  const setField = (name, value) => {
    setSettings((current) => ({ ...current, [name]: value }));
  };

  const saveSettings = (event) => {
    event.preventDefault();

    const parsedSlaHours = Number(settings.slaHours);
    const parsedEscalationHours = Number(settings.escalationHours);

    if (!Number.isFinite(parsedSlaHours) || parsedSlaHours < 1 || parsedSlaHours > 240) {
      setMessageType('error');
      setMessage('SLA target must be between 1 and 240 hours.');
      return;
    }

    if (!Number.isFinite(parsedEscalationHours) || parsedEscalationHours < 1 || parsedEscalationHours > 240) {
      setMessageType('error');
      setMessage('Escalation threshold must be between 1 and 240 hours.');
      return;
    }

    if (!settings.municipalityName.trim()) {
      setMessageType('error');
      setMessage('Municipality name is required.');
      return;
    }

    if (!settings.complaintPrefix.trim()) {
      setMessageType('error');
      setMessage('Complaint prefix is required.');
      return;
    }

    if (!settings.supportEmail.trim()) {
      setMessageType('error');
      setMessage('Support email is required.');
      return;
    }

    const payload = {
      ...settings,
      complaintPrefix: settings.complaintPrefix.trim().toUpperCase(),
      municipalityName: settings.municipalityName.trim(),
      supportEmail: settings.supportEmail.trim(),
      reportRecipients: settings.reportRecipients.trim(),
      slaHours: parsedSlaHours,
      escalationHours: parsedEscalationHours
    };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
    setSettings(payload);
    setMessageType('success');
    setMessage('Settings saved successfully.');
  };

  const resetDefaults = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    setSettings(DEFAULT_SETTINGS);
    setMessageType('success');
    setMessage('Settings reset to default values.');
  };

  return (
    <div className="admin-app">
      <AdminSidebar activeRoute="settings" />

      <section className="main-area">
        <AdminTopbar
          searchPlaceholder="Search settings..."
          alertCount={1}
          adminName={adminName}
          adminAvatar={adminAvatar}
        />

        <main className="content">
          <h1>Platform Settings</h1>
          <p className="subhead">Configure complaint workflow, notifications, and governance controls</p>

          <form onSubmit={saveSettings} noValidate>
            <section className="settings-grid">
              <article className="panel">
                <div className="panel-head"><h2>City Profile</h2><p>Identity and default service region</p></div>
                <div className="field-grid two-col">
                  <label>Municipality Name<input type="text" value={settings.municipalityName} onChange={(e) => setField('municipalityName', e.target.value)} required /></label>
                  <label>Complaint Prefix<input type="text" maxLength={8} value={settings.complaintPrefix} onChange={(e) => setField('complaintPrefix', e.target.value)} required /></label>
                  <label>Timezone
                    <select value={settings.timezone} onChange={(e) => setField('timezone', e.target.value)}>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option><option value="UTC">UTC</option><option value="Asia/Dubai">Asia/Dubai (GST)</option><option value="Europe/London">Europe/London (GMT/BST)</option>
                    </select>
                  </label>
                  <label>Portal Support Email<input type="email" value={settings.supportEmail} onChange={(e) => setField('supportEmail', e.target.value)} required /></label>
                </div>
              </article>

              <article className="panel">
                <div className="panel-head"><h2>Complaint Workflow</h2><p>How new complaints are processed</p></div>
                <div className="field-grid two-col">
                  <label className="toggle-row"><input type="checkbox" checked={settings.autoAssign} onChange={(e) => setField('autoAssign', e.target.checked)} /><span>Auto-assign new complaints to departments</span></label>
                  <label className="toggle-row"><input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => setField('maintenanceMode', e.target.checked)} /><span>Enable maintenance mode banner</span></label>
                  <label>Default Priority
                    <select value={settings.defaultPriority} onChange={(e) => setField('defaultPriority', e.target.value)}>
                      <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                    </select>
                  </label>
                  <label>SLA Target (hours)<input type="number" min={1} max={240} value={settings.slaHours} onChange={(e) => setField('slaHours', e.target.value)} /></label>
                  <label>Escalation Threshold (hours)<input type="number" min={1} max={240} value={settings.escalationHours} onChange={(e) => setField('escalationHours', e.target.value)} /></label>
                </div>
              </article>

              <article className="panel">
                <div className="panel-head"><h2>Notifications</h2><p>Alerts and reporting preferences</p></div>
                <div className="field-grid two-col">
                  <label className="toggle-row"><input type="checkbox" checked={settings.emailEscalations} onChange={(e) => setField('emailEscalations', e.target.checked)} /><span>Email alerts for escalated complaints</span></label>
                  <label className="toggle-row"><input type="checkbox" checked={settings.dailyDigest} onChange={(e) => setField('dailyDigest', e.target.checked)} /><span>Send daily performance digest</span></label>
                  <label>Digest Delivery
                    <select value={settings.digestTime} onChange={(e) => setField('digestTime', e.target.value)}>
                      <option value="08:00">08:00</option><option value="12:00">12:00</option><option value="18:00">18:00</option>
                    </select>
                  </label>
                  <label>Recipients (comma separated)
                    <textarea rows={3} value={settings.reportRecipients} onChange={(e) => setField('reportRecipients', e.target.value)}></textarea>
                  </label>
                </div>
              </article>

              <article className="panel">
                <div className="panel-head"><h2>Security</h2><p>Admin access and data privacy controls</p></div>
                <div className="field-grid two-col">
                  <label>Session Timeout
                    <select value={settings.sessionTimeoutMinutes} onChange={(e) => setField('sessionTimeoutMinutes', e.target.value)}>
                      <option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">60 minutes</option><option value="120">120 minutes</option>
                    </select>
                  </label>
                  <label className="toggle-row"><input type="checkbox" checked={settings.requireGov2FA} onChange={(e) => setField('requireGov2FA', e.target.checked)} /><span>Require 2FA for government accounts</span></label>
                  <label className="toggle-row"><input type="checkbox" checked={settings.maskCitizenPhone} onChange={(e) => setField('maskCitizenPhone', e.target.checked)} /><span>Mask citizen phone numbers by default</span></label>
                </div>
              </article>
            </section>

            <section className="actions-row">
              <button className="btn primary" type="submit">Save Settings</button>
              <button className="btn ghost" type="button" onClick={resetDefaults}>Reset To Defaults</button>
              <p className={`message ${messageType}`}>{message}</p>
            </section>
          </form>
        </main>
      </section>
    </div>
  );
}
