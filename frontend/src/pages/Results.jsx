import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'

const APP_NAV = [
  { label: 'My Sessions', to: '/sessions' },
  { label: 'Settings' },
]

const BREAKDOWN = [
  { label: 'Communication', value: 82 },
  { label: 'Technical depth', value: 68 },
  { label: 'Problem solving', value: 74 },
  { label: 'Structure & clarity', value: 80 },
]

const QUESTIONS = [
  {
    n: 1,
    score: 75,
    text: "Tell me about yourself and why you're interested in this role.",
    answer: "\"I'm a final-year CS student who enjoys building web apps. I've worked on a few academic projects and I'm interested in this role because…\"",
    strengths: ['Good personal intro', 'Showed enthusiasm'],
    weaknesses: ["Didn't connect skills to the role", 'No specific examples'],
    suggestion: 'Mention 1–2 specific projects or achievements relevant to the role.',
    model: [
      'A one-line summary of who you are professionally',
      'Two relevant achievements with context',
      'Why this role and company specifically',
      'A short, confident closing line',
    ],
  },
  {
    n: 2,
    score: 62,
    text: 'Explain the difference between an array and a linked list.',
    answer: '"An array stores items together and a linked list uses nodes with pointers, so insertion is different…"',
    strengths: ['Correct core concept', 'Mentioned insertion cost'],
    weaknesses: ['Missed time-complexity detail', 'No trade-off / when-to-use'],
    suggestion: 'State Big-O for access vs insertion, and give one real use case for each.',
    model: [
      'Array: contiguous memory, O(1) random access, costly inserts',
      'Linked list: dynamic size, O(1) inserts at known nodes, O(n) traversal',
      'One sentence on when to prefer each',
    ],
  },
  {
    n: 3,
    score: 81,
    text: "What's the difference between a process and a thread?",
    answer: '"A process is a running program with its own memory, and threads run inside a process and share its memory, so threads are lighter to create…"',
    strengths: ['Correct core definitions', 'Noted shared vs isolated memory'],
    weaknesses: ["Didn't mention context-switching cost", 'No real-world example'],
    suggestion: 'Add a concrete example — browser tabs as processes, workers as threads.',
    model: [
      'Process: isolated memory, heavier, safer',
      'Thread: shares process memory, lighter, faster to switch',
      'When to use each + one trade-off',
    ],
  },
  {
    n: 4,
    score: 70,
    text: 'How does a hash map handle collisions?',
    answer: '"When two keys land in the same bucket you can use chaining with a linked list to store both values…"',
    strengths: ['Explained chaining correctly', 'Understood the bucket concept'],
    weaknesses: ['Missed open addressing / probing', 'No mention of load factor or resizing'],
    suggestion: 'Contrast chaining vs open addressing, and mention resizing at high load factor.',
    model: [
      'Collision = two keys map to one bucket',
      'Handle via chaining or open addressing (probing)',
      'Load factor triggers resize / rehash',
    ],
  },
  {
    n: 5,
    score: 84,
    text: 'Describe a challenging bug you fixed and how you approached it.',
    answer: '"In a group project our app crashed on login. I reproduced it, traced it to a null value from the API, added a check, and crash reports dropped to zero…"',
    strengths: ['Clear STAR structure', 'Quantified the impact'],
    weaknesses: ['Setup ran a little long', 'Could name the debugging tools used'],
    suggestion: 'Tighten the situation to one sentence so more time goes to actions and results.',
    model: [
      'Situation & task in one line each',
      'Specific actions taken to diagnose',
      'Measurable result + what you learned',
    ],
  },
]

function scoreStyle(score) {
  return score < 70 ? { background: 'var(--amber-bg)', color: 'var(--amber)' } : undefined
}

export default function Results() {
  const navigate = useNavigate()

  return (
    <section className="screen" id="results">
      <TopBar nav={APP_NAV} showUser />
      <div className="wrap pagepad">
        <div className="toast"><span className="dot">✓</span> Session completed 🎉</div>
        <div className="rhead">
          <h1>Interview results</h1>
          <div className="rmeta">Software Engineer · Google · Aug 13, 2026 · 5/5 answered</div>
        </div>
        <div className="overall">
          <div className="lbl">Your overall score</div>
          <div className="big">76%</div>
          <div className="msg">Good effort, John! You're improving steadily.</div>
        </div>

        <div className="card break">
          <h3>Score breakdown</h3>
          {BREAKDOWN.map((b) => (
            <div className="brow" key={b.label}>
              <span className="bl">{b.label}</span>
              <span className="btr"><i style={{ width: `${b.value}%` }}></i></span>
              <span className="bv">{b.value}%</span>
            </div>
          ))}
        </div>

        <div className="sw2">
          <div className="sbox good">
            <h4>💚 Top strengths</h4>
            <ul>
              <li>Clear introduction</li>
              <li>Used relevant examples</li>
              <li>Stayed calm and structured throughout</li>
            </ul>
          </div>
          <div className="sbox imp">
            <h4>🌱 Top areas to improve</h4>
            <ul>
              <li>Add more specific detail in technical answers</li>
              <li>End answers with a clear conclusion</li>
              <li>Reduce filler words</li>
            </ul>
          </div>
        </div>

        <div className="qbq">
          <h2>Question by question</h2>
          {QUESTIONS.map((q) => (
            <div className="card qitem" key={q.n}>
              <div className="qih">
                <span className="qn">Q{q.n}</span>
                <span className="qx">{q.text}</span>
                <span className="qs" style={scoreStyle(q.score)}>{q.score}%</span>
              </div>
              <div className="qib">
                <div className="ans">{q.answer}</div>
                <div className="sw">
                  <div className="st">
                    <h5>✅ Strengths</h5>
                    <ul>{q.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
                  </div>
                  <div className="wk">
                    <h5>❌ Weaknesses</h5>
                    <ul>{q.weaknesses.map((w) => <li key={w}>{w}</li>)}</ul>
                  </div>
                </div>
                <div className="sug">💡 <b>Suggestion:</b> {q.suggestion}</div>
                <div className="model">
                  <h5>📝 Model answer summary</h5>
                  <ul>{q.model.map((m) => <li key={m}>{m}</li>)}</ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button className="btn" onClick={() => navigate('/setup')}>Practice again →</button>
          <button className="btn ghost">⬇ Download PDF</button>
          <button className="btn ghost" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
        </div>
      </div>
    </section>
  )
}
