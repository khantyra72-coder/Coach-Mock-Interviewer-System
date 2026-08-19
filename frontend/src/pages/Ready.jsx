import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'

const APP_NAV = [
  { label: 'My Sessions', to: '/sessions' },
  { label: 'Settings' },
  { label: 'Logout', to: '/' },
]

export default function Ready() {
  const navigate = useNavigate()

  return (
    <section className="screen" id="ready">
      <TopBar nav={APP_NAV} avatarText="JD" />
      <div className="wrap pagepad" style={{ maxWidth: 720 }}>
        <div className="ready-hd">
          <h1>You're ready, John! 💪</h1>
          <p>Take a deep breath. This is a safe space to practice.</p>
        </div>

        <div className="card" style={{ padding: '6px 24px', marginBottom: 18 }}>
          <div className="rdrow"><span className="k">You are interviewing for</span><span className="v">Software Engineer</span></div>
          <div className="rdrow"><span className="k">Company</span><span className="v">Google</span></div>
          <div className="rdrow"><span className="k">Interviewer</span><span className="v">Sarah, Engineering Manager</span></div>
          <div className="rdrow"><span className="k">Session</span><span className="v">5 questions · ~45 minutes</span></div>
        </div>

        <div className="rdtips">
          <h3>A few gentle tips</h3>
          <ul>
            <li>✅ Read each question carefully</li>
            <li>✅ Answer in full sentences</li>
            <li>✅ Use examples when possible</li>
            <li>✅ Don't worry about being perfect — focus on learning</li>
          </ul>
        </div>

        <button className="startbtn" style={{ marginTop: 22 }} onClick={() => navigate('/session')}>
          Begin interview
        </button>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <span className="cancel" onClick={() => navigate('/setup')}>Cancel and go back</span>
        </div>
      </div>
    </section>
  )
}
