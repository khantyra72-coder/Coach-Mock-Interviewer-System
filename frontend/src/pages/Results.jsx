import { useLocation, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { getLastResult } from '../utils/localInterviewStore.js'

const APP_NAV = [
  { label: 'Interview Setup', to: '/setup' },
  { label: 'My Sessions', to: '/sessions' },
  { label: 'Progress Report', to: '/progress' },
  { label: 'Settings' },
]

function scoreStyle(score) {
  return score < 70 ? { background: 'var(--amber-bg)', color: 'var(--amber)' } : undefined
}

function formatDate(value) {
  if (!value) return 'Today'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export default function Results() {
  const navigate = useNavigate()
  const location = useLocation()
  const result = location.state?.result || getLastResult()

  if (!result) {
    return (
      <section className="screen" id="results">
        <TopBar nav={APP_NAV} showUser />
        <div className="wrap pagepad" style={{ maxWidth: 680 }}>
          <div className="card" style={{ padding: 30, textAlign: 'center' }}>
            <h1>No completed interview yet</h1>
            <p className="sub muted" style={{ marginTop: 8 }}>Complete a session to generate rubric-based results.</p>
            <button className="btn" style={{ marginTop: 20 }} onClick={() => navigate('/role')}>Start an interview →</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="screen" id="results">
      <TopBar nav={APP_NAV} showUser />
      <div className="wrap pagepad">
        <div className="toast"><span className="dot">✓</span> Session saved and analyzed</div>
        <div className="rhead">
          <h1>Interview results</h1>
          <div className="rmeta">
            {result.role} · {result.company} · {formatDate(result.completedAt)} · {result.answeredCount}/{result.questionCount} answered
          </div>
        </div>
        <div className="overall">
          <div className="lbl">Your rubric coverage score</div>
          <div className="big">{result.overallScore}%</div>
          <div className="msg">{result.message}</div>
        </div>

        <div className="card break">
          <h3>Score breakdown</h3>
          {result.breakdown.map((item) => (
            <div className="brow" key={item.label}>
              <span className="bl">{item.label}</span>
              <span className="btr"><i style={{ width: `${item.value}%` }} /></span>
              <span className="bv">{item.value}%</span>
            </div>
          ))}
        </div>

        <div className="sw2">
          <div className="sbox good">
            <h4>💚 Top strengths</h4>
            <ul>{result.topStrengths.map((strength) => <li key={strength}>{strength}</li>)}</ul>
          </div>
          <div className="sbox imp">
            <h4>🌱 Top areas to improve</h4>
            <ul>{result.topImprovements.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>

        <div className="qbq">
          <h2>Question by question</h2>
          {result.questions.map((question) => (
            <div className="card qitem" key={question.questionId}>
              <div className="qih">
                <span className="qn">Q{question.n}</span>
                <span className="qx">{question.text}</span>
                <span className="qs" style={scoreStyle(question.score)}>{question.score}%</span>
              </div>
              <div className="qib">
                <div className="ans">
                  {question.answer.trim() ? `“${question.answer}”` : 'No answer submitted.'}
                </div>
                <div className="sw">
                  <div className="st">
                    <h5>✅ Rubric concepts covered</h5>
                    <ul>{question.strengths.map((strength) => <li key={strength}>{strength}</li>)}</ul>
                  </div>
                  <div className="wk">
                    <h5>❌ Rubric concepts missing</h5>
                    <ul>{question.weaknesses.map((weakness) => <li key={weakness}>{weakness}</li>)}</ul>
                  </div>
                </div>
                <div className="sug">💡 <b>Suggestion:</b> {question.suggestion}</div>
                <div className="model">
  <h5>📝 Strong answer outline</h5>
  <ul>
    {(question.model || [
      'State the main idea clearly.',
      'Explain your reasoning.',
      'Give a concrete example.',
      'Mention important trade-offs.',
    ]).map((point) => (
      <li key={point}>{point}</li>
    ))}
  </ul>
</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => navigate('/setup', { state: { role: result.role } })}>Practice again →</button>
          <button className="btn ghost" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
        </div>
      </div>
    </section>
  )
}
