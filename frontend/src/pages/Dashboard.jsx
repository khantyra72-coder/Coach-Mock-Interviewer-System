import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Reveal from '../components/Reveal.jsx'
import { getStoredUser } from '../api/client.js'
import {
  getInterviewDetails,
  getInterviewHistory,
} from '../api/interviews.js'
import { getUnsyncedLocalSessions, syncLocalCompletedSessions } from '../utils/syncLocalInterviewHistory.js'
import {
  ClipboardList,
  Target,
  Award,
  Layers,
  Code,
  Layout,
  Server,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Minus,
  Play,
} from 'lucide-react'

const APP_NAV = [
  { label: 'Interview Setup', to: '/role' },
  { label: 'My Sessions', to: '/sessions' },
  { label: 'Progress Report', to: '/progress' },
]

const ROLE_ICONS = {
  'Software Engineer': Code,
  'Frontend Developer': Layout,
  'Backend Developer': Server,
  'Data Scientist': BarChart3,
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user] = useState(getStoredUser)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
  let cancelled = false

  async function loadDashboard() {
    try {
      await syncLocalCompletedSessions()
      const history = await getInterviewHistory()
      const completed = history.filter(
        (session) => session.status === 'COMPLETED'
      )

      const withScores = await Promise.all(
        completed.map(async (session) => {
          const details = await getInterviewDetails(session.id)
          return {
            ...session,
            score: details.result?.overallScore ?? 0,
          }
        })
      )

      const backendIds = new Set(withScores.map((session) => String(session.id)))
      const localOnly = getUnsyncedLocalSessions().filter((session) =>
        !backendIds.has(String(session.id))
      )
      if (!cancelled) setSessions([...withScores, ...localOnly])
    } catch (error) {
      if (!cancelled) {
        setSessions(getUnsyncedLocalSessions())
        setLoadError(
          error.message || 'Could not sync dashboard statistics with the server.'
        )
      }
    } finally {
      if (!cancelled) setLoading(false)
    }
  }

  loadDashboard()

  return () => {
    cancelled = true
  }
}, [])

const totalInterviews = sessions.length
const averageScore = totalInterviews
  ? Math.round(
      sessions.reduce((sum, session) => sum + session.score, 0)
      / totalInterviews
    )
  : 0
const bestScore = totalInterviews
  ? Math.max(...sessions.map((session) => session.score))
  : 0
const roleNames = [...new Set(sessions.map((session) => session.role))]

const dashboardStats = [
  {
    icon: ClipboardList,
    label: 'Total interviews',
    value: String(totalInterviews),
    to: '/sessions',
  },
  {
    icon: Target,
    label: 'Average score',
    value: `${averageScore}%`,
  },
  {
    icon: Award,
    label: 'Best score',
    value: `${bestScore}%`,
  },
  {
    icon: Layers,
    label: 'Roles practiced',
    value: String(roleNames.length),
    to: '/sessions?view=roles',
  },
]

const roleSummaries = roleNames.map((role) => {
  const roleSessions = sessions
    .filter((session) => session.role === role)
    .sort(
      (a, b) =>
        new Date(b.completedAt || b.startedAt)
        - new Date(a.completedAt || a.startedAt)
    )

  const roleAverage = Math.round(
    roleSessions.reduce((sum, session) => sum + session.score, 0)
    / roleSessions.length
  )
  const lastScore = roleSessions[0]?.score ?? 0
  const isNew = roleSessions.length === 1
  const improving = lastScore >= roleAverage

  return {
    icon: ROLE_ICONS[role] || Code,
    name: role,
    badge: isNew ? 'b-new' : improving ? 'b-imp' : 'b-dec',
    badgeIcon: isNew ? Sparkles : improving ? TrendingUp : TrendingDown,
    badgeLabel: isNew ? 'New' : improving ? 'Improving' : 'Needs focus',
    interviews: roleSessions.length,
    average: `${roleAverage}%`,
    last: `${lastScore}%`,
  }
})

  return (
    <section className="screen" id="dash">
      <TopBar nav={APP_NAV} showUser />
      <div className="wrap pagepad">
        <Reveal className="welcome">
          <h1>Welcome back{user?.name ? `, ${user.name}` : ''}</h1>
          <p>Ready to improve your interview skills today?</p>
        </Reveal>

        {loading && (
  <p className="sub muted">Loading dashboard statistics…</p>
)}

{loadError && (
  <p className="field-error">{loadError}</p>
)}

        <Reveal className="dash-stats" delay={60}>
          {dashboardStats.map((s) => (
            <button
              type="button"
              className={`card dash-stat${s.to ? ' clickable' : ''}`}
              key={s.label}
              onClick={() => s.to && navigate(s.to)}
              disabled={!s.to}
              aria-label={s.to ? `View ${s.label.toLowerCase()}` : undefined}
            >
              <div className="di"><s.icon size={18} strokeWidth={1.8} /></div>
              <div>
                <div className="dv">{s.value}</div>
                <div className="dl">{s.label}</div>
              </div>
            </button>
          ))}
        </Reveal>

        <Reveal delay={100}>
          <div className="dash-start-group">
            <button className="dash-startbtn" onClick={() => navigate('/role')}>
              <Play size={16} strokeWidth={2} fill="currentColor" />
              Start new interview
            </button>
            <span>Written answers only · No live coding or diagrams</span>
          </div>
        </Reveal>

        <div className="sec-title">Your practiced job roles</div>
        <div className="rolegrid">
          {roleSummaries.map((r, i) => (
            <Reveal as="div" className="card rolecard" key={r.name} delay={i * 60}>
              <div className="rc-top">
                <div className="rc-icon"><r.icon size={19} strokeWidth={1.8} /></div>
                <span className="rc-name">{r.name}</span>
                <span className={`rc-badge ${r.badge}`}>
                  <r.badgeIcon size={12} strokeWidth={2} />
                  {r.badgeLabel}
                </span>
              </div>
              <div className="rc-stats">
                <div className="rc-stat"><div className="l">Interviews</div><div className="v">{r.interviews}</div></div>
                <div className="rc-stat"><div className="l">Average</div><div className="v">{r.average}</div></div>
                <div className="rc-stat last"><div className="l">Last</div><div className="v">{r.last}</div></div>
              </div>
              <div className="rc-actions">
                <button className="btn prime" onClick={() => navigate('/setup', { state: { role: r.name } })}>Practice</button>
                <button className="btn ghost" onClick={() => navigate('/progress')}>Details</button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
