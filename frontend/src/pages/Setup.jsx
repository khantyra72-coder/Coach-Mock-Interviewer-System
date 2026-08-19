import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'

const APP_NAV = [
  { label: 'My Sessions', to: '/sessions' },
  { label: 'Settings' },
  { label: 'Logout', to: '/' },
]

const TYPES = [
  { key: 'Technical', icon: '💻', desc: 'Coding & CS' },
  { key: 'Behavioral', icon: '🤝', desc: 'STAR method' },
  { key: 'System Design', icon: '🏗️', desc: 'Architecture' },
]

const COMPANIES = [
  { key: 'Google', letter: 'G', color: '#4285F4', count: 14 },
  { key: 'Amazon', letter: 'a', color: '#FF9900', count: 12 },
  { key: 'Microsoft', letter: 'M', color: '#00A4EF', count: 11 },
  { key: 'Meta', letter: 'f', color: '#0866FF', count: 10 },
  { key: 'Apple', letter: '▲', color: '#111', count: 9 },
  { key: 'Netflix', letter: 'N', color: '#E50914', count: 8 },
]

const LEVELS = ['Intern', 'Entry (0–2 yrs)', 'Mid (3–5 yrs)', 'Senior']
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const QUESTION_COUNTS = ['5', '10', '15']
const TOPICS = ['Data Structures', 'Algorithms', 'System Design', 'Databases', 'APIs', 'Behavioral']

export default function Setup() {
  const navigate = useNavigate()
  const [type, setType] = useState('Technical')
  const [company, setCompany] = useState('Google')
  const [level, setLevel] = useState('Entry (0–2 yrs)')
  const [difficulty, setDifficulty] = useState('Medium')
  const [questionCount, setQuestionCount] = useState('5')
  const [topics, setTopics] = useState(['Data Structures', 'Algorithms'])

  const toggleTopic = (topic) => {
    setTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    )
  }

  return (
    <section className="screen" id="setup">
      <TopBar nav={APP_NAV} avatarText="JD" />
      <div className="wrap pagepad">
        <span className="eyebrow">Interview setup</span>
        <h1 className="h-title" style={{ marginTop: 8 }}>Set up your interview</h1>
        <p className="sub">Pick the company and format you're targeting.</p>

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
                  <div className="oi">{t.icon}</div>
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
                  <div className="cl" style={{ background: c.color }}>{c.letter}</div>
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
              {TOPICS.map((t) => (
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
              <div className="oi">⏱️</div>
              <div><h4>Timed session</h4><p>45 minutes total · shows a countdown during the interview</p></div>
              <div className="switch" style={{ marginLeft: 'auto', alignSelf: 'center' }}></div>
            </div>
          </div>

          <button className="btn" style={{ marginTop: 8 }} onClick={() => navigate('/ready')}>
            Continue to review →
          </button>
        </div>
      </div>
    </section>
  )
}
