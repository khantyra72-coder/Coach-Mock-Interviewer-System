import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'

export default function Login() {
  const navigate = useNavigate()

  return (
    <section className="screen" id="login">
      <TopBar logoTo="/" rightButton={{ label: '← Home', to: '/' }} />
      <div className="wrap">
        <div className="auth">
          <div className="card authcard">
            <span className="eyebrow">Welcome back</span>
            <h1 style={{ marginTop: 8 }}>Log in to AceInterview</h1>
            <p className="sub muted" style={{ marginTop: 6 }}>Pick up your practice where you left off.</p>
            <label className="flab">Email</label>
            <input className="inp" type="email" placeholder="you@example.com" />
            <label className="flab">Password</label>
            <input className="inp" type="password" placeholder="••••••••" />
            <button className="btn block" style={{ marginTop: 22 }} onClick={() => navigate('/dashboard')}>
              Log in
            </button>
            <p className="authlink">
              New here? <a onClick={() => navigate('/register')}>Create an account</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
