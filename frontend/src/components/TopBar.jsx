import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from './Logo.jsx'
import useScrolled from '../hooks/useScrolled.js'

export default function TopBar({
  bname = 'AceInterview',
  subtitle,
  nav,
  avatarText,
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

        {avatarText && <div className="who" style={avatarStyle}>{avatarText}</div>}
      </div>
    </div>
  )
}
