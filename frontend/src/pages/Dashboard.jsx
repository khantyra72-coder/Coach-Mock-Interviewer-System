import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Reveal from '../components/Reveal.jsx'
import { getStoredUser } from '../api/client.js'
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
  { label: 'My Sessions', to: '/sessions' },
  { label: 'Settings' },
]

const DASH_STATS = [
  { icon: ClipboardList, label: 'Total interviews', value: '11' },
  { icon: Target, label: 'Average score', value: '68%' },
  { icon: Award, label: 'Best score', value: '82%' },
  { icon: Layers, label: 'Roles practiced', value: '4' },
]

const ROLES = [
  { icon: Code, name: 'Software Engineer', badge: 'b-imp', badgeIcon: TrendingUp, badgeLabel: 'Improving', interviews: 5, average: '69%', last: '82%' },
  { icon: Layout, name: 'Frontend Developer', badge: 'b-new', badgeIcon: Sparkles, badgeLabel: 'New', interviews: 1, average: '76%', last: '76%' },
  { icon: Server, name: 'Backend Developer', badge: 'b-stable', badgeIcon: Minus, badgeLabel: 'Stable', interviews: 3, average: '70%', last: '71%' },
  { icon: BarChart3, name: 'Data Scientist', badge: 'b-dec', badgeIcon: TrendingDown, badgeLabel: 'Declining', interviews: 2, average: '58%', last: '50%' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [user] = useState(getStoredUser)

  return (
    <section className="screen" id="dash">
      <TopBar nav={APP_NAV} showUser />
      <div className="wrap pagepad">
        <Reveal className="welcome">
          <h1>Welcome back{user?.name ? `, ${user.name}` : ''}</h1>
          <p>Ready to improve your interview skills today?</p>
        </Reveal>

        <Reveal className="dash-stats" delay={60}>
          {DASH_STATS.map((s) => (
            <div className="card dash-stat" key={s.label}>
              <div className="di"><s.icon size={18} strokeWidth={1.8} /></div>
              <div>
                <div className="dv">{s.value}</div>
                <div className="dl">{s.label}</div>
              </div>
            </div>
          ))}
        </Reveal>

        <Reveal delay={100}>
          <button className="dash-startbtn" onClick={() => navigate('/role')}>
            <Play size={16} strokeWidth={2} fill="currentColor" />
            Start new interview
          </button>
        </Reveal>

        <div className="sec-title">Your practiced job roles</div>
        <div className="rolegrid">
          {ROLES.map((r, i) => (
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
                <button className="btn prime" onClick={() => navigate('/setup')}>Practice</button>
                <button className="btn ghost" onClick={() => navigate('/progress')}>Details</button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
