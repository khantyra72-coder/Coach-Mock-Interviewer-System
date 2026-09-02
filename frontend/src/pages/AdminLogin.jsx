import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import TopBar from '../components/TopBar.jsx'
import { apiPost, ApiError, setSession } from '../api/client.js'

export default function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)

    try {
      const { token, ...user } = await apiPost('/admin-login', { email: email.trim(), password })
      setSession(token, user)
      navigate('/admin', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid admin email or password. Please try again.')
      } else if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
      setSubmitting(false)
    }
  }

  return (
    <section className="screen" id="admin-login">
      <TopBar bname="AceInterview Admin" logoTo="/" rightButton={{ label: 'User login', to: '/login' }} />
      <div className="wrap">
        <div className="auth">
          <div className="card authcard admin-login-card">
            <div className="admin-login-icon" aria-hidden="true"><ShieldCheck size={24} /></div>
            <span className="eyebrow">Restricted access</span>
            <h1 style={{ marginTop: 8 }}>Admin sign in</h1>
            <p className="sub muted" style={{ marginTop: 6 }}>Sign in with your administrator account.</p>

            {location.state?.loggedOut && (
              <div className="notice"><CheckCircle2 size={15} strokeWidth={2} />You've been logged out.</div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <label className="flab" htmlFor="admin-email">Admin email</label>
              <input id="admin-email" className="inp" type="email" autoComplete="username" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />

              <label className="flab" htmlFor="admin-password">Password</label>
              <div className="pw-toggle-wrap">
                <input id="admin-password" className="inp" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="pw-eye" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {error && <p className="field-error" role="alert"><AlertCircle size={14} />{error}</p>}

              <button className="btn block" style={{ marginTop: 22 }} type="submit" disabled={submitting}>
                {submitting ? <><Loader2 size={16} className="spin" />Signing in…</> : 'Sign in as admin'}
              </button>
              <p className="authlink">Not an administrator? <a onClick={() => navigate('/login')}>User login</a></p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
