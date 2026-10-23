'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { loginUser } from '../lib/auth'

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/dashboard'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  function validate() {
    const errs = {}
    if (!name.trim()) errs.name = 'Name is required.'
    if (!email.trim()) errs.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address.'
    if (!password) errs.password = 'Password is required.'
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters.'
    return errs
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return
    setLoading(true)
    try {
      loginUser({ name, email })
      await new Promise(r => setTimeout(r, 600))
      router.push(redirectUrl)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
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
          <span className="si-topbar-copy">Already have an account?</span>
          <Link href={`/signin?redirect=${encodeURIComponent(redirectUrl)}`} className="si-topbar-link">Sign in »</Link>
        </div>
      </header>

      <main className="si-main" style={{ justifyContent: 'center', paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="si-card" style={{ maxWidth: '440px', width: '100%' }}>
          <div className="si-card-head">
            <h2 className="si-card-title">Create your account.</h2>
            <p className="si-card-sub">Start your journey to smarter career decisions.</p>
          </div>

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

          <form onSubmit={handleRegister} className="si-form" noValidate>
            <div className="si-field">
              <label htmlFor="reg-name" className="si-label">Full name</label>
              <div className={`si-input-box${fieldErrors.name ? ' si-input-err' : ''}`}>
                <svg className="si-field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <input id="reg-name" type="text" placeholder="Jane Smith" value={name}
                  onChange={e => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: '' })) }}
                  autoComplete="name" className="si-input" disabled={loading} />
              </div>
              {fieldErrors.name && <span className="si-field-err">{fieldErrors.name}</span>}
            </div>

            <div className="si-field">
              <label htmlFor="reg-email" className="si-label">Email address</label>
              <div className={`si-input-box${fieldErrors.email ? ' si-input-err' : ''}`}>
                <svg className="si-field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                </svg>
                <input id="reg-email" type="email" placeholder="you@example.com" value={email}
                  onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })) }}
                  autoComplete="email" className="si-input" disabled={loading} />
              </div>
              {fieldErrors.email && <span className="si-field-err">{fieldErrors.email}</span>}
            </div>

            <div className="si-field">
              <label htmlFor="reg-password" className="si-label">Password</label>
              <div className={`si-input-box${fieldErrors.password ? ' si-input-err' : ''}`}>
                <svg className="si-field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" value={password}
                  onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })) }}
                  autoComplete="new-password" className="si-input" disabled={loading} />
                <button type="button" className="si-eye-btn" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide' : 'Show'}>
                  {showPassword ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && <span className="si-field-err">{fieldErrors.password}</span>}
            </div>

            <button type="submit" id="reg-submit-btn" className="si-submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? <span className="si-spinner" aria-label="Creating account…" /> : <>Create account <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
            </button>
          </form>

          <p className="si-create-account" style={{ marginTop: '1.25rem' }}>
            Already have an account?{' '}
            <Link href="/signin" className="si-create-link">Sign in</Link>
          </p>

          <p className="si-privacy">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Your career is personal. Your data stays private.
          </p>
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
        .si-topbar{display:flex;align-items:center;justify-content:space-between;padding:1.125rem 2.5rem;border-bottom:1px solid rgba(226,232,240,0.7);background:#F0F2F7;position:sticky;top:0;z-index:40;}
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
        .si-error-banner{display:flex;align-items:flex-start;gap:0.5rem;padding:0.75rem 0.875rem;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#dc2626;font-size:0.875rem;font-weight:500;margin-bottom:1rem;line-height:1.4;}
        .si-form{display:flex;flex-direction:column;gap:0.875rem;}
        .si-field{display:flex;flex-direction:column;gap:0.3rem;}
        .si-label{font-size:0.875rem;font-weight:600;color:#1e293b;}
        .si-input-box{display:flex;align-items:center;background:#fff;border:1px solid rgba(226,232,240,1);border-radius:10px;transition:border-color 0.15s,box-shadow 0.15s;overflow:hidden;}
        .si-input-box:focus-within{border-color:#1d7bf0;box-shadow:0 0 0 3px rgba(29,123,240,0.12);}
        .si-input-box.si-input-err{border-color:#dc2626;} .si-input-box.si-input-err:focus-within{box-shadow:0 0 0 3px rgba(220,38,38,0.1);}
        .si-field-icon{flex-shrink:0;margin-left:0.875rem;color:#94a3b8;pointer-events:none;}
        .si-input{flex:1;border:none;outline:none;background:transparent;padding:0.75rem 0.875rem;font-family:inherit;font-size:0.9375rem;color:#1e293b;min-width:0;}
        .si-input::placeholder{color:#94a3b8;} .si-input:disabled{opacity:0.6;}
        .si-eye-btn{background:none;border:none;cursor:pointer;padding:0.5rem 0.875rem;color:#94a3b8;display:flex;align-items:center;flex-shrink:0;transition:color 0.15s;} .si-eye-btn:hover{color:#475569;}
        .si-field-err{font-size:0.8125rem;color:#dc2626;font-weight:500;}
        .si-submit{width:100%;padding:0.875rem 1.5rem;background:#1d7bf0;color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:1rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.5rem;letter-spacing:-0.01em;transition:background 0.2s,transform 0.15s,box-shadow 0.2s;box-shadow:0 8px 24px -5px rgba(29,123,240,0.38);}
        .si-submit:hover:not(:disabled){background:#1466e3;transform:translateY(-1px);box-shadow:0 12px 28px -5px rgba(29,123,240,0.44);}
        .si-submit:disabled{opacity:0.7;cursor:not-allowed;}
        .si-spinner{display:inline-block;width:19px;height:19px;border:2.5px solid rgba(255,255,255,0.35);border-top-color:#fff;border-radius:50%;animation:si-spin 0.65s linear infinite;}
        @keyframes si-spin{to{transform:rotate(360deg);}}
        .si-create-account{text-align:center;font-size:0.875rem;color:#64748b;}
        .si-create-link{color:#1d7bf0;font-weight:700;text-decoration:none;transition:color 0.15s;} .si-create-link:hover{color:#0f4ec7;text-decoration:underline;}
        .si-privacy{display:flex;align-items:center;justify-content:center;gap:0.375rem;font-size:0.75rem;color:#94a3b8;border-top:1px solid rgba(226,232,240,0.9);padding-top:0.875rem;margin-top:0.875rem;}
        .si-footer{display:flex;align-items:center;justify-content:space-between;padding:1rem 2.5rem;border-top:1px solid rgba(226,232,240,0.7);}
        .si-footer-copy{font-size:0.8125rem;color:#94a3b8;}
        .si-footer-links{display:flex;align-items:center;gap:1.375rem;}
        .si-footer-link{font-size:0.8125rem;color:#64748b;text-decoration:none;transition:color 0.15s;} .si-footer-link:hover{color:#1d7bf0;}
        @media(max-width:600px){.si-topbar{padding:1rem 1.25rem;}.si-main{padding:1.5rem 1rem;}.si-card{padding:1.625rem 1.25rem;}.si-footer{flex-direction:column;gap:0.75rem;padding:1rem 1.25rem;}}
      `}</style>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F0F2F7' }} />}>
      <RegisterContent />
    </Suspense>
  )
}

