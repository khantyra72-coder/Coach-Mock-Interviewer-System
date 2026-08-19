import { Link, useNavigate } from 'react-router-dom'

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

  return (
    <div className="top">
      <div className="wrap">
        <div className="logo" onClick={() => navigate(logoTo)}>A</div>
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
          <nav className="tnav">
            {nav.map((item, i) =>
              item.to ? (
                <Link key={i} to={item.to}>{item.label}</Link>
              ) : (
                <a key={i}>{item.label}</a>
              )
            )}
          </nav>
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
