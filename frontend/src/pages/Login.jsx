import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { apiPost, ApiError, setSession } from '../api/client.js'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const showLoggedOutNotice = Boolean(location.state?.loggedOut)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      const { token, ...user } = await apiPost('/login', { email: email.trim(), password })
      setSession(token, user)
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid email or password. Please try again.')
      } else if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
      setSubmitting(false)
    }
  }

  return (
    <section className="screen" id="login">
      <TopBar logoTo="/" rightButton={{ label: '← Home', to: '/' }} />
      <div className="wrap">
        <div className="auth">
          <div className="card authcard">
            <span className="eyebrow">Welcome back</span>
            <h1 style={{ marginTop: 8 }}>Log in to AceInterview</h1>
            <p className="sub muted" style={{ marginTop: 6 }}>Pick up your practice where you left off.</p>

            {showLoggedOutNotice && (
              <div className="notice"><CheckCircle2 size={15} strokeWidth={2} />You've been logged out.</div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <label className="flab">Email</label>
              <input
                className="inp"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label className="flab">Password</label>
              <div className="pw-toggle-wrap">
                <input
                  className="inp"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="pw-eye"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <a className="forgot-link">Forgot password?</a>

              {error && (
                <p className="field-error"><AlertCircle size={14} />{error}</p>
              )}

              <button className="btn block" style={{ marginTop: 22 }} type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Signing in…
                  </>
                ) : (
                  'Log in'
                )}
              </button>
              <p className="authlink">
                New here? <a onClick={() => navigate('/register')}>Create an account</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
