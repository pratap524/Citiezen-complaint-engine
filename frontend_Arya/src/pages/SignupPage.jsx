import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import { clearSession, saveSession } from '../utils/auth';
import { signupUser } from '../utils/api';
import usePageStyle from '../utils/usePageStyle';

const LAST_SIGNUP_EMAIL_KEY = 'cie_last_signup_email';
const ORGANIZATION_OPTIONS = [
  { value: '', label: 'Select your organization' },
  { value: 'none', label: 'None' },
  { value: 'municipal-corp', label: 'Municipal Corporation' },
  { value: 'public-works', label: 'Public Works Department' },
  { value: 'water-board', label: 'Water Board' },
  { value: 'transport-office', label: 'Transport Office' },
  { value: 'other', label: 'Other Department' }
];

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

  const selectedOption = options.find((option) => option.value === value) || options[0];

  return (
    <div className={`custom-select ${isOpen ? 'open' : ''}`} ref={dropdownRef}>
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedOption.label}</span>
      </button>

      <ul className="custom-select-menu" role="listbox" aria-label={name}>
        {options.map((option) => (
          <li key={option.value || 'empty-option'} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={`custom-option ${value === option.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>

      <input type="hidden" name={name} value={value} />
    </div>
  );
}

const validateEmail = (emailValue) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);

export default function SignupPage() {
  usePageStyle('/signup.css');

  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState('citizen');
  const [governmentAuthorityId, setGovernmentAuthorityId] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [isLoading, setIsLoading] = useState(false);

  const handleAccountTypeChange = (event) => {
    const nextType = event.target.value;
    setAccountType(nextType);

    if (nextType === 'citizen') {
      setOrganization('none');
      setGovernmentAuthorityId('');
      return;
    }

    setOrganization('');
  };

  const submit = (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (fullName.trim().length < 2) {
      setMessageType('error');
      setMessage('Please enter your full name.');
      return;
    }

    if (!validateEmail(email)) {
      setMessageType('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    if (!organization) {
      setMessageType('error');
      setMessage('Please select your organization or department.');
      return;
    }

    if (password.length < 6) {
      setMessageType('error');
      setMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setMessageType('error');
      setMessage('Password and confirm password do not match.');
      return;
    }

    if (accountType === 'government' && !governmentAuthorityId.trim()) {
      setMessageType('error');
      setMessage('Government Authority ID is required for government accounts.');
      return;
    }

    if (!termsAccepted) {
      setMessageType('error');
      setMessage('Please agree to Terms of Service and Privacy Policy.');
      return;
    }

    setIsLoading(true);
    setMessageType('info');
    setMessage('Creating account...');

    signupUser({
      fullName: fullName.trim(),
      email: normalizedEmail,
      organization,
      accountType,
      governmentAuthorityId: accountType === 'government' ? governmentAuthorityId.trim() : '',
      password,
      confirmPassword
    })
      .then((response) => {
        localStorage.setItem(LAST_SIGNUP_EMAIL_KEY, normalizedEmail);
        clearSession();
        saveSession(response.user);
        setMessageType('success');
        setMessage('Account created successfully. Redirecting...');

        window.setTimeout(() => {
          navigate(response.user.accountType === 'government' ? '/analytics' : '/');
        }, 500);
      })
      .catch((error) => {
        setIsLoading(false);
        setMessageType('error');
        setMessage(error.message || 'Unable to create account right now. Please try again.');
      });
  };

  const className = `form-message ${messageType === 'error' ? 'error' : ''} ${messageType === 'success' ? 'success' : ''}`.trim();

  return (
    <>
      <div className="floating-shape shape-left"></div>
      <div className="floating-shape shape-right"></div>

      <SiteHeader headerClass="signup-header" activeRoute="" isLoggedIn={false} showAuthActions={false} />

      <main className="signup-main">
        <section className="container signup-layout">
          <article className="hero-side">
            <h1>
              Create Your
              <span>AI Governance</span>
              Account
            </h1>
            <p>
              Register to access the smart city complaint intelligence dashboard,
              AI insights, and predictive governance tools.
            </p>
          </article>

          <article className="signup-card">
            <h2>Create Your Account</h2>
            <p className="signup-sub">Join the AI-powered governance platform.</p>

            <form className="signup-form" onSubmit={submit} noValidate>
              <label>
                <span>Full Name</span>
                <input type="text" placeholder="Enter your full name" autoComplete="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </label>

              <label>
                <span>Email Address</span>
                <input type="email" placeholder="Enter your email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>

              <label>
                <span>Organization / Department</span>
                <FormDropdown
                  name="organization"
                  value={organization}
                  options={ORGANIZATION_OPTIONS}
                  onChange={setOrganization}
                />
              </label>

              <label>
                <span>Password</span>
                <div className="password-wrap">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Create a password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              <label>
                <span>Confirm Password</span>
                <div className="password-wrap">
                  <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm your password" autoComplete="new-password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              <fieldset className="account-type">
                <legend>Account Type</legend>
                <label className="radio-row">
                  <input type="radio" name="accountType" value="citizen" checked={accountType === 'citizen'} onChange={handleAccountTypeChange} />
                  <span>Citizen Account</span>
                </label>
                <label className="radio-row">
                  <input type="radio" name="accountType" value="government" checked={accountType === 'government'} onChange={handleAccountTypeChange} />
                  <span>Government Authority</span>
                </label>
              </fieldset>

              {accountType === 'government' && (
                <label>
                  <span>Government Authority ID</span>
                  <input type="text" placeholder="Enter government authority ID" required value={governmentAuthorityId} onChange={(e) => setGovernmentAuthorityId(e.target.value)} />
                </label>
              )}

              <label className="terms-row">
                <input type="checkbox" required checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</span>
              </label>

              <button className="create-btn" type="submit" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Account'}</button>

              <p className={className} role="status" aria-live="polite">{message}</p>

              <p className="login-note">Already have an account? <Link to="/login">Login</Link></p>
            </form>
          </article>
        </section>
      </main>
    </>
  );
}
