import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, User, LogOut } from 'lucide-react'
import Logo from './Logo.jsx'
import useScrolled from '../hooks/useScrolled.js'
import { getStoredUser, clearSession } from '../api/client.js'

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function LogoutConfirmDialog({ onCancel, onConfirm }) {
  const cancelRef = useRef(null)

  useEffect(() => {
    cancelRef.current?.focus()
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        aria-describedby="logout-confirm-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="logout-confirm-title">Log out?</h3>
        <p id="logout-confirm-desc">Are you sure you want to log out?</p>
        <div className="modal-actions">
          <button type="button" className="btn ghost" ref={cancelRef} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn" onClick={onConfirm}>
            Log out
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function UserMenu({ avatarStyle }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [user] = useState(getStoredUser)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleLogoutConfirmed = () => {
    clearSession()
    setConfirmOpen(false)
    navigate('/login', { state: { loggedOut: true } })
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className={`who${open ? ' open' : ''}`}
        style={avatarStyle}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Account menu"
      >
        {user?.name ? initials(user.name) : <User size={16} strokeWidth={1.8} />}
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-info">
            <div className="user-dropdown-name">{user?.name || 'Guest'}</div>
            {user?.email && <div className="user-dropdown-email">{user.email}</div>}
          </div>
          <button
            type="button"
            className="user-dropdown-item"
            onClick={() => {
              setOpen(false)
              setConfirmOpen(true)
            }}
          >
            <LogOut size={15} strokeWidth={1.8} />
            Logout
          </button>
        </div>
      )}

      {confirmOpen && (
        <LogoutConfirmDialog onCancel={() => setConfirmOpen(false)} onConfirm={handleLogoutConfirmed} />
      )}
    </div>
  )
}

export default function TopBar({
  bname = 'AceInterview',
  subtitle,
  nav,
  showUser,
  avatarStyle,
  rightButton,
  logoTo = '/dashboard',
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const scrolled = useScrolled(40)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className={`top${scrolled ? ' scrolled' : ''}`}>
      <div className="wrap">
        <Logo onClick={() => navigate(logoTo)} />
        <div className="bname" style={subtitle ? { fontSize: 15 } : undefined}>
          {bname}
          {subtitle && (
            <>
              <br />
              <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>{subtitle}</span>
            </>
          )}
        </div>

        {nav && (
          <>
            <nav className={`tnav${mobileOpen ? ' mobile-open' : ''}`}>
              {nav.map((item, i) =>
                item.to ? (
                  <Link
                    key={i}
                    to={item.to}
                    className={location.pathname === item.to ? 'active' : undefined}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a key={i}>{item.label}</a>
                )
              )}
            </nav>
            <button
              type="button"
              className="nav-toggle"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} strokeWidth={1.8} /> : <Menu size={20} strokeWidth={1.8} />}
            </button>
          </>
        )}

        {rightButton && (
          <button
            className="btn ghost sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => navigate(rightButton.to)}
          >
            {rightButton.label}
          </button>
        )}

        {showUser && <UserMenu avatarStyle={avatarStyle} />}
      </div>
    </div>
  )
}
