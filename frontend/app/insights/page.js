'use client'

import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { Loading, SyntheticNotice } from '../components/Charts'

const API = process.env.NEXT_PUBLIC_API || 'http://localhost:8000'

/* ============================================================
   MODEL INSIGHTS PAGE
   Design System: Faithfully aligned with landingpage.html
   Clean light background, brand blue (#1d7bf0), tactile cards.
   ============================================================ */
export default function InsightsPage() {
  const [health, setHealth] = useState(null)
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    fetch(`${API}/health`).then(r => r.json()).then(setHealth).catch(() => null)
  }, [])

  const evalData = [
    { model: 'DummyRegressor (mean)', mae: '5.77', rmse: '7.51', r2: '-0.003', notes: 'Predicts mean salary. Baseline.' },
    { model: 'Linear Regression', mae: '1.74', rmse: '2.38', r2: '0.899', notes: 'Captures role/experience linear effects.' },
    { model: 'Random Forest', mae: '1.50', rmse: '2.16', r2: '0.917', notes: '200 trees, min_samples_leaf=3.' },
    { model: 'Gradient Boosting ✓ BEST', mae: '1.31', rmse: '1.84', r2: '0.940', notes: 'HistGBM, 300 iterations, lr=0.06. Selected model.' },
  ]

  const recEvalData = [
    { model: 'Model A: Baseline (similarity only)', w: '0.0', p5: '0.760', notes: 'TF-IDF cosine similarity only.' },
    { model: 'Model B: Market-Aware ✓', w: '0.4', p5: '0.795', notes: 'Cosine + market coverage + exp fit. +3.5pp improvement.' },
  ]

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'salary', label: 'Salary Model' },
    { id: 'recommend', label: 'Recommender' },
    { id: 'extraction', label: 'Skill Extraction' },
    { id: 'limitations', label: 'Limitations' },
  ]

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="ciq-eyebrow" style={{ marginBottom: '0.625rem' }}>Transparent Methodology</div>
            <h1 className="ciq-page-title">Model Insights & System Architecture</h1>
            <p className="ciq-page-desc">
              Detailed technical documentation of machine learning models, benchmark evaluations, and data provenance.
            </p>
          </div>
          <SyntheticNotice />
        </div>

        {/* Backend Status Card */}
        {health && (
          <div className="ciq-card" style={{ marginBottom: '1.75rem' }}>
            <div className="ciq-card-body" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: health.engine_ready ? 'var(--color-emerald-600)' : 'var(--color-red-600)',
                  display: 'inline-block'
                }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-heading)' }}>
                  Backend Engine: <span style={{ color: health.engine_ready ? 'var(--color-emerald-600)' : 'var(--color-red-600)' }}>{health.engine_ready ? 'Active & Ready' : 'Offline'}</span>
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Jobs Indexed: <strong style={{ color: 'var(--color-text-heading)' }}>{health.jobs_loaded?.toLocaleString()}</strong>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Master Skills: <strong style={{ color: 'var(--color-text-heading)' }}>{health.skills_in_master}</strong>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Provenance: <strong style={{ color: 'var(--color-text-heading)' }}>{health.data_provenance}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Pill Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          background: 'var(--color-surface)',
          padding: '0.375rem',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {sections.map(s => {
            const isActive = activeSection === s.id
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: isActive ? 'var(--color-brand-500)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 4px 12px rgba(29, 123, 240, 0.25)' : 'none',
                }}
              >
                {s.label}
              </button>
            )
          })}
        </div>

        {/* ── OVERVIEW ── */}
        {activeSection === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="ciq-card">
              <div className="ciq-card-header">
                <h3 className="ciq-card-title">Project Architecture Summary</h3>
                <span className="ciq-badge ciq-badge-brand">v2.0 Architecture</span>
              </div>
              <div className="ciq-card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  {[
                    { label: 'Synthetic Dataset', value: '12,000 synthetic job postings (Indian AI/Data market)' },
                    { label: 'Temporal Coverage', value: '2024-01-01 to 2026-10-14 (~33 simulated months)' },
                    { label: 'Canonical Roles', value: '12 standard roles (Data Scientist, MLE, MLOps, etc.)' },
                    { label: 'Skills Master', value: '57 canonical skills with aliases and growth rates' },
                    { label: 'Backend Stack', value: 'FastAPI + Python (scikit-learn, joblib, numpy)' },
                    { label: 'Frontend Stack', value: 'Next.js 15 (App Router, Pure Vanilla CSS tokens)' },
                    { label: 'Top Salary Predictor', value: 'Gradient Boosting (R²=0.940, MAE=1.31 LPA)' },
                    { label: 'Recommender Precision', value: 'Market-Aware Model B: 79.5% vs Baseline: 76.0%' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      padding: '1rem',
                      background: 'var(--color-surface-subtle)',
                      borderRadius: '12px',
                      border: '1px solid var(--color-border)'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '0.375rem' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-heading)' }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PIPELINE ── */}
        {activeSection === 'pipeline' && (
          <div className="ciq-card">
            <div className="ciq-card-header">
              <h3 className="ciq-card-title">End-to-End Pipeline Workflow (run_pipeline.py)</h3>
            </div>
            <div className="ciq-card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { step: '1', title: 'Data Loading & Deduplication', desc: 'Ingest jobs_dataset.csv (12,120 rows). Remove duplicates based on composite tuple (title, company, location, description). Compute salary midpoint LPA.' },
                  { step: '2', title: 'EDA & Visual Analytics', desc: 'Compute aggregations for top market skills, distribution across locations and roles, and salary quartiles.' },
                  { step: '3', title: 'Skill Extraction (NLP Baseline)', desc: 'Compile regex matching engine from skills_master.csv sorted longest-first to prevent sub-string collision. Extract canonical skill tags.' },
                  { step: '4', title: 'Quarterly Trend Tracking', desc: 'Aggregate job-skill matrix by calendar quarter to compute relative posting percentages and trajectory indicators.' },
                  { step: '5', title: 'Salary Model Training', desc: 'Train 4 regression models (Dummy, Linear, Random Forest, HistGBM) using one-hot encoded role, location, work mode, and skill indicators.' },
                  { step: '6', title: 'Skill Space Clustering', desc: 'Vectorize skill strings via TF-IDF and apply K-Means clustering for thematic job groupings and neighborhood exploration.' },
                  { step: '7', title: 'Recommender Evaluation', desc: 'Index postings within the active evaluation window. Calculate hybrid scoring: (1-w)×cosine + w×(0.6×coverage + 0.4×exp_fit).' },
                ].map(({ step, title, desc }) => (
                  <div key={step} style={{
                    display: 'flex',
                    gap: '1.25rem',
                    padding: '1.25rem',
                    background: 'var(--color-surface-subtle)',
                    borderRadius: '16px',
                    border: '1px solid var(--color-border)',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--color-brand-500)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      flexShrink: 0,
                      boxShadow: '0 4px 10px rgba(29, 123, 240, 0.3)'
                    }}>
                      {step}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-heading)', marginBottom: '0.25rem' }}>
                        {title}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                        {desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SALARY MODEL ── */}
        {activeSection === 'salary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div className="ciq-card">
              <div className="ciq-card-header">
                <h3 className="ciq-card-title">Salary Model Comparison Benchmark</h3>
              </div>
              <div className="ciq-card-body">
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)' }}>
                        {['Model Name', 'MAE (LPA)', 'RMSE (LPA)', 'R²', 'Notes'].map(h => (
                          <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {evalData.map(row => {
                        const isBest = row.model.includes('BEST')
                        return (
                          <tr key={row.model} style={{
                            borderBottom: '1px solid var(--color-border)',
                            background: isBest ? 'var(--color-brand-50)' : 'transparent',
                          }}>
                            <td style={{ padding: '1rem', fontWeight: isBest ? 700 : 500, color: isBest ? 'var(--color-brand-700)' : 'var(--color-text-heading)' }}>
                              {row.model}
                            </td>
                            <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{row.mae}</td>
                            <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{row.rmse}</td>
                            <td style={{ padding: '1rem', color: Number(row.r2) > 0.9 ? 'var(--color-emerald-600)' : 'var(--color-text-secondary)', fontWeight: 700 }}>
                              {row.r2}
                            </td>
                            <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{row.notes}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: '1.25rem', padding: '0.875rem 1rem', borderRadius: '12px', background: 'var(--color-amber-50)', border: '1px solid #fde68a', color: 'var(--color-amber-600)', fontSize: '0.8125rem', lineHeight: 1.5 }}>
                  ⚠️ Note: All metrics are derived from a 20% test split on synthetic data. The high R² reflects the structural formula used during dataset synthesis.
                </div>
              </div>
            </div>

            <div className="ciq-card">
              <div className="ciq-card-header">
                <h3 className="ciq-card-title">Feature Engineering Strategy</h3>
              </div>
              <div className="ciq-card-body">
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', listStyle: 'none' }}>
                  {[
                    '🔢 Numeric Features: exp_mid (average of min and max required experience) and n_skills (total count of skills).',
                    '🏷️ Categorical One-Hot Encoding: Target role, location, company type tier, and remote/hybrid work mode.',
                    '⚙️ Skill Binary Indicators: 57 individual sparse binary columns representing verified presence of key technologies.',
                    '🚫 Strict Target Isolation: salary_min and salary_max are strictly withheld from training features to avoid leakage.',
                  ].map(f => (
                    <li key={f} style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── RECOMMENDER ── */}
        {activeSection === 'recommend' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div className="ciq-card">
              <div className="ciq-card-header">
                <h3 className="ciq-card-title">Recommender Evaluation & Comparison</h3>
              </div>
              <div className="ciq-card-body">
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
                  Tested across 40 evaluation profiles. Metric: Precision@5 based on target family relevancy.
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)' }}>
                        {['Model Variation', 'Market Weight (w)', 'Precision@5', 'Evaluation Details'].map(h => (
                          <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recEvalData.map(row => {
                        const isBest = row.model.includes('✓')
                        return (
                          <tr key={row.model} style={{
                            borderBottom: '1px solid var(--color-border)',
                            background: isBest ? 'var(--color-brand-50)' : 'transparent',
                          }}>
                            <td style={{ padding: '1rem', fontWeight: isBest ? 700 : 500, color: isBest ? 'var(--color-brand-700)' : 'var(--color-text-heading)' }}>
                              {row.model}
                            </td>
                            <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{row.w}</td>
                            <td style={{ padding: '1rem', color: 'var(--color-emerald-600)', fontWeight: 700 }}>{row.p5}</td>
                            <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{row.notes}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="ciq-card">
              <div className="ciq-card-header">
                <h3 className="ciq-card-title">Hybrid Scoring Formulation</h3>
              </div>
              <div className="ciq-card-body">
                <div style={{
                  background: 'var(--color-brand-50)',
                  border: '1px solid var(--color-brand-100)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  fontFamily: 'monospace',
                  fontSize: '0.9375rem',
                  color: 'var(--color-brand-700)',
                  fontWeight: 600,
                  marginBottom: '1.25rem'
                }}>
                  Final Score = (1 - w_market) × Cosine_Similarity + w_market × (0.6 × Market_Coverage + 0.4 × Experience_Fit)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {[
                    { term: 'Cosine_Similarity', desc: 'TF-IDF semantic cosine overlap between candidate profile and job requirements.' },
                    { term: 'Market_Coverage', desc: 'Fraction of high-demand skills present in the posting that candidate satisfies.' },
                    { term: 'Experience_Fit', desc: 'Continuous penalty factor accounting for minimum required years of experience.' },
                  ].map(({ term, desc }) => (
                    <div key={term} style={{ padding: '1rem', background: 'var(--color-surface-subtle)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-heading)', marginBottom: '0.25rem' }}>{term}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SKILL EXTRACTION ── */}
        {activeSection === 'extraction' && (
          <div className="ciq-card">
            <div className="ciq-card-header">
              <h3 className="ciq-card-title">Skill Extraction Engine (Regex Baseline)</h3>
            </div>
            <div className="ciq-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                {[
                  { label: 'Extraction Technique', value: 'Regex with Alias Mapping' },
                  { label: 'Precision', value: '0.992 (Synthetic baseline)' },
                  { label: 'Recall', value: '0.990 (Synthetic baseline)' },
                  { label: 'Harmonic F1', value: '0.991 (Circular validation)' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '1rem', background: 'var(--color-surface-subtle)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>{label}</div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-heading)' }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '0.875rem 1rem', borderRadius: '12px', background: 'var(--color-amber-50)', border: '1px solid #fde68a', color: 'var(--color-amber-600)', fontSize: '0.8125rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                ⚠️ <strong>Circular Evaluation Notice:</strong> Ground-truth labels were generated from the same master dictionary. F1 score approaching 1.0 is expected and illustrative of dictionary completeness.
              </div>

              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-heading)', marginBottom: '0.75rem' }}>
                Operational Extraction Mechanics
              </h4>
              <ol style={{ paddingLeft: '1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                <li>Compile bidirectional alias map from <code>skills_master.csv</code> (e.g., "sklearn" → "scikit-learn").</li>
                <li>Sort all aliases by descending character length to guarantee longest-prefix matching.</li>
                <li>Execute word-boundary regex patterns respecting symbols like C++, C#, and .NET.</li>
                <li>Resolve all identified aliases to canonical identifiers and eliminate duplicates.</li>
              </ol>
            </div>
          </div>
        )}

        {/* ── LIMITATIONS ── */}
        {activeSection === 'limitations' && (
          <div className="ciq-card">
            <div className="ciq-card-header">
              <h3 className="ciq-card-title">Limitations & Academic Honesty Disclosures</h3>
            </div>
            <div className="ciq-card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  {
                    title: '1. Fully Synthetic Dataset (Not Live Market Scraping)',
                    desc: 'All 12,000 job postings were generated programmatically using controlled distributions. Companies, descriptions, and salary numbers are synthetic simulations and cannot be interpreted as actual labor statistics.',
                    level: 'High Priority',
                    color: 'var(--color-red-600)',
                    bg: 'var(--color-red-50)',
                    border: '#fecaca',
                  },
                  {
                    title: '2. Deterministic Salary Generative Process',
                    desc: 'Salaries follow an explicit synthetic formula incorporating experience factors and Gaussian perturbation. The Gradient Boosting model learned this formula directly.',
                    level: 'Important',
                    color: 'var(--color-amber-600)',
                    bg: 'var(--color-amber-50)',
                    border: '#fde68a',
                  },
                  {
                    title: '3. Predefined Skill Growth Rates',
                    desc: 'Quarterly trends reflect growth rates assigned manually in skills_master.csv rather than longitudinal web-scale crawls.',
                    level: 'Notice',
                    color: 'var(--color-brand-600)',
                    bg: 'var(--color-brand-50)',
                    border: 'var(--color-brand-100)',
                  },
                  {
                    title: '4. Static Offline Processing',
                    desc: 'The platform operates as a standalone offline ML analytics dashboard without real-time external API dependencies.',
                    level: 'Informational',
                    color: 'var(--color-text-muted)',
                    bg: 'var(--color-surface-subtle)',
                    border: 'var(--color-border)',
                  },
                ].map(({ title, desc, level, color, bg, border }) => (
                  <div key={title} style={{
                    padding: '1.25rem',
                    background: 'var(--color-surface)',
                    borderRadius: '12px',
                    border: `1px solid ${border}`,
                    borderLeft: `4px solid ${color}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                      <span style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: bg,
                        color: color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        {level}
                      </span>
                      <strong style={{ fontSize: '0.9375rem', color: 'var(--color-text-heading)' }}>{title}</strong>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
