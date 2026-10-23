'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { isAuthenticated, getCurrentUser, logoutUser } from '../lib/auth'

const NAV_LINKS = [
  { href: '/dashboard',       label: 'Explore Market' },
  { href: '/resume',          label: 'Resume Analysis' },
  { href: '/skill-gap',       label: 'Skill Insights' },
  { href: '/recommendations', label: 'Jobs' },
  { href: '/insights',        label: 'Model Insights' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [navStyle, setNavStyle] = useState({
    transform: 'translateY(0)',
    opacity: 1,
    pointerEvents: 'auto',
  })

  useEffect(() => {
    setLoggedIn(isAuthenticated())
    setUser(getCurrentUser())
  }, [pathname])

  useEffect(() => {
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
        // When scrolling DOWN: keep navbar hidden
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
    setUser(null)
    router.push('/signin')
  }

  return (
    <>
      {/* ── SMART HIDING FLOATING PILL NAVBAR ── */}
      <div className="ciq-sticky-nav-wrapper" style={navStyle}>
        <header className="ciq-pill-navbar" aria-label="Main Navigation">
          {/* Brand Logo */}
          <Link href="/" className="ciq-pill-logo" aria-label="CareerIQ Homepage">
            <div className="ciq-pill-logo-mark">
              <span /><span /><span /><span />
            </div>
            <span className="ciq-pill-brand">
              Career<em>IQ</em>
            </span>
          </Link>

          {/* Primary Nav */}
          <nav aria-label="Main navigation" className="ciq-pill-nav">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={`ciq-pill-nav-link ${isActive ? 'ciq-pill-nav-active' : ''}`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Header Actions */}
          <div className="ciq-pill-actions">
            {loggedIn ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                  <span>{user?.name || 'Engineer'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="ciq-pill-signout"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link href={`/signin?redirect=${encodeURIComponent(pathname || '/dashboard')}`} className="ciq-pill-signin">
                Sign in
              </Link>
            )}
            <Link href="/resume" className="ciq-pill-btn-primary">
              <span>Analyse Resume</span>
            </Link>

            {/* Mobile hamburger */}
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.375rem',
                color: 'var(--color-text-body)',
              }}
              className="mobile-menu-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </header>
      </div>

      {/* Spacing under fixed navbar */}
      <div style={{ height: '4.25rem' }} />

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--color-surface)',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem 1.5rem',
            gap: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" className="ciq-navbar-logo" onClick={() => setMobileOpen(false)}>
              <div className="ciq-navbar-logo-mark">
                <span /><span /><span /><span />
              </div>
              <span className="ciq-navbar-brand">Career<em>IQ</em></span>
            </Link>
            <button
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-body)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <nav>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {[{ href: '/', label: 'Home' }, ...NAV_LINKS].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: 'block',
                      padding: '0.875rem 1rem',
                      borderRadius: '12px',
                      fontWeight: 600,
                      fontSize: '1rem',
                      color: pathname === href ? 'var(--color-brand-600)' : 'var(--color-text-secondary)',
                      background: pathname === href ? 'var(--color-brand-50)' : 'transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
            <Link href="/dashboard" className="btn btn-secondary btn-md" onClick={() => setMobileOpen(false)}>
              Explore Market
            </Link>
            <Link href="/resume" className="btn btn-primary btn-md" onClick={() => setMobileOpen(false)}>
              Analyse Resume
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .ciq-navbar-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .ciq-navbar-actions .btn-secondary { display: none !important; }
        }
      `}</style>
    </>
  )
}
