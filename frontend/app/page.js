'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AuthLink from './components/AuthLink'
import { isAuthenticated, getCurrentUser, logoutUser } from './lib/auth'

/* ============================================================
   CareerIQ — Landing Page
   Design: Faithful to landingpage.html reference
   - Light background (#F4F6FA / dot-mesh)
   - Brand blue (#1d7bf0)
   - Plus Jakarta Sans
   - Tactile card shadows, rounded-full buttons
   - Floating tactile cards around hero
   ============================================================ */

export default function LandingPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [navStyle, setNavStyle] = useState({
    transform: 'translateY(0)',
    opacity: 1,
    pointerEvents: 'auto',
  })

  useEffect(() => {
    setLoggedIn(isAuthenticated())
    setCurrentUser(getCurrentUser())

    let prevScrollY = window.scrollY

    function handleScroll() {
      const currentY = window.scrollY

      // As user scrolls down from top (0-100px): gradually slide up and fade away
      if (currentY <= 100) {
        const progress = Math.min(1, Math.max(0, currentY / 90))
        setNavStyle({
          transform: `translateY(-${progress * 130}%)`,
          opacity: Math.max(0, 1 - progress * 1.15),
          pointerEvents: progress > 0.7 ? 'none' : 'auto',
          transition: 'transform 0.15s ease-out, opacity 0.15s ease-out',
        })
      } else {
        // Deeper in page:
        // When scrolling DOWN: keep navbar hidden (disappeared)
        if (currentY > prevScrollY + 4) {
          setNavStyle({
            transform: 'translateY(-140%)',
            opacity: 0,
            pointerEvents: 'none',
            transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
          })
        }
        // When scrolling UP: smoothly bring it back into view
        else if (currentY < prevScrollY - 4) {
          setNavStyle({
            transform: 'translateY(0)',
            opacity: 1,
            pointerEvents: 'auto',
            transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
          })
        }
      }

      prevScrollY = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function handleSignOut() {
    logoutUser()
    setLoggedIn(false)
    setCurrentUser(null)
  }

  return (
    <>
      {/* ── SMART HIDING FLOATING PILL NAVBAR + TICKER (share same scroll-away wrapper) ── */}
      <div className="ciq-sticky-nav-wrapper" style={navStyle}>
        <header className="ciq-pill-navbar" aria-label="Main Navigation">
          {/* Brand Logo */}
          <Link href="/" className="ciq-pill-logo" aria-label="CareerIQ Homepage">
            <div className="ciq-pill-logo-mark">
              <span /><span /><span /><span />
            </div>
            <span className="ciq-pill-brand">Career<em>IQ</em></span>
          </Link>

          {/* Navigation Links (restored to initial names) */}
          <nav aria-label="Main navigation" className="ciq-pill-nav">
            <a href="#features" className="ciq-pill-nav-link">Features</a>
            <a href="#solutions" className="ciq-pill-nav-link">How It Works</a>
            <a href="#market" className="ciq-pill-nav-link">Market Insights</a>
            <AuthLink href="/dashboard" className="ciq-pill-nav-link">Dashboard</AuthLink>
          </nav>

          {/* Actions: Sign in + Get Started (restored to initial names & actions) */}
          <div className="ciq-pill-actions">
            {loggedIn ? (
              <>
                <span className="ciq-pill-user">
                  Hi, {currentUser?.name || 'Engineer'}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="ciq-pill-signout"
                >
                  Sign out
                </button>
                <AuthLink href="/dashboard" className="ciq-pill-btn-primary">
                  Dashboard
                </AuthLink>
              </>
            ) : (
              <>
                <Link href="/signin" className="ciq-pill-signin">
                  Sign in
                </Link>
                <AuthLink href="/resume" className="ciq-pill-btn-primary">
                  Get Started
                </AuthLink>
              </>
            )}
          </div>
        </header>

        {/* ── MARKET INTELLIGENCE TICKER (shares scroll-away with navbar) ── */}
        {(() => {
          const tickerItems = [
            { dot: 'up',   label: 'AI/ML Engineers',        value: '+34%',   arrow: '▲', kind: 'up' },
            { dot: 'hot',  label: 'LLM Prompt Engineering', value: '🔥 Trending', kind: 'hot' },
            { dot: 'up',   label: 'Cloud Architects',       value: '$172K avg', kind: 'up' },
            { dot: 'new',  label: 'Rust Developers',        value: '↑ 61% YoY', kind: 'new' },
            { dot: 'info', label: 'Remote Jobs',            value: '47% of listings', kind: 'info' },
            { dot: 'up',   label: 'DevOps / SRE',           value: '+28% demand', kind: 'up' },
            { dot: 'down', label: 'Junior QA Roles',        value: '−18%', arrow: '▼', kind: 'down' },
            { dot: 'hot',  label: 'Cybersecurity',          value: '2.4M unfilled roles', kind: 'hot' },
            { dot: 'up',   label: 'Data Engineers',         value: '$148K avg', kind: 'up' },
            { dot: 'new',  label: 'React / Next.js',        value: '#1 Web Stack', kind: 'new' },
            { dot: 'info', label: 'Salary Negotiation',     value: 'Avg +12% w/ prep', kind: 'info' },
            { dot: 'up',   label: 'GenAI Startups',         value: '+210% hiring', kind: 'up' },
            { dot: 'hot',  label: 'Python',                 value: 'Most demanded skill', kind: 'hot' },
            { dot: 'up',   label: 'Product Managers',       value: '$135K median', kind: 'up' },
            { dot: 'new',  label: 'FinTech Engineering',    value: 'Fast-growing sector', kind: 'new' },
            { dot: 'info', label: 'Interview Pass Rate',    value: 'CareerIQ +38%', kind: 'info' },
          ]

          const Track = () => (
            <>
              {tickerItems.map((item, i) => (
                <span key={i} className="ciq-ticker-item" title={`${item.label}: ${item.value}`}>
                  <span className={`ciq-ticker-dot ${item.dot}`} />
                  <span className="ciq-ticker-item-label">{item.label}</span>
                  <span className={`ciq-ticker-item-value ${item.kind}`}>{item.value}</span>
                  {item.arrow && <span className={`ciq-ticker-arrow ${item.kind}`}>{item.arrow}</span>}
                </span>
              ))}
            </>
          )

          return (
            <div className="ciq-ticker-strip" style={{ marginTop: '0.25rem' }} aria-label="Market Intelligence Ticker" role="marquee">
              <div className="ciq-ticker-viewport">
                <div className="ciq-ticker-track" aria-hidden="true">
                  <Track />
                  <Track />
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* ── MAIN CONTENT (natural compact spacing) ── */}
      <main style={{ width: '100%', paddingBottom: '5rem', paddingTop: '4.5rem' }}>

        {/* ── HERO CANVAS (dot-mesh) ── */}
        <div
          className="dot-mesh-bg"
          style={{
            position: 'relative',
            width: '100%',
            borderBottom: '1px solid rgba(226,232,240,0.8)',
            overflow: 'hidden',
            padding: '1.25rem 1rem 3rem',
          }}
        >
          {/* Center Hero Content */}
          <section aria-label="Hero Introduction" style={{
            maxWidth: '48rem',
            margin: '0 auto',
            textAlign: 'center',
            position: 'relative',
            zIndex: 20,
          }}>
            {/* 3D Tactile App Icon Badge */}
            <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: '80px', height: '80px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                border: '1px solid rgba(255,255,255,0.8)',
                boxShadow: '0 12px 25px -4px rgba(0,0,0,0.12), 0 4px 8px -2px rgba(0,0,0,0.06), inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -3px 6px rgba(0,0,0,0.08)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                padding: '18px',
                transform: 'translateZ(0)',
                transition: 'transform 0.3s',
                cursor: 'default',
              }}>
                <span style={{ borderRadius: '50%', background: 'var(--color-brand-500)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }} />
                <span style={{ borderRadius: '50%', background: '#0f172a', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }} />
                <span style={{ borderRadius: '50%', background: '#0f172a', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }} />
                <span style={{ borderRadius: '50%', background: '#0f172a', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }} />
              </div>
            </div>

            {/* Main Headline */}
            <h1 style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.03em',
              lineHeight: 1.08,
              marginBottom: '1rem',
            }}>
              Build Your Career Around
              <span style={{ display: 'block', color: '#94a3b8', fontWeight: 600, marginTop: '0.25rem' }}>
                What the Market Needs.
              </span>
            </h1>

            {/* Subheading */}
            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.125rem)',
              color: 'var(--color-text-secondary)',
              maxWidth: '36rem',
              margin: '0 auto',
              lineHeight: 1.7,
              fontWeight: 400,
              marginBottom: '2rem',
            }}>
              Analyze your resume, discover in-demand skills, understand your skill gaps,
              and explore career opportunities using real job-market insights.
            </p>

            {/* Primary CTA */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <AuthLink href="/resume" className="btn btn-primary btn-lg">
                Analyze My Resume
              </AuthLink>
              <AuthLink href="/dashboard" className="btn btn-secondary btn-lg">
                Explore Job Market
              </AuthLink>
            </div>
          </section>

          {/* ── FLOATING TACTILE CARDS (exactly from landingpage.html) ── */}
          <div aria-hidden="true" style={{ width: '100%', position: 'relative', marginTop: '3rem', pointerEvents: 'none' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', minHeight: '300px' }}>

              {/* Top Left: Sticky Note Group */}
              <div style={{
                position: 'absolute',
                top: '-300px',
                left: '0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '1rem',
                pointerEvents: 'auto',
              }} className="hero-card-topleft">
                {/* Yellow Sticky Note */}
                <div className="skew-sticky" style={{
                  width: '14rem',
                  padding: '1.25rem',
                  borderRadius: '6px',
                  background: '#FFF78A',
                  boxShadow: '0 15px 30px -10px rgba(148,115,20,0.2), 0 6px 12px -3px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  position: 'relative',
                }}>
                  {/* Pin */}
                  <div style={{
                    position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)',
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: '#dc2626', boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    border: '1px solid rgba(185,28,28,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fca5a5' }} />
                  </div>
                  <p style={{
                    fontFamily: 'cursive',
                    fontSize: '1.25rem',
                    color: '#1e293b',
                    lineHeight: 1.4,
                    marginTop: '0.5rem',
                    paddingTop: '0.25rem',
                  }}>
                    Track skill gaps & benchmark role demand with AI.
                  </p>
                </div>
                {/* Checkmark Tile */}
                <div style={{
                  width: '64px', height: '64px', borderRadius: '16px',
                  background: '#fff', border: '1px solid rgba(226,232,240,0.8)',
                  boxShadow: '0 20px 40px -15px rgba(15,23,42,0.08), 0 4px 12px -2px rgba(15,23,42,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginLeft: '2rem', marginTop: '-1.5rem',
                  transform: 'rotate(-3deg)',
                  transition: 'transform 0.2s',
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: 'var(--color-brand-500)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(29,123,240,0.35)',
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Top Right: Market Pulse Card */}
              <div style={{
                position: 'absolute',
                top: '-320px',
                right: '0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '0.75rem',
                pointerEvents: 'auto',
              }} className="hero-card-topright">
                {/* Stopwatch */}
                <div style={{
                  width: '80px', height: '80px', borderRadius: '16px',
                  background: '#fff', border: '1px solid rgba(226,232,240,0.8)',
                  boxShadow: '0 20px 40px -15px rgba(15,23,42,0.08), 0 4px 12px -2px rgba(15,23,42,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', marginRight: '-8px', marginBottom: '-18px', zIndex: 20,
                }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    border: '2px solid #1e293b',
                    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ position: 'absolute', top: '-8px', width: '14px', height: '4px', background: '#1e293b', borderRadius: '2px' }} />
                    <div style={{ width: '16px', height: '2px', background: '#1e293b', position: 'absolute', right: '50%', transformOrigin: 'right', transform: 'rotate(-45deg)', borderRadius: '2px' }} />
                    <div style={{ width: '20px', height: '2px', background: '#ef4444', position: 'absolute', right: '50%', transformOrigin: 'right', transform: 'rotate(90deg)', borderRadius: '2px' }} />
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0f172a', zIndex: 10 }} />
                  </div>
                </div>
                {/* Reminders Card */}
                <div className="skew-card-right" style={{
                  width: '18rem',
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '16px',
                  padding: '1rem',
                  boxShadow: '0 20px 40px -15px rgba(15,23,42,0.08), 0 4px 12px -2px rgba(15,23,42,0.04)',
                  border: '1px solid rgba(226,232,240,0.8)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>Market Alerts</span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#94a3b8' }}>Live Feed</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>Today's Skill Pulse</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '2px' }}>Python MLOps demand ↑ 12%</div>
                    <div style={{
                      marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: 'var(--color-brand-50)', color: 'var(--color-brand-700)',
                      padding: '4px 10px', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 600,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Updated · 09:15 AM
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Left: Skill Progress Widget */}
              <div style={{
                position: 'absolute',
                bottom: '-24px',
                left: '0',
                pointerEvents: 'auto',
              }} className="hero-card-bottomleft">
                <div style={{
                  width: '20rem',
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  boxShadow: '0 20px 40px -15px rgba(15,23,42,0.08), 0 4px 12px -2px rgba(15,23,42,0.04)',
                  border: '1px solid rgba(226,232,240,0.8)',
                  transform: 'rotate(-1deg)',
                  transition: 'transform 0.3s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>Skill Gap Progress</span>
                    <AuthLink href="/skill-gap" style={{ fontSize: '0.75rem', color: 'var(--color-brand-600)', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>View all</AuthLink>
                  </div>
                  {/* Progress Item 1 */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>8</span>
                        <span>PyTorch / Deep Learning</span>
                      </div>
                      <span style={{ color: '#64748b' }}>60%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: '60%', height: '100%', background: '#06b6d4', borderRadius: '9999px' }} />
                    </div>
                  </div>
                  {/* Progress Item 2 */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>3</span>
                        <span>Docker / Kubernetes</span>
                      </div>
                      <span style={{ color: '#64748b' }}>100%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: '100%', background: '#06b6d4', borderRadius: '9999px' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Right: Market Integrations Card */}
              <div style={{
                position: 'absolute',
                bottom: '-24px',
                right: '0',
                pointerEvents: 'auto',
              }} className="hero-card-bottomright">
                <div style={{
                  width: '20rem',
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  boxShadow: '0 20px 40px -15px rgba(15,23,42,0.08), 0 4px 12px -2px rgba(15,23,42,0.04)',
                  border: '1px solid rgba(226,232,240,0.8)',
                  transform: 'rotate(1deg)',
                  transition: 'transform 0.3s',
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                    12,000+ Job Postings Analyzed
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Role badges */}
                    {['MLE', 'DS', 'MLOps'].map((role, i) => (
                      <div key={role} style={{
                        width: '56px', height: '56px', borderRadius: '16px',
                        background: i === 0 ? '#eff6ff' : i === 1 ? '#ecfdf5' : '#faf5ff',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6875rem', fontWeight: 700,
                        color: i === 0 ? 'var(--color-brand-700)' : i === 1 ? 'var(--color-emerald-600)' : 'var(--color-purple-600)',
                        transition: 'transform 0.2s',
                        cursor: 'default',
                      }}>
                        {role}
                      </div>
                    ))}
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '16px',
                      background: '#fff', border: '1px solid rgba(226,232,240,0.8)',
                      boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      <div style={{ width: '100%', height: '12px', background: 'var(--color-brand-500)', borderRadius: '4px 4px 0 0' }} />
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>12</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          {/* Spacer for floating cards */}
          <div style={{ height: '140px' }} className="hero-spacer" />
        </div>

        {/* ── VALUE PROPOSITION CARDS (features) ── */}
        <section aria-label="Core Capabilities" id="features" style={{ marginTop: '5rem', scrollMarginTop: '5.5rem' }}>
          <div className="ciq-container">
            <div className="ciq-section-header">
              <div className="ciq-eyebrow">Intelligent Career Planning</div>
              <h2 style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
                fontWeight: 800, letterSpacing: '-0.025em',
                color: 'var(--color-text-heading)', marginBottom: '0.75rem',
              }}>
                Understand the Market.<br />
                <span style={{ display: 'inline-block' }}>Before You Enter It.</span>
              </h2>
              <p className="ciq-subtitle" style={{ marginTop: '0.75rem', fontSize: '1rem' }}>
                CareerIQ processes 12,000+ active job requisitions to distill your precise next career step
                with explainable AI insights.
              </p>
            </div>

            <div className="ciq-grid-3">
              <FeatureCard
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                iconBg="#eff6ff" iconColor="var(--color-brand-600)"
                title="Real-Time Skill Velocity"
                desc="Detect when framework demand shifts. Track trending competencies across top engineering roles and companies."
                linkText="Explore live index" linkColor="var(--color-brand-600)"
                href="/dashboard"
              />
              <FeatureCard
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                iconBg="#ecfdf5" iconColor="var(--color-emerald-600)"
                title="NLP Resume Analysis"
                desc="Upload your PDF or paste resume text. Our keyword extraction engine identifies skills and compares them to role requirements."
                linkText="Analyze your resume" linkColor="var(--color-emerald-600)"
                href="/resume"
              />
              <FeatureCard
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
                iconBg="#faf5ff" iconColor="var(--color-purple-600)"
                title="Explainable AI Matching"
                desc="No black-box rejections. CareerIQ provides point-by-point evidence showing your skill match, gaps, and experience fit."
                linkText="View recommendations" linkColor="var(--color-purple-600)"
                href="/recommendations"
              />
            </div>
          </div>
        </section>

        {/* ── WORKFLOW SEQUENCE (How It Works) ── */}
        <section aria-label="How CareerIQ Works" id="solutions" style={{ marginTop: '6rem', padding: '0 1.5rem', scrollMarginTop: '5.5rem' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', background: '#fff', borderRadius: '24px', padding: '2rem 2rem', border: '1px solid rgba(226,232,240,0.8)', boxShadow: 'var(--shadow-tactile)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-brand-600)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Autonomous Career System
                  </span>
                  <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.875rem)', fontWeight: 800, color: 'var(--color-text-heading)', marginTop: '0.5rem', letterSpacing: '-0.025em' }}>
                    From resume to opportunity in 4 steps
                  </h2>
                </div>
                <AuthLink href="/resume" style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-brand-600)', textDecoration: 'none', transition: 'color 0.15s' }}>
                  Start your analysis →
                </AuthLink>
              </div>
            </div>

            <div className="ciq-grid-4">
              <StepCard step="01" title="Analyze Your Resume" desc="Upload your PDF or paste text. Our NLP engine extracts canonical skills automatically." indicator="✓" indicatorStyle={{ color: '#475569', background: '#fff', border: '1px solid var(--color-border)' }} />
              <StepCard step="02" title="Calibrate Market Demand" accent="var(--color-brand-500)" title2 desc="See which skills are demanded for your target role, and how demand has trended." indicator="⟳" indicatorStyle={{ color: 'var(--color-brand-600)', background: '#fff', border: '1px solid var(--color-border)' }} />
              <StepCard step="03" title="Isolate Skill Gaps" desc="Pinpoint missing competencies. Missing skills are ranked by demand × growth signal." indicator="!" indicatorStyle={{ color: 'var(--color-amber-600)', background: '#fff', border: '1px solid var(--color-border)' }} />
              <StepCard step="04" title="Find Your Opportunities" desc="Get ranked job recommendations with matched skills and a transparent scoring formula." indicator="★" indicatorStyle={{ color: '#fff', background: 'var(--color-brand-500)', border: 'none' }} highlight />
            </div>
          </div>
        </section>

        {/* ── MARKET INSIGHTS SECTION ── */}
        <section aria-label="Market Insights" id="market" style={{ marginTop: '7rem', scrollMarginTop: '5.5rem' }}>
          <div className="ciq-container">
            <div style={{ display: 'flex', gap: '4rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div className="ciq-eyebrow">Explainable AI</div>
                <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--color-text-heading)', margin: '0.875rem 0 1rem' }}>
                  No Black Boxes.<br />Every Match Explained.
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                  CareerIQ shows exactly why a job was recommended — matched skills, missing skills,
                  experience fit, and market demand contribution. The scoring formula is transparent and documented.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {[
                    { label: 'Skill Similarity', value: '60%', color: 'var(--color-brand-500)', pct: 60 },
                    { label: 'Market Coverage', value: '40%', color: 'var(--color-emerald-600)', pct: 40 },
                    { label: 'Experience Fit', value: '100%', color: '#9333ea', pct: 100 },
                  ].map(({ label, value, color, pct }) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                        <span style={{ color, fontWeight: 700 }}>{value}</span>
                      </div>
                      <div className="ciq-progress-track">
                        <div className="ciq-progress-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', background: 'var(--color-surface-subtle)', padding: '0.625rem 0.875rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  Score = 0.6 × cosine_similarity + 0.4 × (0.6 × market_coverage + 0.4 × exp_fit)
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '280px' }}>
                <SampleJobCard />
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ROW ── */}
        <div style={{ background: '#fff', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '3rem 0', marginTop: '5rem' }}>
          <div className="ciq-container">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0' }}>
              {[
                { value: '12,000', label: 'Job Postings Analyzed', note: 'Synthetic dataset' },
                { value: '57', label: 'Canonical Skills Tracked', note: null },
                { value: '12', label: 'Roles Covered', note: null },
                { value: '33mo', label: 'Data Timespan', note: '2024–2026' },
                { value: '79.5%', label: 'Recommendation P@5', note: 'Market-aware model' },
              ].map((stat, i, arr) => (
                <div key={stat.label} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ padding: '0.5rem 2.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text-heading)' }}>{stat.value}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '2px' }}>{stat.label}</div>
                    {stat.note && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{stat.note}</div>}
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ width: '1px', height: '40px', background: 'var(--color-border)' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FINAL CTA / PRICING ── */}
        <section aria-label="Pricing and Assessment" id="pricing" style={{ marginTop: '5rem', scrollMarginTop: '5.5rem' }}>
          <div className="ciq-container">
            <div className="ciq-cta-dark">
              <div className="ciq-cta-dark-glow" />
              <div style={{ position: 'relative', zIndex: 10, maxWidth: '36rem', margin: '0 auto' }}>
                <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '1rem', color: '#fff' }}>
                  Ready to benchmark your true market leverage?
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                  Analyze your resume, identify skill gaps, and discover opportunities aligned
                  with what the market actually demands right now.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <AuthLink href="/resume" style={{
                    display: 'inline-flex', alignItems: 'center', padding: '0.875rem 1.75rem',
                    borderRadius: '9999px', fontSize: '0.9375rem', fontWeight: 700,
                    color: '#fff', background: 'var(--color-brand-500)',
                    boxShadow: '0 8px 25px -5px rgba(29,123,240,0.4)',
                    textDecoration: 'none', transition: 'all 0.2s',
                  }}>
                    Start Free Assessment
                  </AuthLink>
                  <AuthLink href="/dashboard" style={{
                    display: 'inline-flex', alignItems: 'center', padding: '0.875rem 1.75rem',
                    borderRadius: '9999px', fontSize: '0.9375rem', fontWeight: 700,
                    color: '#cbd5e1', background: '#0f172a', border: '1px solid #1e293b',
                    textDecoration: 'none', transition: 'all 0.2s',
                  }}>
                    Explore Job Market
                  </AuthLink>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER (matches landingpage.html exactly) ── */}
      <footer className="ciq-footer">
        <div className="ciq-footer-mesh" />
        <div className="ciq-footer-inner">

          {/* Market Pulse Digest Card */}
          <div className="ciq-footer-cta">
            <div style={{ maxWidth: '32rem' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.25rem 0.75rem', borderRadius: '9999px',
                background: 'var(--color-brand-50)', border: '1px solid var(--color-brand-100)',
                fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-brand-600)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem',
              }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: 'var(--color-brand-500)',
                  display: 'inline-block',
                  animation: 'ciq-ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
                }} />
                Live Market Index v1.0
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-heading)', letterSpacing: '-0.02em' }}>
                Stay ahead of in-demand skills
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', lineHeight: 1.6 }}>
                Get the latest shifts in AI/ML skill demand, role benchmarks, and career opportunity trends.
              </p>
            </div>
            <form style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', alignItems: 'center' }} onSubmit={e => e.preventDefault()}>
              <input
                type="email"
                placeholder="engineer@company.com"
                className="ciq-input"
                style={{ width: '280px', maxWidth: '100%' }}
              />
              <button type="submit" className="btn btn-primary btn-md" style={{ borderRadius: '12px' }}>
                Subscribe to Index
              </button>
            </form>
          </div>

          {/* Footer Grid */}
          <div className="ciq-footer-grid">
            {/* Brand Column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Link href="/" className="ciq-navbar-logo" style={{ marginBottom: '1rem', textDecoration: 'none' }} aria-label="CareerIQ Homepage">
                <div className="ciq-navbar-logo-mark">
                  <span /><span /><span /><span />
                </div>
                <span className="ciq-navbar-brand">Career<em>IQ</em></span>
              </Link>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-brand-600)', marginBottom: '0.5rem' }}>
                Algorithmic Career Intelligence
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, maxWidth: '20rem', marginBottom: '1.25rem' }}>
                Empowering engineers and tech professionals with skill benchmarking, market demand analysis,
                and explainable career recommendations.
              </p>
              {/* Status Pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.375rem 0.75rem', borderRadius: '9999px',
                background: '#fff', border: '1px solid rgba(226,232,240,0.8)',
                boxShadow: 'var(--shadow-sm)', fontSize: '0.6875rem', fontWeight: 500,
                color: 'var(--color-text-body)', marginBottom: '1.25rem',
              }}>
                <span className="ciq-pulse-dot" />
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Operational</span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ color: '#64748b' }}>Synthetic Dataset</span>
              </div>
              {/* Social chips */}
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                {[['GH', 'GitHub'], ['𝕏', 'X/Twitter'], ['IN', 'LinkedIn']].map(([label, title]) => (
                  <a key={label} href="#" title={title} style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: '#fff', border: '1px solid rgba(226,232,240,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)',
                    transition: 'all 0.2s', textDecoration: 'none',
                  }}>
                    {label}
                  </a>
                ))}
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <div className="ciq-footer-col-title">Platform</div>
              <ul className="ciq-footer-links">
                <li><AuthLink href="/dashboard">Market Dashboard</AuthLink></li>
                <li><AuthLink href="/resume">Resume Analysis</AuthLink></li>
                <li><AuthLink href="/skill-gap">Skill Gap Analysis</AuthLink></li>
                <li><AuthLink href="/recommendations">Job Recommendations</AuthLink></li>
                <li><AuthLink href="/insights">Model Insights</AuthLink></li>
              </ul>
            </div>

            {/* Market Pulse Links */}
            <div>
              <div className="ciq-footer-col-title">Market Pulse</div>
              <ul className="ciq-footer-links">
                <li><AuthLink href="/dashboard#skills">Skill Velocity</AuthLink></li>
                <li><AuthLink href="/dashboard#roles">Role Demand</AuthLink></li>
                <li><AuthLink href="/dashboard#trends">Skill Trends</AuthLink></li>
                <li><AuthLink href="/dashboard#salary">Salary Insights</AuthLink></li>
              </ul>
            </div>

            {/* Developers Links */}
            <div>
              <div className="ciq-footer-col-title">Developers</div>
              <ul className="ciq-footer-links">
                <li><AuthLink href="/insights">ML Methodology</AuthLink></li>
                <li><AuthLink href="/insights#evaluation">Model Evaluation</AuthLink></li>
                <li><AuthLink href="/insights#limitations">Limitations</AuthLink></li>
                <li><a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer">API Docs</a></li>
              </ul>
            </div>

            {/* Project Links */}
            <div>
              <div className="ciq-footer-col-title">Project</div>
              <ul className="ciq-footer-links">
                <li><AuthLink href="/insights#about">About CareerIQ</AuthLink></li>
                <li><AuthLink href="/insights#methodology">Methodology</AuthLink></li>
                <li><AuthLink href="/insights#limitations">Data Disclaimer</AuthLink></li>
                <li><Link href="/">Privacy</Link></li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom Bar */}
          <div className="ciq-footer-bottom">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', justifyContent: 'center', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-text-body)', fontSize: '0.75rem' }}>
                © 2026 CareerIQ — Final Year Project. All rights reserved.
              </span>
              <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>•</span>
              <span style={{ fontSize: '0.75rem' }}>
                Synthetic dataset · Not real labor-market data
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
              {['Privacy', 'Terms', 'Methodology', 'API Docs', 'Status'].map(item => (
                <a key={item} href="#" style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}>
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          .hero-card-topleft,
          .hero-card-topright,
          .hero-card-bottomleft,
          .hero-card-bottomright { display: none !important; }
          .hero-spacer { height: 0 !important; }
        }
        @media (max-width: 768px) {
          .ciq-navbar-nav { display: none !important; }
        }
      `}</style>
    </>
  )
}

/* ── Sub-components ── */

function FeatureCard({ icon, iconBg, iconColor, title, desc, linkText, linkColor, href }) {
  return (
    <article className="ciq-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div className="ciq-card-body" style={{ paddingBottom: 0 }}>
        <div className="ciq-card-icon" style={{ background: iconBg, color: iconColor }}>
          {icon}
        </div>
        <h3 className="ciq-h3" style={{ marginBottom: '0.625rem' }}>{title}</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{desc}</p>
      </div>
      <div style={{ padding: '0 1.75rem 1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)', marginTop: '1.5rem' }}>
        <AuthLink href={href} style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: linkColor, textDecoration: 'none', gap: '0.25rem' }}>
          {linkText} <span>→</span>
        </AuthLink>
      </div>
    </article>
  )
}

function StepCard({ step, title, desc, indicator, indicatorStyle, accent, highlight }) {
  return (
    <div className="ciq-step-card" style={highlight ? { border: '1px solid var(--color-brand-100)', background: '#fafeff' } : {}}>
      <div>
        <span className="ciq-step-number" style={{ color: highlight ? 'var(--color-brand-500)' : '#94a3b8' }}>{step}</span>
        <h4 className="ciq-step-title" style={{ marginTop: '0.5rem' }}>{title}</h4>
        <p className="ciq-step-desc" style={{ marginTop: '0.375rem' }}>{desc}</p>
      </div>
      <div style={{
        marginTop: '1.25rem', width: '32px', height: '32px', borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.875rem', fontWeight: 700,
        boxShadow: highlight ? 'var(--shadow-sm)' : 'none',
        ...indicatorStyle,
      }}>
        {indicator}
      </div>
    </div>
  )
}

function SampleJobCard() {
  return (
    <div className="ciq-job-card" style={{ maxWidth: '480px', margin: '0 auto' }}>
      <div className="ciq-job-card-header">
        <div>
          <div className="ciq-job-title">Machine Learning Engineer</div>
          <div className="ciq-job-company">Synaptiq · Bengaluru · Hybrid</div>
        </div>
        <div className="ciq-match-score">82%</div>
      </div>

      <div className="ciq-job-meta">
        <span className="ciq-job-meta-item">💼 3–6 years</span>
        <span className="ciq-job-meta-item">💰 18–24 LPA</span>
        <span className="ciq-job-meta-item">🎓 B.Tech</span>
      </div>

      <div style={{ marginBottom: '0.875rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-emerald-600)', marginBottom: '0.5rem' }}>✅ Matched Skills</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {['Python', 'PyTorch', 'Docker', 'AWS'].map(s => (
            <span key={s} className="ciq-skill-tag ciq-skill-have">{s}</span>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '0.875rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-red-600)', marginBottom: '0.5rem' }}>⚠️ Missing Skills</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {['MLflow', 'Kubernetes'].map(s => (
            <span key={s} className="ciq-skill-tag ciq-skill-missing">{s}</span>
          ))}
        </div>
      </div>

      <div className="ciq-job-explanation">
        Matched 4/6 required skills. Strong market coverage (79%). Experience: Well matched.
        Missing MLflow and Kubernetes — both in high market demand for this role.
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', paddingTop: '0.875rem', marginTop: '0.875rem', borderTop: '1px solid var(--color-border)' }}>
        ⚠️ Illustrative example — connect to backend for real recommendations
      </div>
    </div>
  )
}
