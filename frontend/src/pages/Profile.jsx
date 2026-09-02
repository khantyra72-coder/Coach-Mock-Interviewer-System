import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Reveal from '../components/Reveal.jsx'
import { ApiError, getToken, setSession } from '../api/client.js'
import { getMe, updateProfile, changePassword } from '../api/profile.js'
import { UserCog, KeyRound, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Circle } from 'lucide-react'

const APP_NAV = [
  { label: 'Interview Setup', to: '/setup' },
  { label: 'My Sessions', to: '/sessions' },
  { label: 'Progress Report', to: '/progress' },
  { label: 'Settings', to: '/profile' },
]

// Keep this exact character set in sync with the backend's password regex
// (ChangePasswordRequest.java / RegisterRequest.java).
const SPECIAL_CHAR_RE = /[!@#$%^&*()?_-]/

const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { key: 'lower', label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { key: 'number', label: 'One number', test: (pw) => /[0-9]/.test(pw) },
  { key: 'special', label: 'One special character', test: (pw) => SPECIAL_CHAR_RE.test(pw) },
]

function AccountDetailsCard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false
    getMe()
      .then((user) => {
        if (cancelled) return
        setName(user.name)
        setEmail(user.email)
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err instanceof ApiError ? err.message : 'Could not load your account details.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setError('')
    setSuccess(false)
    setSubmitting(true)
    try {
      const updated = await updateProfile({ name: name.trim(), email: email.trim() })
      // Keep the stored session's user in sync with what was just saved, so
      // TopBar shows the new name/initials as soon as it remounts.
      setSession(getToken(), updated)
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 900)
    } catch (err) {
      setSubmitting(false)
      setError(err instanceof ApiError ? err.message : 'Could not save your changes. Please try again.')
    }
  }

  return (
    <Reveal className="card profile-card">
      <div className="profile-card-hd">
        <span className="profile-card-icon">
          <UserCog size={18} strokeWidth={1.8} />
        </span>
        <div>
          <h2>Account details</h2>
          <p className="muted">Update your name and email address.</p>
        </div>
      </div>

      {loading ? (
        <div className="profile-loading">
          <Loader2 size={16} className="spin" />
          Loading your details…
        </div>
      ) : loadError ? (
        <p className="field-error">
          <AlertCircle size={14} />
          {loadError}
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <label className="flab">Full name</label>
          <input className="inp" type="text" value={name} onChange={(e) => setName(e.target.value)} />

          <label className="flab">Email</label>
          <input className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

          {error && (
            <p className="field-error">
              <AlertCircle size={14} />
              {error}
            </p>
          )}
          {success && (
            <div className="notice">
              <CheckCircle2 size={15} strokeWidth={2} />
              Saved. Taking you back…
            </div>
          )}

          <button
            className="btn"
            style={{ marginTop: 20 }}
            type="submit"
            disabled={submitting || !name.trim() || !email.trim()}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="spin" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </form>
      )}
    </Reveal>
  )
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const ruleResults = PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(newPassword) }))
  const allRulesMet = ruleResults.every((rule) => rule.met)
  const showMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword
  const formValid = currentPassword.length > 0 && allRulesMet && confirmPassword.length > 0 && !showMismatch

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formValid || submitting) return
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      await changePassword({ currentPassword, newPassword })
      setSuccess('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update your password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Reveal className="card profile-card" delay={60}>
      <div className="profile-card-hd">
        <span className="profile-card-icon">
          <KeyRound size={18} strokeWidth={1.8} />
        </span>
        <div>
          <h2>Change password</h2>
          <p className="muted">Choose a new password for your account.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <label className="flab">Current password</label>
        <div className="pw-toggle-wrap">
          <input
            className="inp"
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <button
            type="button"
            className="pw-eye"
            onClick={() => setShowCurrent((s) => !s)}
            aria-label={showCurrent ? 'Hide password' : 'Show password'}
          >
            {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        <label className="flab">New password</label>
        <div className="pw-toggle-wrap">
          <input
            className="inp"
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            type="button"
            className="pw-eye"
            onClick={() => setShowNew((s) => !s)}
            aria-label={showNew ? 'Hide password' : 'Show password'}
          >
            {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        {newPassword.length > 0 && (
          <div className="pw-rules">
            {ruleResults.map((rule) => (
              <div key={rule.key} className={`pw-rule${rule.met ? ' met' : ''}`}>
                {rule.met ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                {rule.label}
              </div>
            ))}
          </div>
        )}

        <label className="flab">Confirm new password</label>
        <div className="pw-toggle-wrap">
          <input
            className="inp"
            type={showConfirm ? 'text' : 'password'}
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
          <p className="field-error">
            <AlertCircle size={14} />
            Passwords do not match.
          </p>
        )}

        {error && (
          <p className="field-error">
            <AlertCircle size={14} />
            {error}
          </p>
        )}
        {success && (
          <div className="notice">
            <CheckCircle2 size={15} strokeWidth={2} />
            {success}
          </div>
        )}

        <button className="btn" style={{ marginTop: 20 }} type="submit" disabled={!formValid || submitting}>
          {submitting ? (
            <>
              <Loader2 size={16} className="spin" />
              Updating…
            </>
          ) : (
            'Update password'
          )}
        </button>
      </form>
    </Reveal>
  )
}

export default function Profile() {
  return (
    <section className="screen" id="profile">
      <TopBar nav={APP_NAV} showUser />
      <div className="wrap pagepad" style={{ maxWidth: 640 }}>
        <div className="profile-hd">
          <span className="eyebrow">Your account</span>
          <h1>Account settings</h1>
          <p className="muted">Manage your profile details and password.</p>
        </div>

        <AccountDetailsCard />
        <ChangePasswordCard />
      </div>
    </section>
  )
}
