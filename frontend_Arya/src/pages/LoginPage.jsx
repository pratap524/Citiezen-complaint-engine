import React from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import { saveSession } from '../utils/auth';
import { loginUser } from '../utils/api';
import usePageStyle from '../utils/usePageStyle';

const REMEMBERED_EMAIL_KEY = 'cie_remembered_email';
const LAST_SIGNUP_EMAIL_KEY = 'cie_last_signup_email';

const validateEmail = (emailValue) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);

export default function LoginPage() {
  usePageStyle('/login.css');

  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
      const lastSignupEmail = localStorage.getItem(LAST_SIGNUP_EMAIL_KEY);
      const prefillEmail = rememberedEmail || lastSignupEmail;

      if (prefillEmail) {
        setEmail(prefillEmail);
      }

      if (rememberedEmail) {
        setRememberMe(true);
      }
    } catch {
      // no-op
    }
  }, []);

  const submit = (event) => {
    event.preventDefault();

    if (!email || !password) {
      setMessageType('error');
      setMessage('Please enter both email address and password.');
      return;
    }

    if (!validateEmail(email)) {
      setMessageType('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setMessageType('error');
      setMessage('Password must be at least 6 characters.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    setIsLoading(true);
    setMessageType('info');
    setMessage('Signing in...');

    loginUser({ email: normalizedEmail, password })
      .then((response) => {
        try {
          if (rememberMe) {
            localStorage.setItem(REMEMBERED_EMAIL_KEY, normalizedEmail);
          } else {
            localStorage.removeItem(REMEMBERED_EMAIL_KEY);
          }

          localStorage.removeItem(LAST_SIGNUP_EMAIL_KEY);
        } catch {
          // no-op
        }

        saveSession(response.user);

        setMessageType('success');
        setMessage('Login successful. Redirecting...');

        window.setTimeout(() => {
          navigate(response.user.accountType === 'government' ? '/analytics' : '/');
        }, 500);
      })
      .catch((error) => {
        setIsLoading(false);
        setMessageType('error');
        setMessage(error.message || 'Unable to login right now. Please try again.');
      });
  };

  const className = `form-message ${messageType === 'error' ? 'error' : ''} ${messageType === 'success' ? 'success' : ''}`.trim();

  return (
    <>
      <div className="floating-shape shape-left"></div>
      <div className="floating-shape shape-right"></div>

      <SiteHeader headerClass="login-header" activeRoute="" isLoggedIn={false} showAuthActions={false} />

      <main className="login-main">
        <section className="container login-layout">
          <article className="hero-side">
            <h1>
              Secure Access
              <span>to AI Governance Intelligence</span>
            </h1>
            <p>Login to access the smart city complaint intelligence dashboard and predictive insights.</p>

            <div className="intel-panel">
              <div className="mini-card top-left"><h3>89%</h3><p>AI Accuracy</p></div>
              <div className="dot-cluster" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>
              <div className="mini-card bottom-left"><h3>156</h3><p>Issues Prevented</p></div>
              <div className="mini-card right"><h3>2.4M</h3><p>Complaints Analyzed</p></div>
            </div>
          </article>

          <article className="auth-card">
            <h2>Login to Your Account</h2>
            <p className="auth-sub">Access your AI governance dashboard</p>

            <form className="auth-form" onSubmit={submit} noValidate>
              <label>
                <span>Email Address</span>
                <input type="email" placeholder="Enter your email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>

              <label>
                <span>Password</span>
                <div className="password-wrap">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              <div className="auth-row">
                <label className="remember">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  <span>Remember Me</span>
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); setMessageType('info'); setMessage('Password reset is coming soon. Please contact support for now.'); }}>
                  Forgot Password?
                </a>
              </div>

              <button className="login-btn" type="submit" disabled={isLoading}>{isLoading ? 'Signing in...' : 'Login'}</button>

              <p className={className} role="status" aria-live="polite">{message}</p>

              <div className="divider">Or continue with</div>

              <button className="social-btn" type="button" onClick={() => { setMessageType('error'); setMessage('Google login is disabled in this flow. Please sign up and login with email/password.'); }}><span>G</span> Login with Google</button>
              <button className="social-btn" type="button" onClick={() => { setMessageType('error'); setMessage('Government ID login is disabled in this flow. Please sign up and login with email/password.'); }}><span>ID</span> Login with Government ID</button>

              <p className="register-note">Don't have an account? <Link to="/signup">Sign Up</Link></p>
            </form>
          </article>
        </section>
      </main>
    </>
  );
}
