import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'

const APP_NAV = [
  { label: 'My Sessions', to: '/sessions' },
  { label: 'Settings' },
  { label: 'Logout', to: '/' },
]

const ROLES = [
  { icon: '💻', name: 'Software Engineer', count: 12 },
  { icon: '🎨', name: 'Frontend Developer', count: 10 },
  { icon: '⚙️', name: 'Backend Developer', count: 11 },
  { icon: '🧩', name: 'Full-Stack Developer', count: 14 },
  { icon: '📊', name: 'Data Scientist', count: 9 },
  { icon: '🤖', name: 'ML / AI Engineer', count: 13 },
  { icon: '☁️', name: 'Cloud / DevOps Engineer', count: 8 },
  { icon: '📱', name: 'Mobile Developer', count: 10 },
  { icon: '🔐', name: 'Cybersecurity Analyst', count: 8 },
  { icon: '🧪', name: 'QA / Test Engineer', count: 7 },
]

export default function SelectRole() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () => ROLES.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase())),
    [query]
  )

  return (
    <section className="screen" id="role">
      <TopBar nav={APP_NAV} avatarText="JD" />
      <div className="wrap pagepad">
        <h1 className="h-title">Select your role</h1>
        <p className="sub">Choose the tech role you want to practice for.</p>
        <div className="search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A968F" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            placeholder="Search tech roles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="roles">
          {filtered.map((r) => (
            <div className="card role" key={r.name} onClick={() => navigate('/setup')}>
              <div className="ri">{r.icon}</div>
              <div>
                <h4>{r.name}</h4>
                <div className="rq">{r.count} questions available</div>
              </div>
              <span className="arr">›</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
