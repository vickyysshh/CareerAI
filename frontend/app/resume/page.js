'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { DonutChart, SkillGapRow, Loading, ApiError, SyntheticNotice } from '../components/Charts'

const API = process.env.NEXT_PUBLIC_API || 'http://localhost:8000'

const TARGET_ROLES = [
  'Machine Learning Engineer',
  'Data Scientist',
  'Data Analyst',
  'Software Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Engineer',
  'DevOps Engineer',
  'Product Manager',
  'UX Designer',
]

function getSeniorityBadge(years) {
  if (years === 0) return 'Entry level'
  if (years <= 2) return 'Junior'
  if (years <= 5) return 'Mid-level'
  if (years <= 9) return 'Senior'
  if (years <= 14) return 'Lead'
  return 'Principal'
}

/* ── Orbit Chips definition exactly from reference ── */
/*
  Green (Matched): PyTorch, MLOps, SQL, Python, Docker, Kubernetes, LLMs
  Red/Pink (Gap): AWS, Statistics, Spark
*/
const ORBIT_ITEMS = [
  // Inner ring (r = 82, uniform duration 45s -> never collide)
  { id: 'pytorch', label: 'PyTorch', r: 82, angle: 90, dur: 45, isGreen: true },
  { id: 'docker', label: 'Docker', r: 82, angle: 330, dur: 45, isGreen: true },
  { id: 'sql', label: 'SQL', r: 82, angle: 210, dur: 45, isGreen: true },

  // Mid ring (r = 140, uniform duration 60s -> never collide)
  { id: 'mlops', label: 'MLOps', r: 140, angle: 180, dur: 60, isGreen: true },
  { id: 'python', label: 'Python', r: 140, angle: 300, dur: 60, isGreen: true },
  { id: 'kubernetes', label: 'Kubernetes', r: 140, angle: 60, dur: 60, isGreen: true },

  // Outer ring (r = 196, uniform duration 80s -> never collide)
  { id: 'aws', label: 'AWS', r: 196, angle: 130, dur: 80, isGreen: false },
  { id: 'spark', label: 'Spark', r: 196, angle: 350, dur: 80, isGreen: false },
  { id: 'statistics', label: 'Statistics', r: 196, angle: 230, dur: 80, isGreen: false },
  { id: 'llms', label: 'LLMs', r: 196, angle: 30, dur: 80, isGreen: true },
]

function SkillOrbit() {
  return (
    <div className="orbit-container" aria-hidden="true">
      <svg className="orbit-svg" viewBox="0 0 460 460">
        {/* Concentric subtle dotted guide rings */}
        <circle cx="230" cy="230" r="82" className="orbit-guide-ring" />
        <circle cx="230" cy="230" r="140" className="orbit-guide-ring" />
        <circle cx="230" cy="230" r="196" className="orbit-guide-ring" />

        {/* Orbit items with counter-rotation so text always stays upright and crisp */}
        {ORBIT_ITEMS.map((item) => {
          const rad = (item.angle * Math.PI) / 180
          const cx = 230 + item.r * Math.cos(rad)
          const cy = 230 + item.r * Math.sin(rad)

          return (
            <g
              key={item.id}
              className="orbit-pivot"
              style={{
                transformOrigin: '230px 230px',
                animationDuration: `${item.dur}s`,
                animationDelay: `${-(item.angle / 360) * item.dur}s`,
              }}
            >
              <foreignObject
                x={cx - 45}
                y={cy - 14}
                width="90"
                height="28"
                style={{ overflow: 'visible' }}
              >
                <div
                  className="orbit-counter"
                  style={{
                    animationDuration: `${item.dur}s`,
                    animationDelay: `${-(item.angle / 360) * item.dur}s`,
                  }}
                >
                  <div className={`orbit-pill ${item.isGreen ? 'pill-green' : 'pill-red'}`}>
                    <span className={`orbit-dot ${item.isGreen ? 'dot-green' : 'dot-red'}`} />
                    <span className="orbit-text">{item.label}</span>
                  </div>
                </div>
              </foreignObject>
            </g>
          )
        })}
      </svg>

      {/* Central glowing brain badge */}
      <div className="orbit-center-node">
        <div className="orbit-center-glow" />
        <div className="orbit-center-badge">
          {/* Neural Brain SVG Icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4.5a3.5 3.5 0 0 0-3.5 3.5c0 .3.04.58.11.85A4.5 4.5 0 0 0 5 13a4.5 4.5 0 0 0 3.32 4.33A3.5 3.5 0 0 0 12 19.5v-15z" />
            <path d="M12 4.5a3.5 3.5 0 0 1 3.5 3.5c0 .3-.04.58-.11.85A4.5 4.5 0 0 1 19 13a4.5 4.5 0 0 1-3.32 4.33A3.5 3.5 0 0 1 12 19.5v-15z" />
            <path d="M8.5 8.5c1-1 2.5-.5 3.5 0" />
            <path d="M15.5 8.5c-1-1-2.5-.5-3.5 0" />
            <path d="M8 13.5c1 .8 2.5.8 4 .5" />
            <path d="M16 13.5c-1 .8-2.5.8-4 .5" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function ResumePage() {
  const [mode, setMode] = useState('text') // 'text' | 'pdf'
  const [resumeText, setResumeText] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [targetRole, setTargetRole] = useState('Machine Learning Engineer')
  const [yearsExp, setYearsExp] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [showMinWarn, setShowMinWarn] = useState(false)
  const fileInputRef = useRef(null)

  const charCount = resumeText.length
  const MIN_CHARS = 50

  useEffect(() => {
    if (mode === 'text' && charCount > 0 && charCount < MIN_CHARS) {
      setShowMinWarn(true)
    } else {
      setShowMinWarn(false)
    }
  }, [charCount, mode])

  const handleAnalyze = async () => {
    setError(null)
    setResult(null)

    if (mode === 'text') {
      if (!resumeText.trim()) {
        setError('Please paste your resume text to begin analysis.')
        return
      }
      if (resumeText.trim().length < MIN_CHARS) {
        setShowMinWarn(true)
        setError(`Please paste at least ${MIN_CHARS} characters of resume text.`)
        return
      }
    } else {
      if (!selectedFile) {
        setError('Please select or drop a PDF resume file.')
        return
      }
    }

    setLoading(true)
    try {
      let res
      if (mode === 'text') {
        res = await fetch(`${API}/resume/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: resumeText,
            target_role: targetRole || null,
            years_exp: Number(yearsExp),
          }),
        })
      } else {
        const formData = new FormData()
        formData.append('file', selectedFile)
        res = await fetch(
          `${API}/resume/upload?target_role=${encodeURIComponent(targetRole)}&years_exp=${yearsExp}`,
          { method: 'POST', body: formData }
        )
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown error occurred' }))
        throw new Error(err.detail || `Server responded with status ${res.status}`)
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.type === 'application/pdf') {
      setSelectedFile(file)
      setError(null)
    } else {
      setError('Please drop a valid PDF file.')
    }
  }

  return (
    <>
      <style>{`
        .dna-page-root {
          min-height: 100vh;
          background: transparent;
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          position: relative;
        }

        .dna-main-layout {
          max-width: 1240px;
          margin: 0 auto;
          padding: 1rem 2rem 5rem;
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          gap: 3.5rem;
          align-items: start;
        }

        @media (max-width: 980px) {
          .dna-main-layout {
            grid-template-columns: 1fr;
            gap: 2.5rem;
            padding: 1rem 1.25rem 4rem;
          }
        }

        /* ── Left Column Typography ── */
        .dna-left-col {
          display: flex;
          flex-direction: column;
        }

        .dna-hero-title {
          font-size: clamp(2.75rem, 4.2vw, 3.85rem);
          font-weight: 850;
          line-height: 1.08;
          letter-spacing: -0.035em;
          color: #0f172a;
          margin: 0 0 1.25rem 0;
        }

        .dna-gradient-word {
          display: inline-block;
          background: linear-gradient(90deg, #6366f1 0%, #4f46e5 50%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .dna-hero-desc {
          font-size: 1.05rem;
          color: #64748b;
          line-height: 1.6;
          max-width: 480px;
          margin: 0 0 2rem 0;
        }

        /* ── Skill Orbit Visual ── */
        .orbit-container {
          position: relative;
          width: 100%;
          max-width: 355px;
          aspect-ratio: 1;
          margin: 0 auto 1.35rem auto;
        }

        .orbit-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .orbit-guide-ring {
          fill: none;
          stroke: #e0e7ff;
          stroke-width: 1.25;
          stroke-dasharray: 4 6;
        }

        /* SVG Orbit Animations */
        @keyframes orbitSpinClockwise {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @keyframes orbitCounterRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }

        .orbit-pivot {
          animation: orbitSpinClockwise linear infinite;
        }

        .orbit-counter {
          animation: orbitCounterRotate linear infinite;
          transform-origin: center center;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
        }

        /* Skill Pills */
        .orbit-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2.5px 8px 2.5px 7px;
          border-radius: 9999px;
          white-space: nowrap;
          font-size: 10px;
          font-weight: 600;
          line-height: 1.2;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
          transition: transform 0.2s ease;
          user-select: none;
        }

        .pill-green {
          background-color: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
        }

        .pill-red {
          background-color: #fff1f2;
          border: 1px solid #fecdd3;
          color: #be123c;
        }

        .orbit-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .dot-green { background-color: #10b981; }
        .dot-red   { background-color: #f43f5e; }

        /* Center Brain Node */
        .orbit-center-node {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .orbit-center-glow {
          position: absolute;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 70%);
          filter: blur(8px);
          animation: brainAura 3s ease-in-out infinite alternate;
        }

        .orbit-center-badge {
          position: relative;
          z-index: 2;
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 20px -3px rgba(124, 58, 237, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.3) inset;
        }

        @keyframes brainAura {
          0% { transform: scale(0.92); opacity: 0.6; }
          100% { transform: scale(1.15); opacity: 0.95; }
        }

        /* Orbit Legend */
        .orbit-legend {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          padding-left: 0.5rem;
        }

        .orbit-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #475569;
        }

        /* ── Three Horizontal Feature Cards (Semi-Transparent Glass) ── */
        .dna-step-cards-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        @media (max-width: 600px) {
          .dna-step-cards-row {
            grid-template-columns: 1fr;
          }
        }

        .dna-step-card {
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 14px;
          padding: 1rem 0.95rem;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .dna-step-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.82);
          box-shadow: 0 6px 16px -4px rgba(15, 23, 42, 0.08);
        }

        .dna-step-card-num {
          font-size: 0.8rem;
          font-weight: 800;
          color: #059669;
          margin-bottom: 0.35rem;
          letter-spacing: -0.01em;
        }

        .dna-step-card-title {
          font-size: 0.92rem;
          font-weight: 750;
          color: #0f172a;
          margin-bottom: 0.25rem;
        }

        .dna-step-card-desc {
          font-size: 0.75rem;
          color: #64748b;
          line-height: 1.45;
        }

        /* ── Right Column: Analyzer Window Container (Semi-Transparent Glass) ── */
        .analyzer-window {
          background: rgba(255, 255, 255, 0.86);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(226, 232, 240, 0.85);
          border-radius: 22px;
          box-shadow:
            0 12px 36px -10px rgba(15, 23, 42, 0.08),
            0 4px 12px -2px rgba(15, 23, 42, 0.04),
            20px 20px 60px -25px rgba(52, 211, 153, 0.12),
            -20px 30px 60px -25px rgba(99, 102, 241, 0.1);
          overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .analyzer-window:hover {
          transform: translateY(-2px);
          border-color: rgba(99, 102, 241, 0.3);
          box-shadow:
            0 16px 44px -10px rgba(99, 102, 241, 0.14),
            0 6px 16px -2px rgba(15, 23, 42, 0.06),
            25px 25px 70px -20px rgba(52, 211, 153, 0.18);
        }

        /* Analyzer Window Header Bar */
        .analyzer-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1.4rem;
          background: rgba(255, 255, 255, 0.7);
          border-bottom: 1px solid rgba(241, 245, 249, 0.8);
        }

        /* Scoped Result Cards Glassmorphic Transparency */
        .dna-page-root .ciq-card {
          background: rgba(255, 255, 255, 0.72) !important;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(226, 232, 240, 0.8) !important;
          box-shadow: 0 4px 16px -4px rgba(15, 23, 42, 0.04);
        }

        .window-control-dots {
          display: flex;
          gap: 6px;
        }

        .control-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #cbd5e1;
        }

        .analyzer-status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.68rem;
          font-weight: 750;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #334155;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .status-pulse-dot {
          width: 6.5px;
          height: 6.5px;
          border-radius: 50%;
          background-color: #10b981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
          animation: statusBlink 2.5s infinite;
        }

        @keyframes statusBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }

        /* Analyzer Inner Form Body */
        .analyzer-body {
          padding: 1.6rem 1.6rem 1.4rem;
        }

        /* Step Header Row */
        .section-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .section-title-wrap {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .step-circle-badge {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background-color: #ede9fe;
          color: #7c3aed;
          font-size: 0.75rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .step-title-text {
          font-size: 0.95rem;
          font-weight: 750;
          color: #0f172a;
        }

        /* Paste / PDF Pill Switch */
        .mode-pill-toggle {
          display: inline-flex;
          background: #f1f5f9;
          border-radius: 9999px;
          padding: 3px;
        }

        .toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 14px;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.18s ease;
          background: transparent;
          color: #64748b;
        }

        .toggle-btn.active {
          background: #6366f1;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(99, 102, 241, 0.35);
        }

        /* Large Resume Textarea */
        .resume-textarea-box {
          position: relative;
          background: #fafafa;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 0.95rem 1rem 2.2rem 1rem;
          margin-bottom: 1.5rem;
          transition: border-color 0.2s, background-color 0.2s, box-shadow 0.2s;
        }

        .resume-textarea-box:focus-within {
          background: #ffffff;
          border-color: #818cf8;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
        }

        .resume-textarea-input {
          width: 100%;
          min-height: 160px;
          border: none;
          background: transparent;
          outline: none;
          resize: vertical;
          font-family: inherit;
          font-size: 0.88rem;
          color: #1e293b;
          line-height: 1.6;
        }

        .resume-textarea-input::placeholder {
          color: #94a3b8;
          font-family: inherit;
        }

        .textarea-meta-bar {
          position: absolute;
          bottom: 8px;
          right: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          pointer-events: none;
        }

        .char-track-bar {
          width: 42px;
          height: 3px;
          background: #e2e8f0;
          border-radius: 2px;
          overflow: hidden;
        }

        .char-track-fill {
          height: 100%;
          background: #10b981;
          transition: width 0.15s ease;
        }

        .char-counter-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: #94a3b8;
        }

        /* PDF Upload Drag Zone */
        .pdf-drop-zone {
          background: #fafafa;
          border: 2px dashed #cbd5e1;
          border-radius: 14px;
          padding: 2.2rem 1rem;
          text-align: center;
          cursor: pointer;
          margin-bottom: 1.5rem;
          transition: border-color 0.2s, background-color 0.2s;
        }

        .pdf-drop-zone:hover, .pdf-drop-zone.drag-active {
          border-color: #6366f1;
          background: #f5f3ff;
        }

        /* Role Selection Pills */
        .role-chips-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .role-chip-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 0.4rem 0.95rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 550;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .role-chip-btn:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
          color: #0f172a;
        }

        .role-chip-btn.selected {
          background-color: #d1fae5;
          border-color: #34d399;
          color: #065f46;
          font-weight: 650;
        }

        /* Experience Slider */
        .exp-slider-section {
          margin-bottom: 1.5rem;
        }

        .exp-header-right {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .exp-number-display {
          font-size: 1.45rem;
          font-weight: 850;
          color: #0f172a;
          line-height: 1;
        }

        .exp-seniority-pill {
          display: inline-block;
          background: #ede9fe;
          color: #6366f1;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 9px;
          border-radius: 9999px;
        }

        .custom-range-slider {
          width: 100%;
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 9999px;
          background: #e2e8f0;
          outline: none;
          cursor: pointer;
          margin: 0.75rem 0 0.4rem;
        }

        .custom-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 19px;
          height: 19px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .custom-range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
        }

        .custom-range-slider::-moz-range-thumb {
          width: 19px;
          height: 19px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
          cursor: pointer;
        }

        .slider-milestones-row {
          display: flex;
          justify-content: space-between;
          padding: 0 2px;
        }

        .milestone-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: #94a3b8;
        }

        /* Validation Alert Banner */
        .validation-alert-banner {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          font-size: 0.8rem;
          color: #ef4444;
          font-weight: 500;
          margin-bottom: 1.25rem;
          line-height: 1.4;
        }

        /* Primary Action CTA */
        .dna-analyse-cta {
          width: 100%;
          background: linear-gradient(90deg, #6366f1 0%, #4f46e5 100%);
          color: #ffffff;
          border: none;
          border-radius: 14px;
          padding: 0.95rem 1.5rem;
          font-size: 1.02rem;
          font-weight: 750;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 10px 25px -4px rgba(99, 102, 241, 0.45);
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        }

        .dna-analyse-cta:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px -4px rgba(99, 102, 241, 0.55);
        }

        .dna-analyse-cta:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .cta-arrow-circle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          font-size: 0.85rem;
          transition: transform 0.2s ease;
        }

        .dna-analyse-cta:hover:not(:disabled) .cta-arrow-circle {
          transform: translateX(3px);
        }

        /* Privacy Disclaimer */
        .dna-privacy-text {
          text-align: center;
          font-size: 0.75rem;
          color: #64748b;
          margin: 0.85rem 0 0 0;
          font-weight: 450;
        }

        /* ── Reduced motion accessibility ── */
        @media (prefers-reduced-motion: reduce) {
          .orbit-pivot,
          .orbit-counter,
          .orbit-center-glow,
          .status-pulse-dot {
            animation: none !important;
          }
        }
      `}</style>

      {/* Pill Navbar */}
      <Navbar />

      <main className="dna-page-root">
        <div className="dna-main-layout">

          {/* ══════════════ LEFT COLUMN ══════════════ */}
          <section className="dna-left-col" aria-label="Overview and Features">
            <h1 className="dna-hero-title">
              Decode your<br />
              <span className="dna-gradient-word">career DNA.</span>
            </h1>

            <p className="dna-hero-desc">
              Drop in your resume. CareerIQ maps every skill you have,
              compares it to the role you want, and shows exactly what
              stands between you and the offer.
            </p>

            {/* Orbit Animation Visual */}
            <SkillOrbit />

            {/* Legend */}
            <div className="orbit-legend">
              <div className="orbit-legend-item">
                <span className="orbit-dot dot-green" />
                Matched
              </div>
              <div className="orbit-legend-item">
                <span className="orbit-dot dot-red" />
                Gap
              </div>
            </div>

            {/* Three Step Cards */}
            <div className="dna-step-cards-row">
              <div className="dna-step-card">
                <div className="dna-step-card-num">01</div>
                <div className="dna-step-card-title">Extract</div>
                <div className="dna-step-card-desc">Skills, tools & seniority signals</div>
              </div>
              <div className="dna-step-card">
                <div className="dna-step-card-num">02</div>
                <div className="dna-step-card-title">Benchmark</div>
                <div className="dna-step-card-desc">Against your target role</div>
              </div>
              <div className="dna-step-card">
                <div className="dna-step-card-num">03</div>
                <div className="dna-step-card-title">Reveal gaps</div>
                <div className="dna-step-card-desc">With a prioritised roadmap</div>
              </div>
            </div>
          </section>

          {/* ══════════════ RIGHT COLUMN (Analyzer Card) ══════════════ */}
          <section className="analyzer-window" aria-label="Resume Analyzer Form">
            {/* Top Window Bar */}
            <div className="analyzer-top-bar">
              <div className="window-control-dots">
                <span className="control-dot" />
                <span className="control-dot" />
                <span className="control-dot" />
              </div>
              <div className="analyzer-status-badge">
                <span className="status-pulse-dot" />
                ANALYZER ONLINE
              </div>
            </div>

            <div className="analyzer-body">
              {/* Step 1: Feed your resume */}
              <div className="section-header-row">
                <div className="section-title-wrap">
                  <span className="step-circle-badge">1</span>
                  <span className="step-title-text">Feed your resume</span>
                </div>
                <div className="mode-pill-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${mode === 'text' ? 'active' : ''}`}
                    onClick={() => setMode('text')}
                  >
                    <span>📋</span> Paste
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${mode === 'pdf' ? 'active' : ''}`}
                    onClick={() => setMode('pdf')}
                  >
                    <span>📄</span> PDF
                  </button>
                </div>
              </div>

              {/* Text Input Mode */}
              {mode === 'text' && (
                <div className="resume-textarea-box">
                  <textarea
                    className="resume-textarea-input"
                    placeholder="Paste your resume here: skills, experience, projects, education..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    aria-label="Resume text"
                  />
                  <div className="textarea-meta-bar">
                    <div className="char-track-bar">
                      <div
                        className="char-track-fill"
                        style={{ width: `${Math.min(100, (charCount / MIN_CHARS) * 100)}%` }}
                      />
                    </div>
                    <span className="char-counter-label">{charCount} chars</span>
                  </div>
                </div>
              )}

              {/* PDF Upload Mode */}
              {mode === 'pdf' && (
                <div
                  className={`pdf-drop-zone ${dragOver ? 'drag-active' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload PDF resume"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) { setSelectedFile(f); setError(null) }
                    }}
                  />
                  <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>📄</div>
                  {selectedFile ? (
                    <>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#059669', marginBottom: '0.2rem' }}>
                        ✓ {selectedFile.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {(selectedFile.size / 1024).toFixed(0)} KB — Click to change
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.2rem' }}>
                        Drop your PDF resume here
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        or click to browse · PDF format only
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 2: Pick your target role */}
              <div className="section-header-row" style={{ marginTop: '0.5rem' }}>
                <div className="section-title-wrap">
                  <span className="step-circle-badge">2</span>
                  <span className="step-title-text">Pick your target role</span>
                </div>
              </div>

              <div className="role-chips-wrap">
                {TARGET_ROLES.map((role) => {
                  const isSelected = targetRole === role
                  return (
                    <button
                      key={role}
                      type="button"
                      className={`role-chip-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => setTargetRole(role)}
                    >
                      {isSelected && <span>✓</span>}
                      {role}
                    </button>
                  )
                })}
              </div>

              {/* Step 3: Years of experience */}
              <div className="exp-slider-section">
                <div className="section-header-row">
                  <div className="section-title-wrap">
                    <span className="step-circle-badge">3</span>
                    <span className="step-title-text">Years of experience</span>
                  </div>
                  <div className="exp-header-right">
                    <span className="exp-number-display">{yearsExp}</span>
                    <span className="exp-seniority-pill">{getSeniorityBadge(yearsExp)}</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={yearsExp}
                  onChange={(e) => setYearsExp(Number(e.target.value))}
                  className="custom-range-slider"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${(yearsExp / 20) * 100}%, #e2e8f0 ${(yearsExp / 20) * 100}%, #e2e8f0 100%)`
                  }}
                  aria-label="Years of experience slider"
                />

                <div className="slider-milestones-row">
                  <span className="milestone-label">0</span>
                  <span className="milestone-label">5</span>
                  <span className="milestone-label">10</span>
                  <span className="milestone-label">15</span>
                  <span className="milestone-label">20+</span>
                </div>
              </div>

              {/* Validation Warning Alert */}
              {showMinWarn && (
                <div className="validation-alert-banner" role="alert">
                  <span>ⓘ</span>
                  <span>Add a bit more detail. Paste at least 50 characters of resume text.</span>
                </div>
              )}

              {/* Error Message from Server */}
              {error && <ApiError message={error} />}

              {/* Primary Action Button */}
              <button
                type="button"
                className="dna-analyse-cta"
                onClick={handleAnalyze}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <>Analysing… ⏳</>
                ) : (
                  <>
                    Analyse my resume
                    <span className="cta-arrow-circle">→</span>
                  </>
                )}
              </button>

              {/* Privacy Disclaimer */}
              <p className="dna-privacy-text">
                Private by design. Your resume is only used for this analysis.
              </p>
            </div>
          </section>
        </div>

        {/* ══════════════ ANALYSIS RESULTS (Below) ══════════════ */}
        {(loading || result) && (
          <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 2rem 6rem' }}>
            {loading && <Loading label="Extracting skills and computing gap analysis…" />}
            {result && !loading && <AnalysisResults result={result} />}
          </div>
        )}
      </main>
    </>
  )
}

/* ── Preserved Analysis Results Section ── */
function AnalysisResults({ result }) {
  const gap = result.skill_gap
  const coverage = result.coverage_pct

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
      <SyntheticNotice />

      {result.source === 'pdf_upload' && (
        <div className="ciq-card" style={{ border: '1px solid var(--color-brand-100)', background: 'var(--color-brand-50)' }}>
          <div className="ciq-card-body" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="ciq-badge ciq-badge-brand">PDF Extracted</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-brand-700)' }}>
                <strong>{result.filename}</strong> — {result.pages} page(s)
              </span>
            </div>
            {result.extracted_text_preview && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', background: 'var(--color-surface)', padding: '0.75rem', borderRadius: '8px', maxHeight: '80px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                {result.extracted_text_preview}…
              </div>
            )}
          </div>
        </div>
      )}

      <div className="ciq-card">
        <div className="ciq-card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 className="ciq-h3">Extracted Skills</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {result.skill_count} canonical skill{result.skill_count !== 1 ? 's' : ''} detected
              </p>
            </div>
            {coverage !== null && (
              <DonutChart value={Math.round(coverage)} label="Coverage"
                color="var(--color-brand-500)" size={90} />
            )}
          </div>
          {result.extracted_skills?.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {result.extracted_skills.map((s) => (
                <span key={s} className="ciq-skill-tag ciq-skill-have">{s}</span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              No canonical skills detected. Try expanding your skill descriptions.
            </p>
          )}
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
            Extracted using keyword regex matching against the skills master.{' '}
            <a href={`${API}/docs`} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>
              See API docs →
            </a>
          </p>
        </div>
      </div>

      {gap && (
        <>
          <div className="ciq-card" style={{ background: 'var(--color-surface-subtle)' }}>
            <div className="ciq-card-body">
              <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
                {[
                  { value: `${gap.coverage_pct}%`, label: 'Skill Coverage', color: 'var(--color-brand-500)' },
                  { value: gap.have_skills?.length || 0, label: 'Skills You Have', color: 'var(--color-emerald-600)' },
                  { value: gap.missing_skills?.length || 0, label: 'Skills to Learn', color: 'var(--color-red-600)' },
                  { value: result.target_role, label: 'Target Role', color: 'var(--color-text-heading)', isText: true },
                ].map(({ value, label, color, isText }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: isText ? '1rem' : '2rem', fontWeight: 800, color, letterSpacing: isText ? '-0.01em' : '-0.03em', lineHeight: 1.1 }}>{value}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '4px', fontWeight: 500 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="ciq-card">
              <div className="ciq-card-body">
                <h3 className="ciq-h3" style={{ marginBottom: '1rem' }}>💪 Your Strong Skills</h3>
                {gap.have_skills?.length > 0 ? (
                  <div>
                    {gap.have_skills.slice(0, 8).map((s) => (
                      <div key={s.skill} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                        <span className="ciq-skill-tag ciq-skill-have">{s.skill}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{s.market_demand_pct}% demand</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No matching role skills found in your resume.</p>
                )}
              </div>
            </div>

            <div className="ciq-card">
              <div className="ciq-card-body">
                <h3 className="ciq-h3" style={{ marginBottom: '0.375rem' }}>⚠️ Priority Missing Skills</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.875rem' }}>{gap.formula_note}</p>
                {gap.missing_skills?.length > 0 ? (
                  <div>
                    {gap.missing_skills.slice(0, 8).map((s) => (
                      <SkillGapRow key={s.skill} skill={s} />
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-emerald-600)', fontWeight: 600 }}>
                    🎉 Great! You already have most required skills for this role.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href={`/recommendations?skills=${encodeURIComponent(result.extracted_skills.join(','))}&role=${encodeURIComponent(result.target_role)}&exp=${result.years_exp}`}
              className="btn btn-primary btn-lg"
            >
              Find Matching Jobs →
            </Link>
            <Link
              href={`/skill-gap?skills=${encodeURIComponent(result.extracted_skills.join(','))}&role=${encodeURIComponent(result.target_role)}`}
              className="btn btn-secondary btn-lg"
            >
              Full Skill Gap Report
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
