'use client'

/**
 * CareerIQ Charts & UI Components
 * Design System: landingpage.html reference (light, #F4F6FA bg, #1d7bf0 brand blue)
 */

/* ============================================================
   HORIZONTAL BAR CHART
   ============================================================ */
export function HorizontalBarChart({ data = [], color = 'var(--color-brand-500)', unit = '%', maxValue }) {
  if (!data.length) return (
    <div className="ciq-empty-state">
      <div className="ciq-empty-state-icon">📊</div>
      <p>No data available</p>
    </div>
  )

  const max = maxValue ?? Math.max(...data.map(d => d.value), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {data.map((item, i) => (
        <div key={i} className="ciq-chart-bar-row">
          <div className="ciq-chart-bar-label" title={item.label}>{item.label}</div>
          <div className="ciq-chart-bar-track">
            <div
              className="ciq-chart-bar-fill"
              style={{ width: `${Math.min((item.value / max) * 100, 100)}%`, background: color }}
            >
              {item.value > 5 && (
                <span className="ciq-chart-bar-value">{item.value}{unit}</span>
              )}
            </div>
          </div>
          {item.value <= 5 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', minWidth: '35px' }}>
              {item.value}{unit}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/* ============================================================
   SVG LINE CHART
   ============================================================ */
export function LineChart({ series = [], height = 200 }) {
  if (!series.length || !series[0].points?.length) {
    return (
      <div className="ciq-empty-state" style={{ padding: '1.5rem' }}>No trend data</div>
    )
  }

  const allPoints = series.flatMap(s => s.points.map(p => p.y))
  const minY = Math.min(...allPoints)
  const maxY = Math.max(...allPoints)
  const range = maxY - minY || 1
  const labels = series[0].points.map(p => p.x)
  const W = 560
  const H = height
  const PAD = { top: 20, right: 20, bottom: 40, left: 44 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const toX = (i) => PAD.left + (i / (labels.length - 1)) * chartW
  const toY = (v) => PAD.top + ((maxY - v) / range) * chartH

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
        const y = PAD.top + frac * chartH
        const val = (maxY - frac * range).toFixed(1)
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4" />
            <text x={PAD.left - 8} y={y + 4} fontSize="10" fill="var(--color-text-muted)" textAnchor="end">
              {val}
            </text>
          </g>
        )
      })}

      {/* X-axis labels */}
      {labels.map((label, i) => (
        <text key={i} x={toX(i)} y={H - 6} fontSize="9" fill="var(--color-text-muted)"
          textAnchor="middle" transform={`rotate(-30, ${toX(i)}, ${H - 6})`}>
          {label}
        </text>
      ))}

      {/* Series lines */}
      {series.map((s, si) => {
        const pts = s.points
        if (pts.length < 2) return null
        const d = pts.map((p, i) =>
          `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.y)}`
        ).join(' ')
        return (
          <g key={si}>
            <path d={d} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p, i) => (
              <circle key={i} cx={toX(i)} cy={toY(p.y)} r="4" fill="white" stroke={s.color} strokeWidth="2" />
            ))}
          </g>
        )
      })}

      {/* Legend */}
      {series.map((s, si) => (
        <g key={si} transform={`translate(${PAD.left + si * 140}, ${H})`}>
          <circle cx="6" cy="-4" r="5" fill={s.color} opacity="0.9" />
          <text x="16" y="0" fontSize="11" fill="var(--color-text-secondary)" fontWeight="500">{s.name}</text>
        </g>
      ))}
    </svg>
  )
}

/* ============================================================
   DONUT CHART — updated for light theme
   ============================================================ */
export function DonutChart({ value = 0, label = '', color = 'var(--color-brand-500)', size = 120 }) {
  const r = (size / 2) * 0.75
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ
  const cx = size / 2
  const cy = size / 2

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="var(--color-border)" strokeWidth="10" />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90, ${cx}, ${cy})`}
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="800"
        fill="var(--color-text-heading)">
        {value}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11"
        fill="var(--color-text-muted)">
        {label}
      </text>
    </svg>
  )
}

/* ============================================================
   STAT CARD — matches landing page card style
   ============================================================ */
export function StatCard({ value, label, sublabel, icon, color = 'var(--color-brand-500)' }) {
  return (
    <div className="ciq-stat-card">
      {icon && (
        <div className="ciq-stat-icon" style={{ background: `${color}18` }}>
          <span style={{ fontSize: '1.25rem' }}>{icon}</span>
        </div>
      )}
      <div className="ciq-stat-value" style={{ color }}>{value}</div>
      <div className="ciq-stat-label">{label}</div>
      {sublabel && <div className="ciq-stat-sub">{sublabel}</div>}
    </div>
  )
}

/* ============================================================
   JOB RECOMMENDATION CARD
   ============================================================ */
export function JobCard({ job, rank }) {
  const scorePct = Math.round(job.total_score * 100)
  const scoreColor = scorePct >= 80 ? 'var(--color-emerald-600)'
    : scorePct >= 60 ? 'var(--color-brand-600)'
    : 'var(--color-text-muted)'

  return (
    <article className="ciq-job-card">
      <div className="ciq-job-card-header">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            {rank && (
              <span style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: rank <= 3 ? 'var(--color-brand-500)' : 'var(--color-surface-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700,
                color: rank <= 3 ? 'white' : 'var(--color-text-secondary)',
                border: rank > 3 ? '1px solid var(--color-border)' : 'none',
              }}>#{rank}</span>
            )}
            <div className="ciq-job-title">{job.title}</div>
          </div>
          <div className="ciq-job-company">{job.company} · {job.location} · {job.work_mode}</div>
        </div>
        <div className="ciq-match-score" style={{
          color: scoreColor,
          background: scorePct >= 80 ? 'var(--color-emerald-50)'
            : scorePct >= 60 ? 'var(--color-brand-50)'
            : 'var(--color-surface-subtle)',
          borderColor: scorePct >= 80 ? '#a7f3d0'
            : scorePct >= 60 ? 'var(--color-brand-100)'
            : 'var(--color-border)',
        }}>
          {scorePct}%
        </div>
      </div>

      <div className="ciq-job-meta">
        <span className="ciq-job-meta-item">💼 {job.exp_min}–{job.exp_max}y exp</span>
        <span className="ciq-job-meta-item">📍 {job.location}</span>
        {job.salary_mid_lpa && (
          <span className="ciq-job-meta-item">💰 ~{job.salary_mid_lpa} LPA</span>
        )}
        <span className="ciq-job-meta-item">📚 {job.experience_level}</span>
      </div>

      {job.matched_skills?.length > 0 && (
        <div style={{ marginBottom: '0.875rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-emerald-600)', marginBottom: '0.5rem' }}>
            ✅ Matched Skills ({job.match_count}/{job.total_job_skills})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {job.matched_skills.map(s => (
              <span key={s} className="ciq-skill-tag ciq-skill-have">{s}</span>
            ))}
          </div>
        </div>
      )}

      {job.missing_skills?.length > 0 && (
        <div style={{ marginBottom: '0.875rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-red-600)', marginBottom: '0.5rem' }}>
            ⚠️ Missing Skills
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {job.missing_skills.slice(0, 6).map(s => (
              <span key={s} className="ciq-skill-tag ciq-skill-missing">{s}</span>
            ))}
          </div>
        </div>
      )}

      {job.explanation && (
        <div className="ciq-job-explanation">{job.explanation}</div>
      )}
    </article>
  )
}

/* ============================================================
   SKILL GAP ROW
   ============================================================ */
export function SkillGapRow({ skill }) {
  const priorityColor =
    skill.priority_score > 0.6 ? 'var(--color-red-600)' :
    skill.priority_score > 0.3 ? 'var(--color-amber-600)' :
    'var(--color-brand-600)'
  const priorityBg =
    skill.priority_score > 0.6 ? 'var(--color-red-50)' :
    skill.priority_score > 0.3 ? 'var(--color-amber-50)' :
    'var(--color-brand-50)'
  const priorityBorder =
    skill.priority_score > 0.6 ? '#fecaca' :
    skill.priority_score > 0.3 ? '#fde68a' :
    'var(--color-brand-100)'

  const priorityLabel =
    skill.priority_score > 0.6 ? 'Critical' :
    skill.priority_score > 0.3 ? 'High' : 'Medium'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.625rem 0',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <span className="ciq-skill-tag ciq-skill-missing" style={{ minWidth: '110px', justifyContent: 'center' }}>
        {skill.skill}
      </span>
      <div className="ciq-progress-track" style={{ flex: 1 }}>
        <div className="ciq-progress-fill" style={{
          width: `${skill.market_demand_pct}%`,
          background: priorityColor,
          opacity: 0.8,
        }} />
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', minWidth: '36px', textAlign: 'right', fontWeight: 600 }}>
        {skill.market_demand_pct}%
      </span>
      <span style={{
        fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px',
        borderRadius: '9999px',
        background: priorityBg,
        border: `1px solid ${priorityBorder}`,
        color: priorityColor,
        minWidth: '60px', textAlign: 'center',
      }}>
        {priorityLabel}
      </span>
    </div>
  )
}

/* ============================================================
   API ERROR
   ============================================================ */
export function ApiError({ message }) {
  return (
    <div className="ciq-error-box">
      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
      <span>
        <strong>Backend Error: </strong>
        {message || 'Failed to connect to the CareerIQ backend. Make sure it is running on http://localhost:8000.'}
      </span>
    </div>
  )
}

/* ============================================================
   LOADING SPINNER
   ============================================================ */
export function Loading({ label = 'Loading…' }) {
  return (
    <div className="ciq-loading">
      <div className="ciq-spinner" />
      <span style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

/* ============================================================
   SYNTHETIC DATA NOTICE
   ============================================================ */
export function SyntheticNotice() {
  return (
    <div className="ciq-notice">
      ⚠️ <strong>Synthetic Dataset</strong> — Statistics are simulated, not real labor-market data.
    </div>
  )
}
