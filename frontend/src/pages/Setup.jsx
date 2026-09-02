import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { Check, ChevronDown, ChevronRight, Clock, Code2, Handshake, Network, Search } from 'lucide-react'
import { FaAirbnb, FaAmazon, FaApple, FaMeta, FaSpotify, FaUber } from 'react-icons/fa6'
import { SiNetflix, SiStripe } from 'react-icons/si'
import { getCompanies, getSelectedCompany, setSelectedCompany } from '../data/companyCatalog.js'
import { getQuestionBank } from '../data/questionBank.js'
import microsoftLogo from '../assets/logos/microsoft.svg'

// A plain `import googleLogo from '../assets/logos/google.svg'` would fail
// the whole build if that file didn't exist — static imports are resolved
// at compile time, so there's no way to catch a missing one. import.meta.glob
// only includes files that actually exist on disk: if google.svg is missing,
// this just resolves to an empty object instead of erroring, and googleLogo
// below stays undefined so Google falls back to the letter badge.
const googleLogoFiles = import.meta.glob('../assets/logos/google.svg', { eager: true, import: 'default' })
const googleLogo = googleLogoFiles['../assets/logos/google.svg']

const APP_NAV = [
  { label: 'Interview Setup', to: '/setup' },
  { label: 'My Sessions', to: '/sessions' },
  { label: 'Progress Report', to: '/progress' },
  { label: 'Settings' },
]

const TYPES = [
  { key: 'Technical', icon: Code2, desc: 'Technical reasoning & CS' },
  { key: 'Behavioral', icon: Handshake, desc: 'STAR method' },
  { key: 'System Design', icon: Network, desc: 'Architecture explained in writing' },
]

// logo: a string means a local SVG (rendered as <img>, real colors as-is); a
// function means a react-icons component (rendered as <Logo/>, tinted via
// currentColor); missing/undefined falls back to the plain letter badge.
// Google has no working brand icon in any installed react-icons pack, so it
// uses its own SVG (googleLogo, above) if the file exists, on a white badge
// so the multicolor mark doesn't clash with Google's brand-blue square — and
// falls back to the letter badge automatically if the file is missing.
const COMPANY_LOGOS = {
  Google: googleLogo,
  Amazon: FaAmazon,
  Microsoft: microsoftLogo,
  Meta: FaMeta,
  Apple: FaApple,
  Netflix: SiNetflix,
  Spotify: FaSpotify,
  Stripe: SiStripe,
  Airbnb: FaAirbnb,
  Uber: FaUber,
}

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
  const [company, setCompany] = useState(getSelectedCompany)
  const [level, setLevel] = useState('Entry (0–2 yrs)')
  const [difficulty, setDifficulty] = useState('Medium')
  const [questionCount, setQuestionCount] = useState('5')
  const [topics, setTopics] = useState(availableTopics)
  const [timed, setTimed] = useState(false)
  const [companies] = useState(() => {
    const questions = getQuestionBank()
    return getCompanies()
      .filter((item) => item.status === 'Active')
      .map((item) => ({
        key: item.name,
        letter: item.letter,
        color: item.color,
        count: questions.filter((question) => question.company === item.name).length,
        logo: COMPANY_LOGOS[item.name],
      }))
  })
  const [companySearch, setCompanySearch] = useState('')
  const companyRowRef = useRef(null)
  const visibleCompanies = companies.filter((item) =>
    item.key.toLowerCase().includes(companySearch.trim().toLowerCase())
  )

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
        <button
          type="button"
          className="btn ghost sm"
          style={{ marginBottom: 16 }}
          onClick={() => navigate('/dashboard')}
        >
          ← Back to dashboard
        </button>
        <span className="eyebrow">Interview setup</span>
        <h1 className="h-title" style={{ marginTop: 8 }}>Set up your interview</h1>
        <p className="sub">Pick the company and format you're targeting.</p>
        <div className="setup-text-mode"><Code2 size={17} strokeWidth={1.8} /><span><b>Written responses only.</b> No live coding, diagrams, voice recording, or file uploads are required.</span></div>
        {role && <span className="pill g" style={{ marginTop: 12 }}>Practicing for: {role}</span>}

        <div className="setup-form">
          <div className="field card setup-section setup-type-section">
            <label>Interview type</label>
            <div className="g3 setup-type-grid">
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

          <div className="field card setup-section setup-company-section">
            <label>Target company <span className="muted" style={{ fontWeight: 400 }}>— questions in that company's style</span></label>
            <label className="setup-company-search">
              <Search size={17} strokeWidth={1.8} />
              <input
                type="search"
                value={companySearch}
                onChange={(event) => setCompanySearch(event.target.value)}
                placeholder="Search company"
                aria-label="Search company"
              />
              <ChevronDown size={17} strokeWidth={1.8} />
            </label>
            <div className="setup-company-carousel">
              <div className="setup-company-grid" ref={companyRowRef}>
                {visibleCompanies.map((c) => (
                  <div
                    key={c.key}
                    className={`co${company === c.key ? ' sel' : ''}`}
                    onClick={() => {
                      setCompany(c.key)
                      setSelectedCompany(c.key)
                    }}
                  >
                    <div
                      className="cl"
                      style={{ background: '#fff', border: '1px solid var(--line)', color: c.color }}
                    >
                      {typeof c.logo === 'string' ? (
                        <img src={c.logo} alt={`${c.key} logo`} className="cl-img" />
                      ) : c.logo ? (
                        <c.logo size={17} />
                      ) : (
                        c.letter
                      )}
                    </div>
                    <div className="setup-company-copy">
                      <h4>{c.key}</h4>
                      <p>{c.count} questions</p>
                    </div>
                    {company === c.key && <span className="setup-company-check">✓</span>}
                  </div>
                ))}
                {!visibleCompanies.length && <p className="setup-company-empty">No companies found.</p>}
              </div>
              {visibleCompanies.length > 4 && (
                <button
                  type="button"
                  className="setup-company-next"
                  onClick={() => companyRowRef.current?.scrollBy({ left: 420, behavior: 'smooth' })}
                  aria-label="Show more companies"
                >
                  <ChevronRight size={19} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          <div className="card setup-section setup-config-section">
            <div className="field setup-inner-field">
              <label>Experience level</label>
              <div className="chips">
                {LEVELS.map((l) => (
                  <button
                    type="button"
                    key={l}
                    className={`chip${level === l ? ' sel' : ''}`}
                    onClick={() => setLevel(l)}
                    aria-pressed={level === l}
                  >
                    {level === l && <Check className="setup-chip-check" size={14} strokeWidth={3} />}
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="g2 setup-config-grid">
              <div className="field setup-inner-field">
                <label>Difficulty</label>
                <div className="chips">
                  {DIFFICULTIES.map((d) => (
                    <button
                      type="button"
                      key={d}
                      className={`chip${difficulty === d ? ' sel' : ''}`}
                      onClick={() => setDifficulty(d)}
                      aria-pressed={difficulty === d}
                    >
                      {difficulty === d && <Check className="setup-chip-check" size={14} strokeWidth={3} />}
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field setup-inner-field">
                <label>Questions</label>
                <div className="chips">
                  {QUESTION_COUNTS.map((q) => (
                    <button
                      type="button"
                      key={q}
                      className={`chip${questionCount === q ? ' sel' : ''}`}
                      onClick={() => setQuestionCount(q)}
                      aria-pressed={questionCount === q}
                    >
                      {questionCount === q && <Check className="setup-chip-check" size={14} strokeWidth={3} />}
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="field card setup-section setup-topics-section">
            <label>Topics to focus on</label>
            <div className="chips">
              {availableTopics.map((t) => (
                <button
                  type="button"
                  key={t}
                  className={`chip${topics.includes(t) ? ' sel' : ''}`}
                  onClick={() => toggleTopic(t)}
                  aria-pressed={topics.includes(t)}
                >
                  {topics.includes(t) && <Check className="topic-chip-check" size={14} strokeWidth={3} />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="field card setup-section setup-timer-section">
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

          <div className="setup-actions">
            <button className="btn" onClick={handleContinue}>Continue to review →</button>
          </div>
        </div>
      </div>
    </section>
  )
}
