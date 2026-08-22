import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'

const APP_NAV = [
  { label: 'My Sessions', to: '/sessions' },
  { label: 'Settings' },
]

const STATS = [
  { l: 'Interviews', v: '5' },
  { l: 'Average score', v: '69%' },
  { l: 'First score', v: '55%' },
  { l: 'Last score', v: '82%' },
  { l: 'Best score', v: '82%' },
  { l: 'Improvement', v: '+27%', color: 'var(--forest)' },
]

const SESSION_HISTORY = [
  { date: 'Aug 12, 2026', score: '82%', change: '+4% ↑', up: true },
  { date: 'Aug 08, 2026', score: '78%', change: '+8% ↑', up: true },
  { date: 'Aug 05, 2026', score: '70%', change: '+8% ↑', up: true },
  { date: 'Aug 01, 2026', score: '62%', change: '+7% ↑', up: true },
  { date: 'Jul 28, 2026', score: '55%', change: '— first session', first: true },
]

const SKILL_PROGRESS = [
  { skill: 'Structure', first: '40%', last: '75%', change: '+35% ↑', up: true },
  { skill: 'Content', first: '55%', last: '70%', change: '+15% ↑', up: true },
  { skill: 'Relevance', first: '60%', last: '65%', change: '+5% ↑', up: true },
  { skill: 'Language', first: '65%', last: '62%', change: '−3% ↓', up: false },
]

export default function Progress() {
  const navigate = useNavigate()

  return (
    <section className="screen" id="progress">
      <TopBar nav={APP_NAV} showUser />
      <div className="wrap pagepad">
        <button className="btn ghost sm" style={{ marginBottom: 16 }} onClick={() => navigate('/dashboard')}>
          ← Back to dashboard
        </button>
        <h1 className="pr-title">Software Engineer — Progress Report</h1>

        <div className="card pr-card">
          <span className="pr-badge">📈 Improving</span>
          <div className="pr-grid">
            {STATS.map((s) => (
              <div className="pr-stat" key={s.l}>
                <div className="l">{s.l}</div>
                <div className="v" style={s.color ? { color: s.color } : undefined}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card pr-sec">
          <h3>Score trend</h3>
          <svg viewBox="0 0 700 250" style={{ width: '100%', height: 'auto' }} role="img" aria-label="Score trend rising from 55% to 82% across five sessions">
            <g stroke="#EEF2F0" strokeWidth="1" strokeDasharray="4 5">
              <line x1="48" y1="20" x2="688" y2="20" /><line x1="48" y1="67.5" x2="688" y2="67.5" />
              <line x1="48" y1="115" x2="688" y2="115" /><line x1="48" y1="162.5" x2="688" y2="162.5" /><line x1="48" y1="210" x2="688" y2="210" />
            </g>
            <g fontFamily="Inter, sans-serif" fontSize="11" fill="#8A968F" textAnchor="end">
              <text x="38" y="24">100</text><text x="38" y="71.5">75</text><text x="38" y="119">50</text><text x="38" y="166.5">25</text><text x="38" y="214">0</text>
            </g>
            <path d="M48 105.5 L206 92.2 L364 77 L522 61.8 L680 54.2 L680 210 L48 210 Z" fill="#ECF6F1" />
            <polyline points="48,105.5 206,92.2 364,77 522,61.8 680,54.2" fill="none" stroke="#0A6E45" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <g fill="#0A6E45"><circle cx="48" cy="105.5" r="5" /><circle cx="206" cy="92.2" r="5" /><circle cx="364" cy="77" r="5" /><circle cx="522" cy="61.8" r="5" /><circle cx="680" cy="54.2" r="5" /></g>
            <g fontFamily="Inter, sans-serif" fontSize="11" fill="#8A968F" textAnchor="middle">
              <text x="48" y="232">S1</text><text x="206" y="232">S2</text><text x="364" y="232">S3</text><text x="522" y="232">S4</text><text x="680" y="232">S5</text>
            </g>
          </svg>
        </div>

        <div className="card pr-sec">
          <h3>Session history</h3>
          <table className="ptbl">
            <thead><tr><th>Date</th><th>Score</th><th>Change</th></tr></thead>
            <tbody>
              {SESSION_HISTORY.map((s) => (
                <tr key={s.date}>
                  <td>{s.date}</td>
                  <td className="score">{s.score}</td>
                  <td className={s.first ? 'firsttag' : s.up ? 'up' : 'down'}>{s.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card pr-sec">
          <h3>Skill progress</h3>
          <table className="ptbl">
            <thead><tr><th>Skill</th><th>First</th><th>Last</th><th>Change</th></tr></thead>
            <tbody>
              {SKILL_PROGRESS.map((s) => (
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
