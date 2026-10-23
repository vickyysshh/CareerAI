'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '../components/Navbar'
import { SkillGapRow, DonutChart, Loading, ApiError, SyntheticNotice } from '../components/Charts'

const API = process.env.NEXT_PUBLIC_API || 'http://localhost:8000'

const SAMPLE_ROLES = [
  'Machine Learning Engineer', 'Data Scientist', 'Data Analyst',
  'AI Engineer', 'MLOps Engineer', 'NLP Engineer',
  'Computer Vision Engineer', 'Data Engineer', 'Business Analyst',
  'Python Backend Developer', 'Full Stack Developer',
]

function SkillGapContent() {
  const searchParams = useSearchParams()
  const initSkills = searchParams.get('skills') || ''
  const initRole   = searchParams.get('role')   || 'Machine Learning Engineer'

  const [skillsInput, setSkillsInput]   = useState(initSkills)
  const [selectedRole, setSelectedRole] = useState(initRole)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)
  const [result, setResult]             = useState(null)
  const [activeTab, setActiveTab]       = useState('missing')

  useEffect(() => {
    if (initSkills && initRole) handleAnalyze(initSkills.split(',').filter(Boolean), initRole)
  }, [])

  async function handleAnalyze(skillsArr, role) {
    const skills = skillsArr || skillsInput.split(',').map(s => s.trim()).filter(Boolean)
    const r = role || selectedRole
    if (!skills.length) { setError('Enter at least one skill.'); return }
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch(`${API}/skill-gap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, role: r }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      setResult(await res.json())
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="ciq-eyebrow" style={{ marginBottom: '0.625rem' }}>Market Intelligence</div>
        <h1 className="ciq-page-title">Skill Gap Analysis</h1>
        <p className="ciq-page-desc">
          Enter your skills and target role to see exactly what you're missing and what to learn next.
        </p>
      </div>

      {/* Input Card */}
      <div className="ciq-card" style={{ marginBottom: '1.5rem' }}>
        <div className="ciq-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="ciq-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="ciq-label">Your Skills (comma-separated)</label>
              <input
                className="ciq-input"
                placeholder="Python, Machine Learning, SQL, Docker, AWS…"
                value={skillsInput}
                onChange={e => setSkillsInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
              />
            </div>
            <div className="ciq-form-group">
              <label className="ciq-label">Target Role</label>
              <select className="ciq-select" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                {SAMPLE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {error && <ApiError message={error} />}

          <button
            className="btn btn-primary btn-lg"
            style={{ marginTop: '1rem', width: '100%', borderRadius: '12px', opacity: loading ? 0.7 : 1 }}
            onClick={() => handleAnalyze()}
            disabled={loading}
          >
            {loading ? 'Analysing…' : 'Compute Skill Gap'}
          </button>
        </div>
      </div>

      {loading && <Loading label="Computing skill gap against market demand…" />}

      {result && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <SyntheticNotice />

          {/* Summary Banner */}
          <div className="ciq-card" style={{ background: 'var(--color-surface-subtle)' }}>
            <div className="ciq-card-body">
              <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
                <DonutChart value={Math.round(result.coverage_pct)} label="Coverage" color="var(--color-brand-500)" size={100} />
                <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {[
                    { value: result.have_skills?.length,    label: 'Skills You Have',    color: 'var(--color-emerald-600)' },
                    { value: result.missing_skills?.length, label: 'Missing (Priority)',  color: 'var(--color-red-600)' },
                    { value: result.role, label: 'Target Role', color: 'var(--color-text-heading)', isText: true },
                  ].map(({ value, label, color, isText }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: isText ? '1rem' : '2rem', fontWeight: 800, color, letterSpacing: '-0.025em', lineHeight: 1.1 }}>{value}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '4px', fontWeight: 500 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Formula note */}
          <div style={{ padding: '0.75rem 1rem', background: 'var(--color-brand-50)', borderRadius: '8px', border: '1px solid var(--color-brand-100)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            📐 <strong style={{ color: 'var(--color-brand-600)' }}>Priority Formula:</strong> {result.formula_note}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '9999px', padding: '0.25rem', width: 'fit-content' }}>
            {[
              { id: 'missing', label: `Missing (${result.missing_skills?.length})` },
              { id: 'have',    label: `You Have (${result.have_skills?.length})` },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.5rem 1.125rem', borderRadius: '9999px',
                  background: activeTab === tab.id ? '#fff' : 'transparent',
                  color: activeTab === tab.id ? 'var(--color-text-heading)' : 'var(--color-text-secondary)',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
                  boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'missing' && (
            <div className="ciq-card">
              <div className="ciq-card-body">
                <h3 className="ciq-h3" style={{ marginBottom: '0.375rem' }}>Priority Missing Skills</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  Ranked by priority score. High demand + growing = learn first.
                </p>
                {/* Column headers */}
                <div style={{ display: 'flex', gap: '0.75rem', padding: '0 0 0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', minWidth: '110px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Skill</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', flex: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Market Demand</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', minWidth: '36px', textAlign: 'right', textTransform: 'uppercase' }}>%</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', minWidth: '60px', textAlign: 'center', textTransform: 'uppercase' }}>Priority</span>
                </div>
                {result.missing_skills?.map(s => <SkillGapRow key={s.skill} skill={s} />)}
              </div>
            </div>
          )}

          {activeTab === 'have' && (
            <div className="ciq-card">
              <div className="ciq-card-body">
                <h3 className="ciq-h3" style={{ marginBottom: '1rem' }}>Your Matched Skills</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {result.have_skills?.map(s => (
                    <div key={s.skill} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <span className="ciq-skill-tag ciq-skill-have">{s.skill}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{s.market_demand_pct}% demand</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SkillGapPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<Loading label="Loading skill gap page…" />}>
        <SkillGapContent />
      </Suspense>
    </>
  )
}
