import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { Code2, Handshake, Network, Clock } from 'lucide-react'
import { FaAmazon, FaMicrosoft, FaApple, FaMeta } from 'react-icons/fa6'
import { SiNetflix } from 'react-icons/si'

// A plain `import googleLogo from '../assets/logos/google.svg'` would fail
// the whole build if that file didn't exist — static imports are resolved
// at compile time, so there's no way to catch a missing one. import.meta.glob
// only includes files that actually exist on disk: if google.svg is missing,
// this just resolves to an empty object instead of erroring, and googleLogo
// below stays undefined so Google falls back to the letter badge.
const googleLogoFiles = import.meta.glob('../assets/logos/google.svg', { eager: true, import: 'default' })
const googleLogo = googleLogoFiles['../assets/logos/google.svg']

const APP_NAV = [
  { label: 'My Sessions', to: '/sessions' },
  { label: 'Settings' },
]

const TYPES = [
  { key: 'Technical', icon: Code2, desc: 'Coding & CS' },
  { key: 'Behavioral', icon: Handshake, desc: 'STAR method' },
  { key: 'System Design', icon: Network, desc: 'Architecture' },
]

// logo: a string means a local SVG (rendered as <img>, real colors as-is); a
// function means a react-icons component (rendered as <Logo/>, tinted via
// currentColor); missing/undefined falls back to the plain letter badge.
// Google has no working brand icon in any installed react-icons pack, so it
// uses its own SVG (googleLogo, above) if the file exists, on a white badge
// so the multicolor mark doesn't clash with Google's brand-blue square — and
// falls back to the letter badge automatically if the file is missing.
const COMPANIES = [
  { key: 'Google', letter: 'G', color: '#4285F4', bg: googleLogo ? '#fff' : undefined, count: 14, logo: googleLogo },
  { key: 'Amazon', letter: 'a', color: '#FF9900', count: 12, logo: FaAmazon },
  { key: 'Microsoft', letter: 'M', color: '#00A4EF', count: 11, logo: FaMicrosoft },
  { key: 'Meta', letter: 'f', color: '#0866FF', count: 10, logo: FaMeta },
  { key: 'Apple', letter: '▲', color: '#111', count: 9, logo: FaApple },
  { key: 'Netflix', letter: 'N', color: '#E50914', count: 8, logo: SiNetflix },
]

const LEVELS = ['Intern', 'Entry (0–2 yrs)', 'Mid (3–5 yrs)', 'Senior']
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const QUESTION_COUNTS = ['5', '10', '15']

const ROLE_TOPICS = {
  'Software Engineer':       ['Data Structures', 'Algorithms', 'OOP', 'System Design', 'Databases', 'Problem Solving'],
  'Frontend Developer':      ['HTML & CSS', 'JavaScript', 'React', 'Web Performance', 'Accessibility', 'UI/UX'],
  'Backend Developer':       ['APIs', 'Databases', 'Authentication', 'System Design', 'Caching', 'Microservices'],
  'Full-Stack Developer':    ['JavaScript', 'React', 'APIs', 'Databases', 'System Design', 'Deployment'],
  'Data Scientist':          ['Statistics', 'Python', 'SQL', 'Machine Learning', 'Data Wrangling', 'Visualization'],
  'ML / AI Engineer':        ['Machine Learning', 'Deep Learning', 'Python', 'Model Deployment', 'Data Pipelines', 'NLP'],
  'Cloud / DevOps Engineer': ['CI/CD', 'Docker', 'Kubernetes', 'Cloud (AWS)', 'Infrastructure as Code', 'Monitoring'],
  'Mobile Developer':        ['Android', 'iOS', 'Mobile UI', 'State Management', 'APIs', 'Performance'],
  'Cybersecurity Analyst':   ['Network Security', 'Cryptography', 'Threat Analysis', 'Access Control', 'Incident Response', 'Secure Coding'],
  'QA / Test Engineer':      ['Test Automation', 'Manual Testing', 'Test Design', 'Selenium', 'Bug Tracking', 'CI Testing'],
}

export default function Setup() {
  const navigate = useNavigate()
  const location = useLocation()
  const role = location.state?.role
  const availableTopics = ROLE_TOPICS[role] || ROLE_TOPICS['Software Engineer']
  const [type, setType] = useState('Technical')
  const [company, setCompany] = useState('Google')
  const [level, setLevel] = useState('Entry (0–2 yrs)')
  const [difficulty, setDifficulty] = useState('Medium')
  const [questionCount, setQuestionCount] = useState('5')
  const [topics, setTopics] = useState(availableTopics)
  const [timed, setTimed] = useState(false)

  const toggleTopic = (topic) => {
    setTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    )
  }

  const handleContinue = () => {
    navigate('/ready', { state: { role, type, company, level, difficulty, questionCount, topics, timed } })
  }

  return (
    <section className="screen" id="setup">
      <TopBar nav={APP_NAV} showUser />
      <div className="wrap pagepad">
        <span className="eyebrow">Interview setup</span>
        <h1 className="h-title" style={{ marginTop: 8 }}>Set up your interview</h1>
        <p className="sub">Pick the company and format you're targeting.</p>
        {role && <span className="pill g" style={{ marginTop: 12 }}>Practicing for: {role}</span>}

        <div style={{ marginTop: 8, maxWidth: 720 }}>
          <div className="field">
            <label>Interview type</label>
            <div className="g3">
              {TYPES.map((t) => (
                <div
                  key={t.key}
                  className={`opt${type === t.key ? ' sel' : ''}`}
                  onClick={() => setType(t.key)}
                >
                  <div className="oi"><t.icon size={18} strokeWidth={1.8} /></div>
                  <div><h4>{t.key}</h4><p>{t.desc}</p></div>
                  <div className="tk">✓</div>
                </div>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Target company <span className="muted" style={{ fontWeight: 400 }}>— questions in that company's style</span></label>
            <div className="g3">
              {COMPANIES.map((c) => (
                <div
                  key={c.key}
                  className={`co${company === c.key ? ' sel' : ''}`}
                  onClick={() => setCompany(c.key)}
                >
                  <div
                    className="cl"
                    style={{ background: c.bg || c.color, border: c.bg ? '1px solid var(--line)' : 'none' }}
                  >
                    {typeof c.logo === 'string' ? (
                      <img src={c.logo} alt={`${c.key} logo`} className="cl-img" />
                    ) : c.logo ? (
                      <c.logo size={17} />
                    ) : (
                      c.letter
                    )}
                  </div>
                  <h4>{c.key}</h4>
                  <p>{c.count} questions</p>
                </div>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Experience level</label>
            <div className="chips">
              {LEVELS.map((l) => (
                <div
                  key={l}
                  className={`chip${level === l ? ' sel' : ''}`}
                  onClick={() => setLevel(l)}
                >
                  {l}
                </div>
              ))}
            </div>
          </div>

          <div className="g2">
            <div className="field">
              <label>Difficulty</label>
              <div className="chips">
                {DIFFICULTIES.map((d) => (
                  <div
                    key={d}
                    className={`chip${difficulty === d ? ' sel' : ''}`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Questions</label>
              <div className="chips">
                {QUESTION_COUNTS.map((q) => (
                  <div
                    key={q}
                    className={`chip${questionCount === q ? ' sel' : ''}`}
                    onClick={() => setQuestionCount(q)}
                  >
                    {q}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="field">
            <label>Topics to focus on</label>
            <div className="chips">
              {availableTopics.map((t) => (
                <div
                  key={t}
                  className={`chip${topics.includes(t) ? ' sel' : ''}`}
                  onClick={() => toggleTopic(t)}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Timer</label>
            <div className="opt" style={{ cursor: 'default' }}>
              <div className="oi"><Clock size={18} strokeWidth={1.8} /></div>
              <div><h4>Timed session</h4><p>45 minutes total · shows a countdown during the interview</p></div>
              <div
                className={`switch${timed ? ' on' : ''}`}
                style={{ marginLeft: 'auto', alignSelf: 'center' }}
                onClick={() => setTimed((t) => !t)}
              ></div>
            </div>
          </div>

          <button className="btn" style={{ marginTop: 8 }} onClick={handleContinue}>
            Continue to review →
          </button>
        </div>
      </div>
    </section>
  )
}
