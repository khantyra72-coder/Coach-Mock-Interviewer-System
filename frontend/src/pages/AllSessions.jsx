import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'

const APP_NAV = [
  { label: 'My Sessions', to: '/sessions' },
  { label: 'Settings' },
]

const SESSIONS = [
  { date: 'Aug 12, 2026', score: '82%' },
  { date: 'Aug 08, 2026', score: '78%' },
  { date: 'Aug 05, 2026', score: '70%' },
  { date: 'Aug 01, 2026', score: '62%' },
  { date: 'Jul 28, 2026', score: '55%', warn: true },
]

export default function AllSessions() {
  const navigate = useNavigate()

  return (
    <section className="screen" id="allsessions">
      <TopBar nav={APP_NAV} showUser />
      <div className="wrap pagepad">
        <h1 className="h-title" style={{ marginBottom: 20 }}>All sessions</h1>
        {SESSIONS.map((s) => (
          <div className="card assrow" key={s.date}>
            <span className="date">{s.date}</span>
            <span className={`sc${s.warn ? ' warn' : ''}`}>{s.score}</span>
            <button className="btn ghost sm" onClick={() => navigate('/results')}>View results</button>
          </div>
        ))}
      </div>
    </section>
  )
}
