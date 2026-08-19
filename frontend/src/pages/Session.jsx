import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'

const MAX_CHARS = 2000

export default function Session() {
  const navigate = useNavigate()
  const [answer, setAnswer] = useState('')

  return (
    <section className="screen" id="session">
      <TopBar
        subtitle="Software Engineer · Google"
        rightButton={{ label: 'Leave session', to: '/dashboard' }}
      />
      <div className="wrap pagepad" style={{ maxWidth: 800 }}>
        <div className="stop">
          <span style={{ fontWeight: 700, fontSize: 14 }}>Question 3 of 5</span>
          <div className="prog"><i></i></div>
          <div className="timer">⏱️ 32:14</div>
        </div>
        <p className="muted" style={{ fontSize: 13 }}>2 questions left</p>

        <div className="card qcard">
          <div className="qhead">
            <div className="qbadge">3</div>
            <div>
              <span className="pill g" style={{ marginBottom: 9 }}>Technical</span>
              <div className="qt">
                Explain how you would design a rate limiter for a public API. What data structure and trade-offs would you consider?
              </div>
            </div>
          </div>
          <textarea
            placeholder="Type your answer here. Structure your thinking and give concrete examples…"
            value={answer}
            maxLength={MAX_CHARS}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <div className="cc">{answer.length} / {MAX_CHARS} characters</div>
          <div className="tips">
            <h5>Tips for a strong answer</h5>
            <ul>
              <li>State your assumptions and requirements first.</li>
              <li>Compare at least two approaches and their trade-offs.</li>
              <li>Mention scale, edge cases, and how you'd test it.</li>
            </ul>
          </div>
          <div className="sact">
            <button className="btn ghost sm">← Previous</button>
            <button className="btn ghost sm">🔖 Mark for review</button>
            <button className="btn end" onClick={() => navigate('/results')}>Next question →</button>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16, padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="muted" style={{ fontSize: 13 }}>You've answered 2 of 5 questions.</span>
          <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => navigate('/results')}>
            End & calculate score
          </button>
        </div>
      </div>
    </section>
  )
}
