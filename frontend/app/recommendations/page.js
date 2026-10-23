'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '../components/Navbar'
import { JobCard, Loading, ApiError, SyntheticNotice } from '../components/Charts'

const API = process.env.NEXT_PUBLIC_API || 'http://localhost:8000'

const SAMPLE_ROLES = [
  'Machine Learning Engineer', 'Data Scientist', 'Data Analyst',
  'AI Engineer', 'MLOps Engineer', 'NLP Engineer',
  'Computer Vision Engineer', 'Data Engineer', 'Business Analyst',
  'Python Backend Developer', 'Full Stack Developer',
]

function RecommendContent() {
  const searchParams = useSearchParams()
  const initSkills = searchParams.get('skills') || ''
  const initRole = searchParams.get('role') || 'Machine Learning Engineer'
  const initExp = searchParams.get('exp') || '2'

  const [skillsInput, setSkillsInput] = useState(initSkills)
  const [targetRole, setTargetRole] = useState(initRole)
  const [yearsExp, setYearsExp] = useState(Number(initExp))
  const [wMarket, setWMarket] = useState(0.4)
  const [k, setK] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [compareMode, setCompareMode] = useState(false)
  const [baselineResult, setBaselineResult] = useState(null)

  useEffect(() => {
    if (initSkills) handleRecommend(initSkills.split(',').filter(Boolean))
  }, [])

  async function handleRecommend(skillsArr) {
    const skills = skillsArr || skillsInput.split(',').map(s => s.trim()).filter(Boolean)
    if (!skills.length) { setError('Enter at least one skill.'); return }

    setLoading(true); setError(null); setResult(null); setBaselineResult(null)
    try {
      // Fetch market-aware recommendations
      const res = await fetch(`${API}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, target_role: targetRole, years_exp: Number(yearsExp), w_market: wMarket, k }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResult(data)

      // If compare mode, also fetch baseline
      if (compareMode) {
        const baseRes = await fetch(`${API}/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skills, target_role: targetRole, years_exp: Number(yearsExp), w_market: 0.0, k }),
        })
        if (baseRes.ok) setBaselineResult(await baseRes.json())
      }
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="ciq-eyebrow" style={{ marginBottom: '0.625rem' }}>Market-Aware Recommender</div>
          <h1 className="ciq-page-title">Job Recommendations</h1>
          <p className="ciq-page-desc">
            Discover matching job roles filtered by skills, experience, and market hiring demand.
          </p>
        </div>
        <SyntheticNotice />
      </div>

      {/* Input Form Card */}
      <div className="ciq-card" style={{ marginBottom: '2rem' }}>
        <div className="ciq-card-body" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="ciq-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="ciq-label">Your Skills (comma-separated)</label>
              <input
                className="ciq-input"
                placeholder="Python, Docker, AWS, Machine Learning, SQL…"
                value={skillsInput}
                onChange={e => setSkillsInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRecommend()}
              />
            </div>
            <div className="ciq-form-group">
              <label className="ciq-label">Target Role</label>
              <select className="ciq-select" value={targetRole} onChange={e => setTargetRole(e.target.value)}>
                {SAMPLE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="ciq-form-group">
              <label className="ciq-label">Years of Experience</label>
              <input
                type="number"
                className="ciq-input"
                min="0"
                max="30"
                step="1"
                value={yearsExp}
                onChange={e => setYearsExp(e.target.value)}
              />
            </div>
          </div>

          {/* Model Tuning Parameters */}
          <div style={{
            background: 'var(--color-surface-subtle)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            padding: '1.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div className="ciq-form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <label className="ciq-label" style={{ marginBottom: 0 }}>
                  Market Weight (w)
                </label>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-brand-600)' }}>
                  {wMarket.toFixed(1)} {wMarket === 0 ? '(Baseline)' : '(Market-Aware)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={wMarket}
                onChange={e => setWMarket(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-brand-500)', cursor: 'pointer' }}
              />
            </div>

            <div className="ciq-form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <label className="ciq-label" style={{ marginBottom: 0 }}>Top Results (k)</label>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-heading)' }}>{k}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={k}
                onChange={e => setK(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-brand-500)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '0.5rem' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-body)' }}>
                <input
                  type="checkbox"
                  checked={compareMode}
                  onChange={e => setCompareMode(e.target.checked)}
                  style={{ accentColor: 'var(--color-brand-500)', width: 18, height: 18, cursor: 'pointer' }}
                />
                Side-by-Side Model Comparison
              </label>
            </div>
          </div>

          {error && <ApiError message={error} />}

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', borderRadius: '12px', opacity: loading ? 0.7 : 1 }}
            onClick={() => handleRecommend()}
            disabled={loading}
          >
            {loading ? 'Finding Best Job Matches…' : 'Get Recommendations'}
          </button>
        </div>
      </div>

      {loading && <Loading label="Evaluating job corpus and matching demand scores…" />}

      {result && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Scoring Model Indicator */}
          <div style={{
            padding: '1rem 1.25rem',
            background: 'var(--color-brand-50)',
            borderRadius: '16px',
            border: '1px solid var(--color-brand-100)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ fontSize: '1.25rem' }}>📐</span>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--color-brand-700)' }}>{result.model}:</strong> {result.scoring_note}
            </div>
          </div>

          {/* Results List or Comparison Grid */}
          {compareMode && baselineResult ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1rem',
                  marginBottom: '1rem',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)'
                }}>
                  <span>Model A — Baseline (Similarity Only, w=0)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {baselineResult.recommendations?.map((job, i) => (
                    <JobCard key={job.job_id} job={job} rank={i + 1} />
                  ))}
                </div>
              </div>

              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1rem',
                  marginBottom: '1rem',
                  background: 'var(--color-brand-50)',
                  border: '1px solid var(--color-brand-100)',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: 'var(--color-brand-700)'
                }}>
                  <span>Model B — Market-Aware (w={wMarket}) ✓ Recommended</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {result.recommendations?.map((job, i) => (
                    <JobCard key={job.job_id} job={job} rank={i + 1} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-heading)' }}>
                  {result.recommendations?.length || 0} Matches Found
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Ranked by composite market fit
                </span>
              </div>
              {result.recommendations?.map((job, i) => (
                <JobCard key={job.job_id} job={job} rank={i + 1} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function RecommendationsPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<Loading label="Loading recommendations page…" />}>
        <RecommendContent />
      </Suspense>
    </>
  )
}
