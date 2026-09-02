import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { getCompanies, getSelectedCompany } from '../data/companyCatalog.js'
import {
  getInterviewDetails,
  getInterviewHistory,
} from '../api/interviews.js'

const APP_NAV = [
  { label: 'Interview Setup', to: '/setup' },
  { label: 'My Sessions', to: '/sessions' },
  { label: 'Progress Report', to: '/progress' },
  { label: 'Settings', to: '/profile' },
]

export default function Progress() {
  const navigate = useNavigate()
  const [companyFilter, setCompanyFilter] = useState(getSelectedCompany)
  const [allSessions, setAllSessions] = useState([])
const [loading, setLoading] = useState(true)
const [loadError, setLoadError] = useState('')

useEffect(() => {
  let cancelled = false

  async function loadProgress() {
    try {
      const history = await getInterviewHistory()
      const completed = history.filter(
        (session) => session.status === 'COMPLETED'
      )

      const withScores = await Promise.all(
        completed.map(async (session) => {
          const details = await getInterviewDetails(session.id)
          const completedAt = session.completedAt || session.startedAt

          return {
            id: session.id,
            completedAt,
            date: new Intl.DateTimeFormat('en', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }).format(new Date(completedAt)),
            company: session.company || 'Not specified',
            score: details.result?.overallScore ?? 0,
          }
        })
      )

      if (!cancelled) setAllSessions(withScores)
    } catch (error) {
      if (!cancelled) {
        setLoadError(
          error.message || 'Could not load progress data.'
        )
      }
    } finally {
      if (!cancelled) setLoading(false)
    }
  }

  loadProgress()

  return () => {
    cancelled = true
  }
}, [])
  const sessions = useMemo(
    () => allSessions.filter((session) => companyFilter === 'All companies' || session.company === companyFilter),
    [allSessions, companyFilter]
  )
  const chronological = [...sessions].sort(
  (a, b) => new Date(a.completedAt) - new Date(b.completedAt)
)
  const firstScore = chronological[0]?.score || 0
  const lastScore = chronological.at(-1)?.score || 0
  const averageScore = sessions.length ? Math.round(sessions.reduce((sum, session) => sum + session.score, 0) / sessions.length) : 0
  const improvement = lastScore - firstScore

  const measuredProgress = [
  {
    skill: 'Overall performance',
    first: `${firstScore}%`,
    last: `${lastScore}%`,
    change: `${improvement >= 0 ? '+' : ''}${improvement}% ${improvement >= 0 ? '↑' : '↓'}`,
    up: improvement >= 0,
  },
]
  const stats = [
    { l: 'Interviews', v: String(sessions.length) },
    { l: 'Average score', v: `${averageScore}%` },
    { l: 'First score', v: `${firstScore}%` },
    { l: 'Last score', v: `${lastScore}%` },
    { l: 'Best score', v: `${sessions.length ? Math.max(...sessions.map((session) => session.score)) : 0}%` },
    { l: 'Improvement', v: `${improvement >= 0 ? '+' : ''}${improvement}%`, color: improvement >= 0 ? 'var(--forest)' : 'var(--coral)' },
  ]
  const chartSessions = chronological.slice(-8)
  const chartPoints = chartSessions.map((session, index) => {
    const x = chartSessions.length === 1 ? 364 : 48 + (632 * index) / (chartSessions.length - 1)
    return { x, y: 210 - session.score * 1.9, score: session.score }
  })
  const pointString = chartPoints.map((point) => `${point.x},${point.y}`).join(' ')
  const areaPath = chartPoints.length ? `M${pointString.replaceAll(' ', ' L')} L${chartPoints.at(-1).x},210 L${chartPoints[0].x},210 Z` : ''

  return (
    <section className="screen" id="progress">
      <TopBar nav={APP_NAV} showUser />
      <div className="wrap pagepad">
        <button className="btn ghost sm" style={{ marginBottom: 16 }} onClick={() => navigate('/dashboard')}>
          ← Back to dashboard
        </button>
        {loading && (
  <p className="sub muted">Loading progress data…</p>
)}

{loadError && (
  <p className="field-error">{loadError}</p>
)}
        <div className="pr-heading-row">
          <h1 className="pr-title">{companyFilter === 'All companies' ? 'All companies' : companyFilter} — Progress Report</h1>
          <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} aria-label="Filter progress by company">
            <option>All companies</option>
            {getCompanies().filter((company) => company.status === 'Active').map((company) => <option key={company.id}>{company.name}</option>)}
          </select>
        </div>

        <div className="card pr-card">
          <span className="pr-badge">
  {improvement >= 0 ? '📈 Improving' : '📉 Needs focus'}
</span>
          <div className="pr-grid">
            {stats.map((s) => (
              <div className="pr-stat" key={s.l}>
                <div className="l">{s.l}</div>
                <div className="v" style={s.color ? { color: s.color } : undefined}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card pr-sec">
          <h3>Score trend</h3>
          <svg
  viewBox="0 0 700 250"
  style={{ width: '100%', height: 'auto' }}
  role="img"
  aria-label={`Score trend across ${chartSessions.length} completed sessions`}
>
            <g stroke="#EEF2F0" strokeWidth="1" strokeDasharray="4 5">
              <line x1="48" y1="20" x2="688" y2="20" /><line x1="48" y1="67.5" x2="688" y2="67.5" />
              <line x1="48" y1="115" x2="688" y2="115" /><line x1="48" y1="162.5" x2="688" y2="162.5" /><line x1="48" y1="210" x2="688" y2="210" />
            </g>
            <g fontFamily="Inter, sans-serif" fontSize="11" fill="#8A968F" textAnchor="end">
              <text x="38" y="24">100</text><text x="38" y="71.5">75</text><text x="38" y="119">50</text><text x="38" y="166.5">25</text><text x="38" y="214">0</text>
            </g>
            {areaPath && <path d={areaPath} fill="#ECF6F1" />}
            {pointString && <polyline points={pointString} fill="none" stroke="#0A6E45" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
            <g fill="#0A6E45">{chartPoints.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="5" />)}</g>
            <g fontFamily="Inter, sans-serif" fontSize="11" fill="#8A968F" textAnchor="middle">
              {chartPoints.map((point, index) => <text key={index} x={point.x} y="232">S{index + 1}</text>)}
            </g>
          </svg>
        </div>

        <div className="card pr-sec">
          <h3>Session history</h3>
          <table className="ptbl">
            <thead><tr><th>Date</th><th>Company</th><th>Score</th><th>Change</th></tr></thead>
            <tbody>
              {sessions.map((session, index) => {
                const previous = sessions[index + 1]
                const change = previous ? session.score - previous.score : null
                return <tr key={session.id}>
                  <td>{session.date}</td>
                  <td>{session.company}</td>
                  <td className="score">{session.score}%</td>
                  <td className={change === null ? 'firsttag' : change >= 0 ? 'up' : 'down'}>
                    {change === null ? '— first session' : `${change >= 0 ? '+' : ''}${change}% ${change >= 0 ? '↑' : '↓'}`}
                  </td>
                </tr>
              })}
            </tbody>
          </table>
        </div>

        <div className="card pr-sec">
          <h3>Measured progress</h3>
          <table className="ptbl">
            <thead><tr><th>Skill</th><th>First</th><th>Last</th><th>Change</th></tr></thead>
            <tbody>
              {measuredProgress.map((s) => (
                <tr key={s.skill}>
                  <td>{s.skill}</td>
                  <td>{s.first}</td>
                  <td>{s.last}</td>
                  <td className={s.up ? 'up' : 'down'}>{s.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
