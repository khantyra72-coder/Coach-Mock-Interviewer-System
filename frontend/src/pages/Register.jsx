import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { apiPost, ApiError } from '../api/client.js'
import { Eye, EyeOff, CheckCircle2, Circle, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Keep this exact character set in sync with the backend's password regex
// (RegisterRequest.java) so a password accepted here is always accepted there.
const SPECIAL_CHAR_RE = /[!@#$%^&*()?_-]/

const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { key: 'lower', label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { key: 'number', label: 'One number', test: (pw) => /[0-9]/.test(pw) },
  { key: 'special', label: 'One special character', test: (pw) => SPECIAL_CHAR_RE.test(pw) },
]

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState('')

  const ruleResults = PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(password) }))
  const allRulesMet = ruleResults.every((rule) => rule.met)
  const emailValid = EMAIL_RE.test(email.trim())
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const showMismatch = confirmPassword.length > 0 && password !== confirmPassword
  const formValid = name.trim().length > 0 && emailValid && allRulesMet && passwordsMatch

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formValid || submitting) return
    setFormError('')
    setSubmitting(true)
    try {
      await apiPost('/register', { name: name.trim(), email: email.trim(), password })
      setSubmitting(false)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3500)
    } catch (err) {
      setSubmitting(false)
      // ApiError carries the backend's message directly — for a 409 this is
      // "An account with this email already exists."; for network failures
      // or anything else it's still a clear, safe fallback message.
      setFormError(
        err instanceof ApiError ? err.message : 'Something went wrong creating your account. Please try again.'
      )
    }
  }

  return (
    <section className="screen" id="register">
      <TopBar logoTo="/" rightButton={{ label: '← Home', to: '/' }} />
      <div className="wrap">
        <div className="auth">
          <div className="card authcard">
            {success ? (
              <>
                <div className="toast">
                  <CheckCircle size={20} className="toast-icon" />
                  Account created successfully!
                </div>
                <p className="sub muted" style={{ textAlign: 'center' }}>
                  You can now log in. Taking you to the login page…
                </p>
              </>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <span className="eyebrow">Get started</span>
                <h1 style={{ marginTop: 8 }}>Create your account</h1>
                <p className="sub muted" style={{ marginTop: 6 }}>Start practicing tech interviews in minutes.</p>

                <label className="flab">Full name</label>
                <input
                  className="inp"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

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
                    placeholder="Create a password"
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

                {password.length > 0 && (
                  <div className="pw-rules">
                    {ruleResults.map((rule) => (
                      <div key={rule.key} className={`pw-rule${rule.met ? ' met' : ''}`}>
                        {rule.met ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                        {rule.label}
                      </div>
                    ))}
                  </div>
                )}

                <label className="flab">Confirm password</label>
                <div className="pw-toggle-wrap">
                  <input
                    className="inp"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="pw-eye"
                    onClick={() => setShowConfirm((s) => !s)}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {showMismatch && (
                  <p className="field-error"><AlertCircle size={14} />Passwords do not match.</p>
                )}

                {formError && (
                  <p className="field-error"><AlertCircle size={14} />{formError}</p>
                )}

                <button
                  className="btn block"
                  style={{ marginTop: 22 }}
                  type="submit"
                  disabled={!formValid || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      Creating your account…
                    </>
                  ) : (
                    'Create account'
                  )}
                </button>
                <p className="authlink">
                  Already have an account? <a onClick={() => navigate('/login')}>Log in</a>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
