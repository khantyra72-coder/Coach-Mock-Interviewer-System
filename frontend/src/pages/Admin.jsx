import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import {
  deleteQuestion as deleteQuestionFromBank,
  getCustomQuestions,
  getQuestionBank,
  saveCustomQuestions,
  saveQuestionOverride,
} from '../data/questionBank.js'
import { getCompanies, saveCompanies } from '../data/companyCatalog.js'
import { getSessionHistory } from '../data/sessionCatalog.js'
import { apiGet } from '../api/client.js'

const ADMIN_NAV = [
  { label: 'Users', to: '/admin?section=users' },
  { label: 'Companies', to: '/admin?section=companies' },
  { label: 'Questions', to: '/admin?section=questions' },
]

const ROLES = ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'Data Scientist', 'ML / AI Engineer', 'Cloud / DevOps Engineer', 'Mobile Developer', 'Cybersecurity Analyst', 'QA / Test Engineer', 'Any']
const QUESTION_PAGE_SIZE = 25
const NON_TEXT_REQUEST = /\b(draw|sketch|whiteboard|upload|record (a |your )?(voice|video)|speak aloud|execute code|run code|write (a )?(function|program|code)|live coding)\b/i

function isTextAnswerable(prompt) {
  return !NON_TEXT_REQUEST.test(prompt)
}

function AdminHeader({ eyebrow, title, action, onAction }) {
  return (
    <div className="ahd">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="h-title" style={{ marginTop: 6 }}>{title}</h1>
      </div>
      {action && <button type="button" className="btn" onClick={onAction}>+ {action}</button>}
    </div>
  )
}

function UsersPage() {
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    apiGet('/admin/users')
      .then((data) => {
        if (active) setUsers(data)
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load registered users.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const visibleUsers = users.filter((user) => filter === 'active' ? true : filter === 'interviewed' ? user.interviews > 0 : true)
  const joinedDate = (value) => value
    ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value))
    : '—'
  const displayId = (id) => `#${String(id).padStart(3, '0')}`
  return (
    <>
      <AdminHeader eyebrow="Access" title="Users" />
      <div className="admin-summary">
        <button className={`card${filter === 'all' ? ' selected' : ''}`} onClick={() => setFilter('all')}><b>{users.length}</b><span>Total users</span></button>
        <button className={`card${filter === 'active' ? ' selected' : ''}`} onClick={() => setFilter('active')}><b>{users.filter((user) => user.status === 'Active').length}</b><span>Active users</span></button>
        <button className={`card${filter === 'interviewed' ? ' selected' : ''}`} onClick={() => setFilter('interviewed')}><b>{users.reduce((sum, user) => sum + user.interviews, 0)}</b><span>Interviews completed</span></button>
      </div>
      {error && <div className="card admin-action-panel"><p>{error}</p></div>}
      {selected && <div className="card admin-action-panel">
        <h3>{selected.name}</h3><p className="muted">{selected.email} · {selected.role} · Active</p><p>{selected.interviews} interviews completed · Joined {joinedDate(selected.joinedAt)}</p><button className="btn ghost sm" onClick={() => setSelected(null)}>Close</button>
      </div>}
      <div className="admin-table-wrap">
        <table className="adm">
          <thead><tr><th>ID</th><th>User</th><th>Role</th><th>Interviews</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>{loading ? (
            <tr><td colSpan="7">Loading registered users…</td></tr>
          ) : visibleUsers.length === 0 ? (
            <tr><td colSpan="7">No registered users found.</td></tr>
          ) : visibleUsers.map((user) => (
            <tr key={user.id}>
              <td>{displayId(user.id)}</td><td><b>{user.name}</b><div className="admin-subtext">{user.email}</div></td>
              <td>{user.role}</td><td>{user.interviews}</td><td><span className="pill g">Active</span></td><td>{joinedDate(user.joinedAt)}</td>
              <td><button type="button" className="act" onClick={() => setSelected(user)}>View</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  )
}

function CompaniesPage({ companies, onAdd, onUpdate }) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [style, setStyle] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const questionCount = (company) => getQuestionBank().filter((question) => question.company === company.name).length
  const sessionCount = (company) => getSessionHistory().filter((session) => session.company === company.name).length
  const visibleCompanies = companies.filter((company) => filter === 'questions' ? questionCount(company) > 0 : filter === 'sessions' ? sessionCount(company) > 0 : true)

  const submit = (event) => {
    event.preventDefault()
    if (!name.trim() || !style.trim()) return
    onAdd({ id: `#C${String(companies.length + 1).padStart(2, '0')}`, name: name.trim(), style: style.trim(), sessions: 0, status: 'Active', custom: true })
    setName(''); setStyle(''); setShowForm(false)
  }

  return (
    <>
      <AdminHeader eyebrow="Question targeting" title="Companies" action="Add company" onAction={() => setShowForm((value) => !value)} />
      {showForm && (
        <form className="card admin-form" onSubmit={submit}>
          <div><span className="eyebrow">New company</span><h3>Add a target company</h3></div>
          <div className="g2">
            <div className="field"><label>Company name</label><input className="inp" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Stripe" required /></div>
            <div className="field"><label>Interview style</label><input className="inp" value={style} onChange={(event) => setStyle(event.target.value)} placeholder="What this company emphasizes" required /></div>
          </div>
          <div className="admin-form-actions"><button className="btn" type="submit">Save company</button><button className="btn ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button></div>
        </form>
      )}
      <div className="admin-summary">
        <button className={`card${filter === 'all' ? ' selected' : ''}`} onClick={() => setFilter('all')}><b>{companies.length}</b><span>Companies</span></button>
        <button className={`card${filter === 'questions' ? ' selected' : ''}`} onClick={() => setFilter('questions')}><b>{getQuestionBank().filter((question) => question.company !== 'All').length}</b><span>Company-specific questions</span></button>
        <button className={`card${filter === 'sessions' ? ' selected' : ''}`} onClick={() => setFilter('sessions')}><b>{getSessionHistory().length}</b><span>Practice sessions</span></button>
      </div>
      {(selected || editing) && <div className="card admin-action-panel">
        {editing ? <form onSubmit={(event) => { event.preventDefault(); onUpdate(editing); setSelected(editing); setEditing(null) }}><h3>Edit company</h3><div className="g3">
          <div className="field"><label>Name</label><input className="inp" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
          <div className="field"><label>Interview style</label><input className="inp" value={editing.style} onChange={(e) => setEditing({ ...editing, style: e.target.value })} /></div>
          <div className="field"><label>Status</label><select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}><option>Active</option><option>Disabled</option></select></div>
        </div><div className="admin-form-actions"><button className="btn">Save changes</button><button type="button" className="btn ghost" onClick={() => setEditing(null)}>Cancel</button></div></form>
          : <><h3>{selected.name}</h3><p>{selected.style}</p><p className="muted">{questionCount(selected)} available questions · {sessionCount(selected)} sessions · {selected.status}</p><button className="btn ghost sm" onClick={() => setSelected(null)}>Close</button></>}
      </div>}
      <div className="admin-table-wrap"><table className="adm">
        <thead><tr><th>ID</th><th>Company</th><th>Interview style</th><th>Questions</th><th>Sessions</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{visibleCompanies.map((company) => (
          <tr key={company.id}><td>{company.id}</td><td><b>{company.name}</b></td><td>{company.style}</td>
            <td>{getQuestionBank().filter((question) => question.company === company.name).length}</td><td>{sessionCount(company)}</td>
            <td><span className={`pill ${company.status === 'Active' ? 'g' : 'c'}`}>{company.status}</span></td><td><button type="button" className="act" onClick={() => { setSelected(company); setEditing(null) }}>View</button><button type="button" className="act" onClick={() => { setEditing({ ...company }); setSelected(null) }}>Edit</button><button type="button" className="act del" onClick={() => onUpdate({ ...company, status: company.status === 'Active' ? 'Disabled' : 'Active' })}>{company.status === 'Active' ? 'Disable' : 'Enable'}</button></td></tr>
        ))}</tbody>
      </table></div>
    </>
  )
}

function QuestionsPage({ questions, companies, onAdd, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ prompt: '', role: 'Software Engineer', company: 'All', type: 'Technical', topic: '', difficulty: 'Medium', rubrics: '', model: '' })
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState('All companies')
  const [typeFilter, setTypeFilter] = useState('All types')
  const [page, setPage] = useState(1)
  const [formError, setFormError] = useState('')
  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))
  const visibleQuestions = questions.filter((question) => {
    if (filter === 'roles' && question.role === 'Any') return false
    if (filter === 'companies' && question.company === 'All') return false
    if (companyFilter !== 'All companies' && question.company !== companyFilter) return false
    if (typeFilter !== 'All types' && question.type !== typeFilter) return false
    const query = search.trim().toLowerCase()
    return !query || [question.prompt, question.role, question.company, question.topic].some((value) => value.toLowerCase().includes(query))
  })
  const pageCount = Math.max(1, Math.ceil(visibleQuestions.length / QUESTION_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageQuestions = visibleQuestions.slice((currentPage - 1) * QUESTION_PAGE_SIZE, currentPage * QUESTION_PAGE_SIZE)
  const changeFilter = (setter) => (event) => { setter(event.target.value); setPage(1) }

  const submit = (event) => {
    event.preventDefault()
    const rubricLines = form.rubrics.split('\n').map((line) => line.trim()).filter(Boolean)
    if (!form.prompt.trim() || !form.topic.trim() || rubricLines.length < 3) return
    if (!isTextAnswerable(form.prompt)) {
      setFormError('This question requests a non-text task. Rewrite it so the candidate can answer entirely in writing.')
      return
    }
    const baseWeight = Math.floor(100 / rubricLines.length)
    const concepts = rubricLines.map((line, index) => {
      const parts = line.split('|').map((part) => part.trim()).filter(Boolean)
      return { label: parts[0], keywords: parts, guidance: `Cover ${parts[0].toLowerCase()} clearly.`, weight: index === rubricLines.length - 1 ? 100 - baseWeight * (rubricLines.length - 1) : baseWeight }
    })
    onAdd({
      id: `custom-${Date.now()}`, ...form, prompt: form.prompt.trim(), topic: form.topic.trim(),
      tips: ['Explain your assumptions.', 'Cover the expected concepts.', 'Include trade-offs or a concrete example.'],
      model: form.model.split('\n').map((line) => line.trim()).filter(Boolean).length ? form.model.split('\n').map((line) => line.trim()).filter(Boolean) : concepts.map((item) => item.label),
      concepts, responseMode: 'Written response', textAnswerable: true, custom: true,
    })
    setForm({ prompt: '', role: 'Software Engineer', company: 'All', type: 'Technical', topic: '', difficulty: 'Medium', rubrics: '', model: '' })
    setFormError('')
    setShowForm(false)
  }

  return (
    <>
      <AdminHeader eyebrow="Content" title="Interview questions" action="Add question" onAction={() => setShowForm((value) => !value)} />
      <div className="admin-text-policy"><b>Written-response question bank</b><span>Every question must be answerable using text only. Do not request live coding, diagrams, recordings, or uploads.</span></div>
      {showForm && (
        <form className="card admin-form" onSubmit={submit}>
          <div><span className="eyebrow">New question</span><h3>Add a rubric-scored interview question</h3></div>
          <div className="field"><label>Question text</label><textarea value={form.prompt} onChange={(event) => { update('prompt', event.target.value); setFormError('') }} placeholder="Enter a question that can be answered completely in writing" required /></div>
          {formError && <p className="admin-form-error" role="alert">{formError}</p>}
          <div className="g3">
            <div className="field"><label>Role</label><select value={form.role} onChange={(event) => update('role', event.target.value)}>{ROLES.map((role) => <option key={role}>{role}</option>)}</select></div>
            <div className="field"><label>Company</label><select value={form.company} onChange={(event) => update('company', event.target.value)}><option>All</option>{companies.map((company) => <option key={company.id}>{company.name}</option>)}</select></div>
            <div className="field"><label>Interview type</label><select value={form.type} onChange={(event) => update('type', event.target.value)}><option>Technical</option><option>Behavioral</option><option>System Design</option></select></div>
            <div className="field"><label>Topic</label><input className="inp" value={form.topic} onChange={(event) => update('topic', event.target.value)} placeholder="e.g. Databases" required /></div>
            <div className="field"><label>Difficulty</label><select value={form.difficulty} onChange={(event) => update('difficulty', event.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
          </div>
          <div className="g2">
            <div className="field"><label>Expected rubric concepts</label><textarea value={form.rubrics} onChange={(event) => update('rubrics', event.target.value)} placeholder={'One concept per line (minimum 3)\nCaching | Redis | cache\nInvalidation | TTL | expiry'} required /></div>
            <div className="field"><label>Model answer outline</label><textarea value={form.model} onChange={(event) => update('model', event.target.value)} placeholder={'One outline point per line\nClarify requirements\nExplain the approach'} /></div>
          </div>
          <p className="muted admin-help">Answer format: Written response. Use | to add accepted synonyms. Rubric weights are distributed equally and total 100%.</p>
          <div className="admin-form-actions"><button className="btn" type="submit">Save question</button><button className="btn ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button></div>
        </form>
      )}
      <div className="admin-summary">
        <button className={`card${filter === 'all' ? ' selected' : ''}`} onClick={() => setFilter('all')}><b>{questions.length}</b><span>Total questions</span></button>
        <button className={`card${filter === 'roles' ? ' selected' : ''}`} onClick={() => setFilter('roles')}><b>{new Set(questions.map((question) => question.role)).size}</b><span>Roles covered</span></button>
        <button className={`card${filter === 'companies' ? ' selected' : ''}`} onClick={() => setFilter('companies')}><b>{questions.filter((question) => question.company !== 'All').length}</b><span>Company-specific</span></button>
      </div>
      <div className="card admin-question-filters">
        <input className="inp" type="search" value={search} onChange={changeFilter(setSearch)} placeholder="Search questions" aria-label="Search questions" />
        <select value={companyFilter} onChange={changeFilter(setCompanyFilter)} aria-label="Filter questions by company">
          <option>All companies</option>{companies.map((company) => <option key={company.id}>{company.name}</option>)}
        </select>
        <select value={typeFilter} onChange={changeFilter(setTypeFilter)} aria-label="Filter questions by type">
          <option>All types</option><option>Technical</option><option>System Design</option><option>Behavioral</option>
        </select>
      </div>
      {(selected || editing) && <div className="card admin-action-panel">
        {editing ? <form onSubmit={(event) => { event.preventDefault(); if (!isTextAnswerable(editing.prompt)) return; const updated = { ...editing, responseMode: 'Written response', textAnswerable: true }; onUpdate(updated); setSelected(updated); setEditing(null) }}><h3>Edit question</h3>
          <div className="field"><label>Question</label><textarea value={editing.prompt} onChange={(e) => setEditing({ ...editing, prompt: e.target.value })} /></div>
          <div className="g3"><div className="field"><label>Role</label><select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })}>{ROLES.map((role) => <option key={role}>{role}</option>)}</select></div>
          <div className="field"><label>Company</label><select value={editing.company} onChange={(e) => setEditing({ ...editing, company: e.target.value })}><option>All</option>{companies.map((company) => <option key={company.id}>{company.name}</option>)}</select></div>
          <div className="field"><label>Difficulty</label><select value={editing.difficulty} onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })}><option>Easy</option><option>Medium</option><option>Hard</option></select></div></div>
          <div className="admin-form-actions"><button className="btn">Save changes</button><button type="button" className="btn ghost" onClick={() => setEditing(null)}>Cancel</button></div></form>
          : <><h3>{selected.prompt}</h3><p className="muted">{selected.role} · {selected.company} · {selected.type} · {selected.difficulty} · Written response</p><h5 style={{ marginTop: 12 }}>Rubric concepts</h5><ul>{selected.concepts.map((item) => <li key={item.label}>{item.label} ({item.weight}%)</li>)}</ul><button className="btn ghost sm" style={{ marginTop: 12 }} onClick={() => setSelected(null)}>Close</button></>}
      </div>}
      <div className="admin-table-wrap"><table className="adm">
        <thead><tr><th>ID</th><th>Question</th><th>Role</th><th>Company</th><th>Type</th><th>Answer format</th><th>Difficulty</th><th>Rubrics</th><th>Actions</th></tr></thead>
        <tbody>{pageQuestions.map((question, index) => (
          <tr key={question.id}><td>#{String((currentPage - 1) * QUESTION_PAGE_SIZE + index + 1).padStart(4, '0')}</td><td className="admin-question-cell">{question.prompt}<div className="admin-subtext">{question.topic}</div></td>
            <td>{question.role}</td><td>{question.company}</td><td>{question.type}</td><td><span className="admin-text-badge">Text</span></td><td><span className={`pill ${question.difficulty === 'Hard' ? 'c' : question.difficulty === 'Easy' ? 'g' : 'a'}`}>{question.difficulty}</span></td>
            <td>{question.concepts.length}</td><td><button type="button" className="act" onClick={() => { setSelected(question); setEditing(null) }}>View</button><button type="button" className="act" onClick={() => { setEditing({ ...question }); setSelected(null) }}>Edit</button><button type="button" className="act del" onClick={() => onDelete(question.id)}>Delete</button></td></tr>
        ))}</tbody>
      </table></div>
      <div className="admin-pagination">
        <span>Showing {visibleQuestions.length ? (currentPage - 1) * QUESTION_PAGE_SIZE + 1 : 0}–{Math.min(currentPage * QUESTION_PAGE_SIZE, visibleQuestions.length)} of {visibleQuestions.length} questions</span>
        <div><button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>← Previous</button><span>Page {currentPage} of {pageCount}</span><button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next →</button></div>
      </div>
    </>
  )
}

export default function Admin() {
  const [searchParams] = useSearchParams()
  const section = searchParams.get('section') || 'users'
  const [companies, setCompanies] = useState(getCompanies)
  const [questions, setQuestions] = useState(getQuestionBank)
  const title = section === 'companies' ? 'Manage companies' : section === 'questions' ? 'Manage questions' : 'Manage users'

  const addCompany = (company) => {
    const next = [...companies, company]
    saveCompanies(next)
    setCompanies(next)
  }
  const updateCompany = (company) => {
    const next = companies.map((item) => item.id === company.id ? company : item)
    saveCompanies(next)
    setCompanies(next)
  }
  const addQuestion = (question) => {
    saveCustomQuestions([...getCustomQuestions(), question])
    setQuestions(getQuestionBank())
  }
  const updateQuestion = (question) => {
    if (question.custom) {
      saveCustomQuestions(getCustomQuestions().map((item) => item.id === question.id ? question : item))
    } else {
      saveQuestionOverride(question)
    }
    setQuestions(getQuestionBank())
  }
  const removeQuestion = (id) => {
    deleteQuestionFromBank(id)
    setQuestions(getQuestionBank())
  }

  return (
    <section className="screen" id="admin">
      <TopBar subtitle={title} nav={ADMIN_NAV} showUser avatarStyle={{ background: 'linear-gradient(140deg,#C77E24,#e0a758)' }} />
      <div className="wrap pagepad">
        {section === 'companies'
          ? <CompaniesPage companies={companies} onAdd={addCompany} onUpdate={updateCompany} />
          : section === 'questions'
            ? <QuestionsPage questions={questions} companies={companies} onAdd={addQuestion} onUpdate={updateQuestion} onDelete={removeQuestion} />
            : <UsersPage />}
      </div>
    </section>
  )
}
