import TopBar from '../components/TopBar.jsx'

const ADMIN_NAV = [
  { label: 'Users' },
  { label: 'Companies' },
  { label: 'Questions' },
  { label: 'Logout', to: '/' },
]

const QUESTIONS = [
  { id: '#021', text: 'Design a rate limiter for a public API.', role: 'Software Engineer', company: 'Google', difficulty: 'Hard', pill: 'c' },
  { id: '#022', text: 'Array vs linked list — trade-offs?', role: 'Backend', company: 'Amazon', difficulty: 'Easy', pill: 'g' },
  { id: '#023', text: 'Explain the React rendering lifecycle.', role: 'Frontend', company: 'Meta', difficulty: 'Medium', pill: 'a' },
  { id: '#024', text: 'Tell me about yourself.', role: 'Any', company: 'All', difficulty: 'Easy', pill: 'g' },
]

export default function Admin() {
  return (
    <section className="screen" id="admin">
      <TopBar
        subtitle="Manage questions"
        nav={ADMIN_NAV}
        avatarText="AD"
        avatarStyle={{ background: 'linear-gradient(140deg,#C77E24,#e0a758)' }}
      />
      <div className="wrap pagepad">
        <div className="ahd">
          <div>
            <span className="eyebrow">Content</span>
            <h1 className="h-title" style={{ marginTop: 6 }}>Interview questions</h1>
          </div>
          <button className="btn">+ Add question</button>
        </div>

        <table className="adm">
          <thead>
            <tr><th>ID</th><th>Question</th><th>Role</th><th>Company</th><th>Difficulty</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {QUESTIONS.map((q) => (
              <tr key={q.id}>
                <td>{q.id}</td>
                <td>{q.text}</td>
                <td>{q.role}</td>
                <td>{q.company}</td>
                <td><span className={`pill ${q.pill}`}>{q.difficulty}</span></td>
                <td><span className="act">Edit</span><span className="act del">Delete</span></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="card fcard">
          <span className="eyebrow">New question</span>
          <h3 className="disp" style={{ marginTop: 6 }}>Add a question</h3>
          <div className="field" style={{ margin: '16px 0 0' }}>
            <label>Question text</label>
            <textarea style={{ minHeight: 64, marginTop: 0 }} defaultValue="Design a rate limiter for a public API." />
          </div>
          <div className="field">
            <label>Model answer keywords (used for scoring)</label>
            <textarea style={{ minHeight: 52, marginTop: 0 }} placeholder="token bucket, sliding window, Redis, throttling…" />
          </div>
          <div className="g3">
            <div className="field" style={{ margin: 0 }}>
              <label>Role</label>
              <select>
                <option>Software Engineer</option><option>Frontend</option><option>Backend</option><option>Data Scientist</option>
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Company</label>
              <select>
                <option>Google</option><option>Amazon</option><option>Microsoft</option><option>Meta</option><option>All</option>
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Difficulty</label>
              <select><option>Easy</option><option>Medium</option><option>Hard</option></select>
            </div>
          </div>
          <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
            <button className="btn">Save question</button>
            <button className="btn ghost">Cancel</button>
          </div>
        </div>
      </div>
    </section>
  )
}
