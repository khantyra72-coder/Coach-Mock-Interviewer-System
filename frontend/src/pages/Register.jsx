import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'

export default function Register() {
  const navigate = useNavigate()

  return (
    <section className="screen" id="register">
      <TopBar logoTo="/" rightButton={{ label: '← Home', to: '/' }} />
      <div className="wrap">
        <div className="auth">
          <div className="card authcard">
            <span className="eyebrow">Get started</span>
            <h1 style={{ marginTop: 8 }}>Create your account</h1>
            <p className="sub muted" style={{ marginTop: 6 }}>Start practicing tech interviews in minutes.</p>
            <label className="flab">Full name</label>
            <input className="inp" type="text" placeholder="John Doe" />
            <label className="flab">Email</label>
            <input className="inp" type="email" placeholder="you@example.com" />
            <label className="flab">Password</label>
            <input className="inp" type="password" placeholder="Create a password" />
            <button className="btn block" style={{ marginTop: 22 }} onClick={() => navigate('/login')}>
              Create account
            </button>
            <p className="authlink">
              Already have an account? <a onClick={() => navigate('/login')}>Log in</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
