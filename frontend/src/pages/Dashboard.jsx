import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'

const APP_NAV = [
  { label: 'My Sessions', to: '/sessions' },
  { label: 'Settings' },
  { label: 'Logout', to: '/' },
]

const ROLES = [
  { emoji: '💻', name: 'Software Engineer', badge: 'b-imp', badgeLabel: '📈 Improving', interviews: 5, average: '69%', last: '82%' },
  { emoji: '🎨', name: 'Frontend Developer', badge: 'b-new', badgeLabel: '✨ New', interviews: 1, average: '76%', last: '76%' },
  { emoji: '⚙️', name: 'Backend Developer', badge: 'b-stable', badgeLabel: '➡️ Stable', interviews: 3, average: '70%', last: '71%' },
  { emoji: '📊', name: 'Data Scientist', badge: 'b-dec', badgeLabel: '📉 Declining', interviews: 2, average: '58%', last: '50%' },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <section className="screen" id="dash">
      <TopBar nav={APP_NAV} avatarText="JD" />
      <div className="wrap pagepad">
        <div className="welcome">
          <h1>Welcome back, John! 👋</h1>
          <p>Ready to improve your interview skills today?</p>
        </div>
        <button className="startbtn" onClick={() => navigate('/role')}>Start new interview</button>

        <div className="sec-title">Your practiced job roles</div>
        <div className="rolegrid">
          {ROLES.map((r) => (
            <div className="card rolecard" key={r.name}>
              <div className="rc-top">
                <span className="rc-emoji">{r.emoji}</span>
                <span className="rc-name">{r.name}</span>
                <span className={`rc-badge ${r.badge}`}>{r.badgeLabel}</span>
              </div>
              <div className="rc-stats">
                <div className="rc-stat"><div className="l">Interviews</div><div className="v">{r.interviews}</div></div>
                <div className="rc-stat"><div className="l">Average</div><div className="v">{r.average}</div></div>
                <div className="rc-stat last"><div className="l">Last</div><div className="v">{r.last}</div></div>
              </div>
              <div className="rc-actions">
                <button className="btn prime" onClick={() => navigate('/setup')}>Practice</button>
                <button className="btn ghost" onClick={() => navigate('/progress')}>Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
