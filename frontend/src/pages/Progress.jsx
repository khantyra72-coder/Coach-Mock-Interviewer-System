import { useEffect, useMemo, useState } from 'react'
import { BriefcaseBusiness, Code2, Layers3, MessageCircle, Trophy, TrendingUp } from 'lucide-react'
import TopBar from '../components/TopBar.jsx'
import { getInterviewDetails, getInterviewHistory } from '../api/interviews.js'
import { getUnsyncedLocalSessions, syncLocalCompletedSessions } from '../utils/syncLocalInterviewHistory.js'
import { INTERVIEW_TYPES, TECH_ROLES } from '../data/interviewTaxonomy.js'

const APP_NAV = [{ label: 'Interview Setup', to: '/role' }, { label: 'My Sessions', to: '/sessions' }, { label: 'Progress Report', to: '/progress' }]
const RANGE_OPTIONS = [{ label: 'Last 30 days', days: 30 }, { label: 'Last 90 days', days: 90 }, { label: 'Last year', days: 365 }, { label: 'All time', days: null }]
const average = (items) => items.length ? Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length) : 0
const measuredAverage = (items) => items.length ? average(items) : null

function MetricCard({ icon: Icon, label, value, note, accent }) {
  return <div className="card progress-metric"><span className="progress-metric-icon"><Icon size={27} strokeWidth={1.8} /></span><div><div className="progress-metric-label">{label}</div><div className={`progress-metric-value${accent ? ' accent' : ''}`}>{value}</div><div className="progress-metric-note">{note}</div></div></div>
}

function ProgressBar({ icon: Icon, label, value }) {
  return <div className="progress-bar-row"><span className="progress-row-icon"><Icon size={20} strokeWidth={1.8} /></span><span className="progress-row-label">{label}</span><span className="progress-bar-track"><i style={{ width: `${value ?? 0}%` }} /></span><strong>{value === null ? '—' : `${value}%`}</strong></div>
}

export default function Progress() {
  const [allSessions, setAllSessions] = useState([])
  const [roleFilter, setRoleFilter] = useState('All roles')
  const [typeFilter, setTypeFilter] = useState('All interview types')
  const [rangeFilter, setRangeFilter] = useState('Last 90 days')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadProgress() {
      try {
        await syncLocalCompletedSessions()
        const history = await getInterviewHistory()
        const completed = history.filter((session) => session.status === 'COMPLETED')
        const sessions = await Promise.all(completed.map(async (session) => {
          const details = await getInterviewDetails(session.id)
          return { id: session.id, completedAt: session.completedAt || session.startedAt, role: session.role || 'Not specified', type: session.interviewType || 'Technical', score: details.result?.overallScore ?? 0, metrics: details.result }
        }))
        const backendIds = new Set(sessions.map((session) => String(session.id)))
        const localOnly = getUnsyncedLocalSessions()
          .filter((session) => !backendIds.has(String(session.id)))
          .map((session) => ({ id: session.id, completedAt: session.completedAt, role: session.role || 'Not specified', type: session.type || 'Technical', score: session.score ?? session.result?.overallScore ?? 0, metrics: session.result }))
        if (!cancelled) setAllSessions([...sessions, ...localOnly])
      } catch (error) {
        if (!cancelled) {
          setAllSessions(getUnsyncedLocalSessions()
            .map((session) => ({ id: session.id, completedAt: session.completedAt, role: session.role || 'Not specified', type: session.type || 'Technical', score: session.score ?? session.result?.overallScore ?? 0, metrics: session.result })))
          setLoadError(error.message || 'Could not sync progress data with the server.')
        }
      } finally { if (!cancelled) setLoading(false) }
    }
    loadProgress()
    return () => { cancelled = true }
  }, [])

  const roleOptions = useMemo(() => [...new Set([...TECH_ROLES, ...allSessions.map((session) => session.role).filter((role) => role !== 'Not specified')])], [allSessions])
  const sessions = useMemo(() => {
    const range = RANGE_OPTIONS.find((option) => option.label === rangeFilter)
    const cutoff = range?.days ? Date.now() - range.days * 86400000 : null
    return allSessions.filter((session) => (roleFilter === 'All roles' || session.role === roleFilter) && (typeFilter === 'All interview types' || session.type === typeFilter) && (!cutoff || new Date(session.completedAt).getTime() >= cutoff))
  }, [allSessions, rangeFilter, roleFilter, typeFilter])
  const chronological = useMemo(() => [...sessions].sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt)), [sessions])
  const averageScore = average(sessions)
  const bestScore = sessions.length ? Math.max(...sessions.map((session) => session.score)) : 0
  const improvement = sessions.length > 1 ? chronological.at(-1).score - chronological[0].score : 0
  const typeScores = INTERVIEW_TYPES.map((type) => ({ label: type, value: measuredAverage(sessions.filter((session) => session.type === type)), icon: type === 'Technical' ? Code2 : type === 'Behavioral' ? MessageCircle : Layers3 }))
  const chartPoints = chronological.slice(-6).map((session, index, items) => ({ x: items.length === 1 ? 350 : 74 + (552 * index) / (items.length - 1), y: 202 - session.score * 1.5, score: session.score, label: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(session.completedAt)) }))
  const points = chartPoints.map((point) => `${point.x},${point.y}`).join(' ')
  const area = chartPoints.length ? `M ${chartPoints.map((point) => `${point.x} ${point.y}`).join(' L ')} L ${chartPoints.at(-1).x} 202 L ${chartPoints[0].x} 202 Z` : ''

  return <section className="screen" id="progress"><TopBar nav={APP_NAV} showUser /><div className="wrap pagepad progress-page">
    <div className="progress-heading"><div><h1>Your Progress</h1><p>Track your interview skills and see where to focus next.</p></div><div className="progress-filters">
      <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filter by role"><option>All roles</option>{roleOptions.map((role) => <option key={role}>{role}</option>)}</select>
      <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by interview type"><option>All interview types</option>{INTERVIEW_TYPES.map((type) => <option key={type}>{type}</option>)}</select>
      <select value={rangeFilter} onChange={(e) => setRangeFilter(e.target.value)} aria-label="Filter by date range">{RANGE_OPTIONS.map((option) => <option key={option.label}>{option.label}</option>)}</select>
    </div></div>
    {loading && <p className="sub muted">Loading progress data…</p>}{loadError && <p className="field-error">{loadError}</p>}
    <div className="progress-metrics"><MetricCard icon={BriefcaseBusiness} label="Completed interviews" value={sessions.length} note="Sessions completed" /><MetricCard icon={TrendingUp} label="Average score" value={`${averageScore}%`} note="Across filtered sessions" accent /><MetricCard icon={Trophy} label="Personal best" value={`${bestScore}%`} note="Your highest score" accent /><MetricCard icon={TrendingUp} label="Improvement" value={`${improvement >= 0 ? '+' : ''}${improvement}%`} note="First to latest score" accent /></div>
    <div className="progress-main-grid"><div className="card progress-panel progress-trend"><h2>Score trend</h2><p>Your average score over recent sessions</p>{chartPoints.length ? <svg viewBox="0 0 700 250" role="img" aria-label={`Score trend across ${chartPoints.length} sessions`}>
      {[100, 75, 50, 25, 0].map((value) => { const y = 52 + (100 - value) * 1.5; return <g key={value}><line x1="74" y1={y} x2="642" y2={y} /><text x="52" y={y + 4}>{value}%</text></g> })}<path className="progress-chart-area" d={area} /><polyline className="progress-chart-line" points={points} />{chartPoints.map((point) => <g key={`${point.x}-${point.label}`}><text className="progress-chart-score" x={point.x} y={point.y - 14}>{point.score}%</text><circle cx={point.x} cy={point.y} r="5" /><text className="progress-chart-date" x={point.x} y="226">{point.label}</text></g>)}</svg> : <div className="progress-empty">Complete an interview to see your score trend.</div>}</div>
      <div className="card progress-panel"><h2>Performance by interview type</h2><p>Average score by interview type</p><div className="progress-bars type-bars">{typeScores.map((item) => <ProgressBar key={item.label} {...item} />)}</div></div></div>
  </div></section>
}
