'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { loginUser } from '../lib/auth'

function getDestinationLabel(path) {
  if (!path) return 'Market Dashboard'
  if (path.startsWith('/resume')) return 'Resume Analysis'
  if (path.startsWith('/skill-gap')) return 'Skill Gap Analysis'
  if (path.startsWith('/recommendations')) return 'Job Recommendations'
  if (path.startsWith('/insights')) return 'Model Insights'
  if (path.startsWith('/dashboard')) return 'Market Dashboard'
  return path
}

/* ============================================================
   CareerIQ — Sign In Page
   Faithfully implements the Figma design:
   - Light grey (#F0F2F7) full-page background
   - Top bar: CareerIQ logo left, "New to CareerIQ? Create an account »" right
   - Two-column main: left=value prop+illustration, right=auth card
   - Footer: copyright left, links right
   ============================================================ */

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  function validate() {
    const errs = {}
    if (!email.trim()) errs.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address.'
    if (!password) errs.password = 'Password is required.'
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters.'
    return errs
  }

  async function handleSignIn(e) {
    e.preventDefault()
    setError('')
    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return
    setLoading(true)
    try {
      loginUser({ email })
      if (rememberMe) {
        localStorage.setItem('ciq_remember', 'true')
      }
      await new Promise(r => setTimeout(r, 600))
      router.push(redirectUrl)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleGoogle() {
    // Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID + backend /auth/google endpoint.
    // window.location.href = `${process.env.NEXT_PUBLIC_API}/auth/google`
    setError('Google sign-in requires OAuth configuration. See README for setup instructions.')
  }

  function handleGitHub() {
    // Requires backend /auth/github endpoint.
    // window.location.href = `${process.env.NEXT_PUBLIC_API}/auth/github`
    setError('GitHub sign-in requires OAuth configuration. See README for setup instructions.')
  }

  return (
    <div className="si-root">

      {/* TOP BAR */}
      <header className="si-topbar">
        <Link href="/" className="si-logo" aria-label="CareerIQ Homepage">
          <div className="si-logo-mark">
            <span /><span /><span /><span />
          </div>
          <span className="si-logo-text">Career<em>IQ</em></span>
        </Link>
        <div className="si-topbar-right">
          <span className="si-topbar-copy">New to CareerIQ?</span>
          <Link href={`/register?redirect=${encodeURIComponent(redirectUrl)}`} className="si-topbar-link">Create an account »</Link>
        </div>
      </header>

      {/* MAIN TWO-COLUMN */}
      <main className="si-main">

        {/* LEFT PANEL */}
        <section className="si-left" aria-label="CareerIQ value proposition">
          <div className="si-eyebrow">
            <span className="si-eyebrow-bar" />
            YOUR CAREER, WITH CLARITY
          </div>

          <h1 className="si-headline">
            Your next chapter,{' '}
            <span className="si-headline-blue">with a clearer plan.</span>
          </h1>

          <p className="si-subtext">
            Think, plan, and track your engineering career in one place. Turn live market
            insights into your next confident move.
          </p>

          {/* Illustration */}
          <div className="si-illus-wrap" aria-hidden="true">
            {/* Dashboard card */}
            <div className="si-dash-card">
              <div className="si-dash-head">
                <div className="si-dash-check">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="si-dash-title">Today's Skill Gaps</div>
                  <div className="si-dash-sub">Your path to Senior Engineer</div>
                </div>
                <svg className="si-dash-chart-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d7bf0" strokeWidth="2">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                  <polyline points="16 7 22 7 22 13"/>
                </svg>
              </div>

              <div className="si-skill-list">
                {[
                  { name: 'System design', tag: 'High demand', pct: 72, color: '#1d7bf0' },
                  { name: 'Cloud architecture', tag: 'Trending ↑', pct: 55, color: '#059669' },
                  { name: 'Technical leadership', tag: 'Next to explore', pct: 38, color: '#d97706' },
                ].map(({ name, tag, pct, color }) => (
                  <div key={name} className="si-skill-row">
                    <div className="si-skill-meta">
                      <span className="si-skill-name">{name}</span>
                      <span className="si-skill-tag" style={{ color }}>{tag}</span>
                    </div>
                    <div className="si-bar-bg">
                      <div className="si-bar-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="si-insight-row">
                <div className="si-insight-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1d7bf0" strokeWidth="2">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                    <polyline points="16 7 22 7 22 13"/>
                  </svg>
                </div>
                <div>
                  <div className="si-insight-title">Stay ahead of demand</div>
                  <div className="si-insight-sub">Live insights. Clear next steps.</div>
                </div>
              </div>
            </div>

            {/* Floating yellow sticky note */}
            <div className="si-sticky">
              <div className="si-sticky-pin" />
              <p className="si-sticky-text">Small steps. Big career energy.</p>
            </div>
          </div>

          {/* Feature badges */}
          <div className="si-badges">
            {['Spot skill gaps', 'Explore role demand', 'Track your growth'].map(label => (
              <span key={label} className="si-badge">
                <span className="si-badge-check">✓</span>
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* RIGHT PANEL — Auth Card */}
        <section className="si-right" aria-label="Sign in form">
          <div className="si-card">

            {/* Card header */}
            <div className="si-card-head">
              <h2 className="si-card-title">Welcome back.</h2>
              <p className="si-card-sub">Your next move starts here. Sign in to CareerIQ.</p>
            </div>

            {/* Target route notice */}
            {redirectUrl && redirectUrl !== '/dashboard' && (
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '0.625rem 0.875rem',
                fontSize: '0.8125rem',
                color: '#1d4ed8',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 500,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ flexShrink: 0 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Please sign in to access <strong>{getDestinationLabel(redirectUrl)}</strong>. You will be redirected right after.</span>
              </div>
            )}

            {/* Global error */}
            {error && (
              <div className="si-error-banner" role="alert">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSignIn} className="si-form" noValidate>

              {/* Email field */}
              <div className="si-field">
                <label htmlFor="si-email" className="si-label">Email address</label>
                <div className={`si-input-box${fieldErrors.email ? ' si-input-err' : ''}`}>
                  <svg className="si-field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="M2 7l10 7 10-7"/>
                  </svg>
                  <input
                    id="si-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })) }}
                    autoComplete="email"
                    className="si-input"
                    disabled={loading}
                  />
                </div>
                {fieldErrors.email && <span className="si-field-err">{fieldErrors.email}</span>}
              </div>

              {/* Password field */}
              <div className="si-field">
                <label htmlFor="si-password" className="si-label">Password</label>
                <div className={`si-input-box${fieldErrors.password ? ' si-input-err' : ''}`}>
                  <svg className="si-field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    id="si-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })) }}
                    autoComplete="current-password"
                    className="si-input"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="si-eye-btn"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {fieldErrors.password && <span className="si-field-err">{fieldErrors.password}</span>}
              </div>

              {/* Remember me + Forgot password */}
              <div className="si-row-between">
                <label className="si-remember-label" htmlFor="si-remember">
                  <input
                    id="si-remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="si-checkbox"
                    disabled={loading}
                  />
                  Remember me
                </label>
                <Link href={`/forgot-password?redirect=${encodeURIComponent(redirectUrl)}`} className="si-forgot">Forgot password?</Link>
              </div>

              {/* Sign in button */}
              <button
                type="submit"
                id="si-submit-btn"
                className="si-submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="si-spinner" aria-label="Signing in…" />
                ) : (
                  <>
                    Sign in
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="si-divider"><span>or continue with</span></div>

            {/* Social buttons */}
            <div className="si-socials">
              <button type="button" id="si-google-btn" className="si-social-btn" onClick={handleGoogle} disabled={loading}>
                <svg width="17" height="17" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button type="button" id="si-github-btn" className="si-social-btn" onClick={handleGitHub} disabled={loading}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </button>
            </div>

            {/* Create account */}
            <p className="si-create-account">
              Don&apos;t have an account?{' '}
              <Link href={`/register?redirect=${encodeURIComponent(redirectUrl)}`} className="si-create-link">Create an account</Link>
            </p>

            {/* Privacy */}
            <p className="si-privacy">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Your career is personal. Your data stays private.
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="si-footer">
        <span className="si-footer-copy">© 2026 CareerIQ. A clearer path forward.</span>
        <div className="si-footer-links">
          <Link href="/privacy" className="si-footer-link">Privacy policy</Link>
          <Link href="/terms" className="si-footer-link">Terms of service</Link>
          <Link href="/help" className="si-footer-link">Need help?</Link>
        </div>
      </footer>

      <style>{`
        /* ========================================
           SIGN IN PAGE — scoped styles (si- prefix)
           ======================================== */

        .si-root {
          min-height: 100vh;
          background: #F0F2F7;
          display: flex;
          flex-direction: column;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #1e293b;
        }

        /* ── Top Bar ── */
        .si-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.125rem 2.5rem;
          background: transparent;
          border-bottom: 1px solid rgba(226,232,240,0.7);
          position: sticky;
          top: 0;
          z-index: 40;
          background: #F0F2F7;
        }
        .si-logo {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          text-decoration: none;
        }
        .si-logo-mark {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: #0f172a;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3px;
          padding: 6px;
          box-shadow: 0 2px 8px rgba(15,23,42,0.15);
        }
        .si-logo-mark span:nth-child(1) { background: #1d7bf0; border-radius: 2px; }
        .si-logo-mark span:nth-child(2) { background: #fff; border-radius: 2px; }
        .si-logo-mark span:nth-child(3) { background: #fff; border-radius: 2px; }
        .si-logo-mark span:nth-child(4) { background: #94a3b8; border-radius: 2px; }
        .si-logo-text {
          font-size: 1.1875rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          color: #0f172a;
        }
        .si-logo-text em { font-style: normal; color: #1466e3; }
        .si-topbar-right {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.875rem;
        }
        .si-topbar-copy { color: #64748b; }
        .si-topbar-link {
          color: #1d7bf0;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.15s;
        }
        .si-topbar-link:hover { color: #0f4ec7; text-decoration: underline; }

        /* ── Main layout ── */
        .si-main {
          flex: 1;
          display: flex;
          align-items: center;
          max-width: 1160px;
          width: 100%;
          margin: 0 auto;
          padding: 3rem 2.5rem;
          gap: 5rem;
        }

        /* ── Left Panel ── */
        .si-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .si-eyebrow {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #1d7bf0;
          margin-bottom: 1.125rem;
        }
        .si-eyebrow-bar {
          display: inline-block;
          width: 18px;
          height: 2px;
          background: #1d7bf0;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .si-headline {
          font-size: clamp(1.875rem, 3vw, 2.625rem);
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 1rem;
        }
        .si-headline-blue {
          color: #1d7bf0;
          display: block;
        }

        .si-subtext {
          font-size: 0.9375rem;
          color: #475569;
          line-height: 1.65;
          max-width: 28rem;
          margin-bottom: 1.75rem;
          font-weight: 400;
        }

        /* Illustration */
        .si-illus-wrap {
          position: relative;
          margin-bottom: 1.75rem;
          max-width: 440px;
        }

        .si-dash-card {
          background: #fff;
          border-radius: 14px;
          border: 1px solid rgba(226,232,240,0.9);
          box-shadow: 0 16px 32px -10px rgba(15,23,42,0.08), 0 4px 10px -2px rgba(15,23,42,0.04);
          padding: 1.125rem;
        }

        .si-dash-head {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          margin-bottom: 0.875rem;
        }
        .si-dash-check {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: #1d7bf0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .si-dash-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.01em;
        }
        .si-dash-sub {
          font-size: 0.6875rem;
          color: #64748b;
          margin-top: 1px;
        }
        .si-dash-chart-icon { margin-left: auto; flex-shrink: 0; }

        .si-skill-list {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
          margin-bottom: 0.875rem;
        }
        .si-skill-row { display: flex; flex-direction: column; gap: 0.25rem; }
        .si-skill-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .si-skill-name { font-size: 0.8125rem; font-weight: 600; color: #1e293b; }
        .si-skill-tag { font-size: 0.6875rem; font-weight: 600; }
        .si-bar-bg {
          height: 4px;
          background: #f1f5f9;
          border-radius: 99px;
          overflow: hidden;
        }
        .si-bar-fill {
          height: 100%;
          border-radius: 99px;
        }

        .si-insight-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.625rem;
          background: #eff6ff;
          border-radius: 9px;
          border: 1px solid rgba(29,123,240,0.14);
        }
        .si-insight-icon {
          width: 26px;
          height: 26px;
          background: #fff;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.07);
          flex-shrink: 0;
        }
        .si-insight-title { font-size: 0.75rem; font-weight: 700; color: #0f172a; }
        .si-insight-sub { font-size: 0.625rem; color: #64748b; }

        /* Sticky note */
        .si-sticky {
          position: absolute;
          top: -10px;
          right: -18px;
          width: 122px;
          background: #FFF78A;
          border-radius: 4px;
          padding: 0.875rem 0.75rem 0.75rem;
          box-shadow: 0 8px 20px -4px rgba(148,115,20,0.22), 0 3px 6px rgba(0,0,0,0.06);
          transform: rotate(3.5deg);
          border: 1px solid rgba(251,191,36,0.3);
        }
        .si-sticky-pin {
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          box-shadow: 0 2px 4px rgba(0,0,0,0.18);
        }
        .si-sticky-text {
          font-family: 'Caveat', cursive;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.35;
          margin-top: 0.2rem;
        }

        /* Feature badges */
        .si-badges {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
        }
        .si-badge {
          display: flex;
          align-items: center;
          gap: 0.3125rem;
          font-size: 0.8125rem;
          color: #475569;
          font-weight: 500;
        }
        .si-badge-check {
          color: #1d7bf0;
          font-weight: 700;
          font-size: 0.9rem;
          line-height: 1;
        }

        /* ── Right Panel ── */
        .si-right {
          flex-shrink: 0;
          width: 408px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .si-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid rgba(226,232,240,0.8);
          box-shadow: 0 24px 50px -10px rgba(15,23,42,0.1), 0 8px 20px -5px rgba(15,23,42,0.05);
          padding: 2.125rem 1.875rem;
          width: 100%;
        }

        .si-card-head { margin-bottom: 1.375rem; }
        .si-card-title {
          font-size: 1.5625rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.03em;
          margin-bottom: 0.3rem;
        }
        .si-card-sub {
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.5;
          font-weight: 400;
        }

        /* Error banner */
        .si-error-banner {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.75rem 0.875rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #dc2626;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1rem;
          line-height: 1.4;
        }
        .si-error-banner svg { flex-shrink: 0; margin-top: 1px; }

        /* Form */
        .si-form {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }
        .si-field {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .si-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
        }
        .si-input-box {
          display: flex;
          align-items: center;
          background: #fff;
          border: 1px solid rgba(226,232,240,1);
          border-radius: 10px;
          transition: border-color 0.15s, box-shadow 0.15s;
          overflow: hidden;
        }
        .si-input-box:focus-within {
          border-color: #1d7bf0;
          box-shadow: 0 0 0 3px rgba(29,123,240,0.12);
        }
        .si-input-box.si-input-err { border-color: #dc2626; }
        .si-input-box.si-input-err:focus-within {
          box-shadow: 0 0 0 3px rgba(220,38,38,0.1);
        }
        .si-field-icon {
          flex-shrink: 0;
          margin-left: 0.875rem;
          color: #94a3b8;
          pointer-events: none;
        }
        .si-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          padding: 0.75rem 0.875rem;
          font-family: inherit;
          font-size: 0.9375rem;
          color: #1e293b;
          min-width: 0;
        }
        .si-input::placeholder { color: #94a3b8; }
        .si-input:disabled { opacity: 0.6; }
        .si-eye-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem 0.875rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: color 0.15s;
        }
        .si-eye-btn:hover { color: #475569; }
        .si-field-err { font-size: 0.8125rem; color: #dc2626; font-weight: 500; }

        .si-row-between {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .si-remember-label {
          display: flex;
          align-items: center;
          gap: 0.4375rem;
          font-size: 0.875rem;
          color: #475569;
          cursor: pointer;
          user-select: none;
          font-weight: 500;
        }
        .si-checkbox {
          width: 15px;
          height: 15px;
          accent-color: #1d7bf0;
          cursor: pointer;
        }
        .si-forgot {
          font-size: 0.875rem;
          color: #1d7bf0;
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
          transition: color 0.15s;
        }
        .si-forgot:hover { color: #0f4ec7; text-decoration: underline; }

        /* Submit */
        .si-submit {
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: #1d7bf0;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          letter-spacing: -0.01em;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 8px 24px -5px rgba(29,123,240,0.38);
          margin-top: 0.125rem;
        }
        .si-submit:hover:not(:disabled) {
          background: #1466e3;
          transform: translateY(-1px);
          box-shadow: 0 12px 28px -5px rgba(29,123,240,0.44);
        }
        .si-submit:active:not(:disabled) { transform: translateY(0); }
        .si-submit:disabled { opacity: 0.7; cursor: not-allowed; }

        .si-spinner {
          display: inline-block;
          width: 19px;
          height: 19px;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: si-spin 0.65s linear infinite;
        }
        @keyframes si-spin { to { transform: rotate(360deg); } }

        /* Divider */
        .si-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.125rem 0;
          color: #94a3b8;
          font-size: 0.8125rem;
          font-weight: 500;
        }
        .si-divider::before,
        .si-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(226,232,240,1);
        }

        /* Social buttons */
        .si-socials {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.625rem;
          margin-bottom: 1.125rem;
        }
        .si-social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5625rem;
          padding: 0.6875rem 1rem;
          background: #fff;
          border: 1px solid rgba(226,232,240,1);
          border-radius: 10px;
          font-family: inherit;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1e293b;
          cursor: pointer;
          transition: background 0.15s, box-shadow 0.15s, border-color 0.15s;
          box-shadow: 0 1px 2px rgba(15,23,42,0.05);
        }
        .si-social-btn:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
          box-shadow: 0 3px 10px -2px rgba(15,23,42,0.07);
        }
        .si-social-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Create account */
        .si-create-account {
          text-align: center;
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 0.875rem;
        }
        .si-create-link {
          color: #1d7bf0;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.15s;
        }
        .si-create-link:hover { color: #0f4ec7; text-decoration: underline; }

        /* Privacy */
        .si-privacy {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: #94a3b8;
          border-top: 1px solid rgba(226,232,240,0.9);
          padding-top: 0.875rem;
        }

        /* ── Footer ── */
        .si-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2.5rem;
          border-top: 1px solid rgba(226,232,240,0.7);
        }
        .si-footer-copy { font-size: 0.8125rem; color: #94a3b8; }
        .si-footer-links { display: flex; align-items: center; gap: 1.375rem; }
        .si-footer-link {
          font-size: 0.8125rem;
          color: #64748b;
          text-decoration: none;
          transition: color 0.15s;
        }
        .si-footer-link:hover { color: #1d7bf0; }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .si-main {
            flex-direction: column;
            align-items: center;
            padding: 2rem 1.5rem;
            gap: 2.5rem;
          }
          .si-left {
            align-items: center;
            text-align: center;
            max-width: 520px;
            width: 100%;
          }
          .si-eyebrow { justify-content: center; }
          .si-subtext { margin-left: auto; margin-right: auto; text-align: center; }
          .si-badges { justify-content: center; }
          .si-illus-wrap { margin-left: auto; margin-right: auto; }
          .si-right { width: 100%; max-width: 480px; }
        }
        @media (max-width: 600px) {
          .si-topbar { padding: 1rem 1.25rem; }
          .si-main { padding: 1.5rem 1rem; gap: 2rem; }
          .si-card { padding: 1.625rem 1.25rem; }
          .si-socials { grid-template-columns: 1fr; }
          .si-sticky { display: none; }
          .si-footer { flex-direction: column; gap: 0.75rem; padding: 1rem 1.25rem; }
          .si-footer-links { flex-wrap: wrap; justify-content: center; gap: 1rem; }
        }
      `}</style>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F0F2F7' }} />}>
      <SignInContent />
    </Suspense>
  )
}
