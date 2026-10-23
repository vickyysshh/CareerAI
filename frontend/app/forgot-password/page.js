'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function ForgotPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 1000))
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="si-root">
      <header className="si-topbar">
        <Link href="/" className="si-logo" aria-label="CareerIQ Homepage">
          <div className="si-logo-mark">
            <span /><span /><span /><span />
          </div>
          <span className="si-logo-text">Career<em>IQ</em></span>
        </Link>
        <div className="si-topbar-right">
          <span className="si-topbar-copy">Remember your password?</span>
          <Link href={`/signin?redirect=${encodeURIComponent(redirectUrl)}`} className="si-topbar-link">Sign in »</Link>
        </div>
      </header>

      <main className="si-main" style={{ justifyContent: 'center', paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="si-card" style={{ maxWidth: '440px', width: '100%' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: '56px', height: '56px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1d7bf0" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.49 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.04z"/>
                </svg>
              </div>
              <h2 className="si-card-title">Check your email.</h2>
              <p className="si-card-sub" style={{ marginTop: '0.5rem' }}>
                If <strong>{email}</strong> is registered, you&apos;ll receive a password reset link shortly.
              </p>
              <button onClick={() => router.push('/signin')} className="si-submit" style={{ marginTop: '1.5rem' }}>
                Back to Sign in
              </button>
            </div>
          ) : (
            <>
              <div className="si-card-head">
                <h2 className="si-card-title">Reset your password.</h2>
                <p className="si-card-sub">Enter your email and we&apos;ll send you a reset link.</p>
              </div>

              {error && (
                <div className="si-error-banner" role="alert">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="si-form" noValidate>
                <div className="si-field">
                  <label htmlFor="fp-email" className="si-label">Email address</label>
                  <div className="si-input-box">
                    <svg className="si-field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                    </svg>
                    <input id="fp-email" type="email" placeholder="you@example.com" value={email}
                      onChange={e => setEmail(e.target.value)} autoComplete="email" className="si-input" disabled={loading} />
                  </div>
                </div>
                <button type="submit" id="fp-submit-btn" className="si-submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
                  {loading ? <span className="si-spinner" /> : 'Send reset link'}
                </button>
              </form>

              <p className="si-create-account" style={{ marginTop: '1.25rem' }}>
                <Link href="/signin" className="si-create-link">← Back to Sign in</Link>
              </p>
            </>
          )}
        </div>
      </main>

      <footer className="si-footer">
        <span className="si-footer-copy">© 2026 CareerIQ. A clearer path forward.</span>
        <div className="si-footer-links">
          <Link href="/privacy" className="si-footer-link">Privacy policy</Link>
          <Link href="/terms" className="si-footer-link">Terms of service</Link>
          <Link href="/help" className="si-footer-link">Need help?</Link>
        </div>
      </footer>

      <style>{`
        .si-root{min-height:100vh;background:#F0F2F7;display:flex;flex-direction:column;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1e293b;}
        .si-topbar{display:flex;align-items:center;justify-content:space-between;padding:1.125rem 2.5rem;border-bottom:1px solid rgba(226,232,240,0.7);background:#F0F2F7;}
        .si-logo{display:flex;align-items:center;gap:0.625rem;text-decoration:none;}
        .si-logo-mark{width:32px;height:32px;border-radius:10px;background:#0f172a;display:grid;grid-template-columns:1fr 1fr;gap:3px;padding:6px;box-shadow:0 2px 8px rgba(15,23,42,0.15);}
        .si-logo-mark span:nth-child(1){background:#1d7bf0;border-radius:2px;} .si-logo-mark span:nth-child(2){background:#fff;border-radius:2px;} .si-logo-mark span:nth-child(3){background:#fff;border-radius:2px;} .si-logo-mark span:nth-child(4){background:#94a3b8;border-radius:2px;}
        .si-logo-text{font-size:1.1875rem;font-weight:800;letter-spacing:-0.025em;color:#0f172a;} .si-logo-text em{font-style:normal;color:#1466e3;}
        .si-topbar-right{display:flex;align-items:center;gap:0.4rem;font-size:0.875rem;}
        .si-topbar-copy{color:#64748b;}
        .si-topbar-link{color:#1d7bf0;font-weight:600;text-decoration:none;transition:color 0.15s;} .si-topbar-link:hover{color:#0f4ec7;text-decoration:underline;}
        .si-main{flex:1;display:flex;align-items:center;justify-content:center;max-width:1160px;width:100%;margin:0 auto;padding:3rem 2.5rem;gap:5rem;}
        .si-card{background:#fff;border-radius:20px;border:1px solid rgba(226,232,240,0.8);box-shadow:0 24px 50px -10px rgba(15,23,42,0.1),0 8px 20px -5px rgba(15,23,42,0.05);padding:2.125rem 1.875rem;width:100%;}
        .si-card-head{margin-bottom:1.375rem;}
        .si-card-title{font-size:1.5625rem;font-weight:800;color:#0f172a;letter-spacing:-0.03em;margin-bottom:0.3rem;}
        .si-card-sub{font-size:0.875rem;color:#64748b;line-height:1.5;font-weight:400;}
        .si-error-banner{display:flex;align-items:flex-start;gap:0.5rem;padding:0.75rem 0.875rem;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#dc2626;font-size:0.875rem;font-weight:500;margin-bottom:1rem;}
        .si-form{display:flex;flex-direction:column;gap:0.875rem;}
        .si-field{display:flex;flex-direction:column;gap:0.3rem;}
        .si-label{font-size:0.875rem;font-weight:600;color:#1e293b;}
        .si-input-box{display:flex;align-items:center;background:#fff;border:1px solid rgba(226,232,240,1);border-radius:10px;transition:border-color 0.15s,box-shadow 0.15s;overflow:hidden;}
        .si-input-box:focus-within{border-color:#1d7bf0;box-shadow:0 0 0 3px rgba(29,123,240,0.12);}
        .si-field-icon{flex-shrink:0;margin-left:0.875rem;color:#94a3b8;pointer-events:none;}
        .si-input{flex:1;border:none;outline:none;background:transparent;padding:0.75rem 0.875rem;font-family:inherit;font-size:0.9375rem;color:#1e293b;min-width:0;}
        .si-input::placeholder{color:#94a3b8;} .si-input:disabled{opacity:0.6;}
        .si-submit{width:100%;padding:0.875rem 1.5rem;background:#1d7bf0;color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:1rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.5rem;transition:background 0.2s,transform 0.15s,box-shadow 0.2s;box-shadow:0 8px 24px -5px rgba(29,123,240,0.38);}
        .si-submit:hover:not(:disabled){background:#1466e3;transform:translateY(-1px);} .si-submit:disabled{opacity:0.7;cursor:not-allowed;}
        .si-spinner{display:inline-block;width:19px;height:19px;border:2.5px solid rgba(255,255,255,0.35);border-top-color:#fff;border-radius:50%;animation:si-spin 0.65s linear infinite;}
        @keyframes si-spin{to{transform:rotate(360deg);}}
        .si-create-account{text-align:center;font-size:0.875rem;color:#64748b;}
        .si-create-link{color:#1d7bf0;font-weight:700;text-decoration:none;transition:color 0.15s;} .si-create-link:hover{color:#0f4ec7;text-decoration:underline;}
        .si-footer{display:flex;align-items:center;justify-content:space-between;padding:1rem 2.5rem;border-top:1px solid rgba(226,232,240,0.7);}
        .si-footer-copy{font-size:0.8125rem;color:#94a3b8;}
        .si-footer-links{display:flex;align-items:center;gap:1.375rem;}
        .si-footer-link{font-size:0.8125rem;color:#64748b;text-decoration:none;transition:color 0.15s;} .si-footer-link:hover{color:#1d7bf0;}
        @media(max-width:600px){.si-topbar{padding:1rem 1.25rem;}.si-main{padding:1.5rem 1rem;}.si-card{padding:1.625rem 1.25rem;}.si-footer{flex-direction:column;gap:0.75rem;padding:1rem 1.25rem;}}
      `}</style>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F0F2F7' }} />}>
      <ForgotPasswordContent />
    </Suspense>
  )
}

