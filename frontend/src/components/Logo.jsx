import logoImg from '../assets/logo.jpg'

export default function Logo({ onClick, size = 34, className = '', style }) {
  return (
    <img
      src={logoImg}
      alt="AceInterview"
      onClick={onClick}
      className={`logo${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size, cursor: onClick ? 'pointer' : 'default', ...style }}
    />
  )
}
