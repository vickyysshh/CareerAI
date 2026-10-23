'use client'

import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { HorizontalBarChart, LineChart, StatCard, SyntheticNotice, Loading, ApiError } from '../components/Charts'

const API = process.env.NEXT_PUBLIC_API || 'http://localhost:8000'

/* ============================================================
   MARKET DASHBOARD PAGE
   Design: landingpage.html reference (light, blue brand)
   ============================================================ */
export default function DashboardPage() {
  const [overview, setOverview]     = useState(null)
  const [trends, setTrends]         = useState(null)
  const [roleSkills, setRoleSkills] = useState(null)
  const [selectedRole, setSelectedRole] = useState('Machine Learning Engineer')
  const [roles, setRoles]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [activeTab, setActiveTab]   = useState('skills')

  useEffect(() => {
    async function fetchData() {
      setLoading(true); setError(null)
      try {
        const [ovRes, trendRes, rolesRes] = await Promise.all([
          fetch(`${API}/market/overview`),
          fetch(`${API}/market/trends`),
          fetch(`${API}/roles`),
        ])
        if (!ovRes.ok) throw new Error(`Backend error: ${ovRes.status}`)
        const [ov, tr, ro] = await Promise.all([ovRes.json(), trendRes.json(), rolesRes.json()])
        setOverview(ov); setTrends(tr); setRoles(ro.roles || [])
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!selectedRole) return
    fetch(`${API}/skills/demand?role=${encodeURIComponent(selectedRole)}`)
      .then(r => r.json()).then(setRoleSkills).catch(() => setRoleSkills(null))
  }, [selectedRole])

  const TABS = [
    { id: 'skills',   label: 'Top Skills' },
    { id: 'roles',    label: 'By Role' },
    { id: 'location', label: 'By Location' },
    { id: 'trends',   label: 'Skill Trends' },
    { id: 'salary',   label: 'Salary' },
  ]

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="ciq-eyebrow" style={{ marginBottom: '0.625rem' }}>Live Market Data</div>
            <h1 className="ciq-page-title">Market Dashboard</h1>
            <p className="ciq-page-desc">
              {overview
                ? `${overview.date_from} → ${overview.date_to} · ${overview.total_jobs.toLocaleString()} job postings analyzed`
                : 'Loading market data…'}
            </p>
          </div>
          <SyntheticNotice />
        </div>

        {error && <ApiError message={error} />}

        {loading ? (
          <Loading label="Fetching market data from backend…" />
        ) : overview && (
          <>
            {/* ── STAT CARDS ── */}
            <div className="ciq-grid-4" style={{ marginBottom: '2rem' }}>
              <StatCard icon="💼"
                value={overview.total_jobs.toLocaleString()}
                label="Total Job Postings" sublabel="After deduplication" />
              <StatCard icon="🛠️"
                value={overview.top_skills?.[0]?.skill || '—'}
                label="Most Demanded Skill"
                sublabel={`${overview.top_skills?.[0]?.pct}% of postings`}
                color="var(--color-emerald-600)" />
              <StatCard icon="🏙️"
                value={overview.jobs_by_location?.[0]?.location || '—'}
                label="Top Location"
                sublabel={`${overview.jobs_by_location?.[0]?.count?.toLocaleString()} postings`}
                color="var(--color-amber-600)" />
              {overview.salary_stats ? (
                <StatCard icon="💰"
                  value={`₹${overview.salary_stats.median_lpa} LPA`}
                  label="Median Salary" sublabel="Synthetic estimate"
                  color="var(--color-purple-600)" />
              ) : (
                <StatCard icon="📈"
                  value={overview.jobs_by_role?.length}
                  label="Unique Roles" sublabel="Across all postings" />
              )}
            </div>

            {/* ── TABS ── */}
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '9999px', padding: '0.25rem', width: 'fit-content' }}>
              {TABS.map(tab => (
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

            {/* ── TOP SKILLS TAB ── */}
            {activeTab === 'skills' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                <div className="ciq-card">
                  <div className="ciq-card-body">
                    <h3 className="ciq-h3" style={{ marginBottom: '1.25rem' }}>Top 15 Skills (% of all postings)</h3>
                    <HorizontalBarChart
                      data={overview.top_skills.map(s => ({ label: s.skill, value: s.pct }))}
                      color="var(--color-brand-500)" unit="%" />
                  </div>
                </div>
                <div className="ciq-card">
                  <div className="ciq-card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h3 className="ciq-h3">Skill Demand by Role</h3>
                      <select className="ciq-select" style={{ width: 'auto', fontSize: '0.8125rem' }}
                        value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    {roleSkills ? (
                      <HorizontalBarChart
                        data={roleSkills.skills.slice(0, 12).map(s => ({ label: s.skill, value: s.demand_pct }))}
                        color="var(--color-brand-600)" unit="%" />
                    ) : <Loading label="Loading role demand…" />}
                  </div>
                </div>
              </div>
            )}

            {/* ── ROLES TAB ── */}
            {activeTab === 'roles' && (
              <div className="ciq-card">
                <div className="ciq-card-body">
                  <h3 className="ciq-h3" style={{ marginBottom: '1.25rem' }}>Job Postings by Role</h3>
                  <HorizontalBarChart
                    data={overview.jobs_by_role.map(r => ({ label: r.role, value: r.count }))}
                    color="var(--color-brand-700)" unit=" jobs"
                    maxValue={overview.jobs_by_role[0]?.count} />
                </div>
              </div>
            )}

            {/* ── LOCATION TAB ── */}
            {activeTab === 'location' && (
              <div className="ciq-card">
                <div className="ciq-card-body">
                  <h3 className="ciq-h3" style={{ marginBottom: '1.25rem' }}>Job Postings by City</h3>
                  <HorizontalBarChart
                    data={overview.jobs_by_location.map(l => ({ label: l.location, value: l.count }))}
                    color="var(--color-emerald-600)" unit=" jobs"
                    maxValue={overview.jobs_by_location[0]?.count} />
                </div>
              </div>
            )}

            {/* ── TRENDS TAB ── */}
            {activeTab === 'trends' && trends && (
              <div className="ciq-card">
                <div className="ciq-card-body">
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 className="ciq-h3" style={{ marginBottom: '0.25rem' }}>Skill Demand Over Time</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{trends.note}</p>
                  </div>
                  <LineChart height={260}
                    series={trends.trending_skills.slice(0, 5).map((skill, i) => ({
                      name: skill,
                      color: ['#1d7bf0', '#059669', '#9333ea', '#d97706', '#06b6d4'][i],
                      points: (trends.series[skill] || []).map(p => ({ x: p.quarter, y: p.pct })),
                    }))} />
                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Rising Skills</div>
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                        {trends.trending_skills.map(s => (
                          <span key={s} className="ciq-badge ciq-badge-green">{s} ↑</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Falling Skills</div>
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                        {trends.falling_skills.map(s => (
                          <span key={s} className="ciq-badge ciq-badge-red">{s} ↓</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SALARY TAB ── */}
            {activeTab === 'salary' && overview.salary_stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="ciq-card">
                  <div className="ciq-card-body">
                    <h3 className="ciq-h3" style={{ marginBottom: '1.25rem' }}>Salary Overview</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                      {[
                        { label: 'Median', value: `₹${overview.salary_stats.median_lpa} LPA`, color: 'var(--color-emerald-600)' },
                        { label: 'Mean',   value: `₹${overview.salary_stats.mean_lpa} LPA`,   color: 'var(--color-brand-600)' },
                        { label: 'Min',    value: `₹${overview.salary_stats.min_lpa} LPA`,    color: 'var(--color-text-secondary)' },
                        { label: 'Max',    value: `₹${overview.salary_stats.max_lpa} LPA`,    color: 'var(--color-purple-600)' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="ciq-card-subtle" style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color, letterSpacing: '-0.025em' }}>{value}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="ciq-notice">⚠️ Synthetic salary data — not real market benchmarks</div>
                  </div>
                </div>
                <div className="ciq-card">
                  <div className="ciq-card-body">
                    <h3 className="ciq-h3" style={{ marginBottom: '0.75rem' }}>Salary by Role</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      Salary predictions are available through the Resume Analysis feature. Upload your resume and select a target role to see a salary estimate.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'salary' && !overview.salary_stats && (
              <div className="ciq-card">
                <div className="ciq-card-body">
                  <p style={{ color: 'var(--color-text-muted)' }}>Salary data not available in this dataset configuration.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
