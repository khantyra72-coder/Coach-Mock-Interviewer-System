import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { getCompanies, saveCompanies } from '../data/companyCatalog.js'
import { getSessionHistory } from '../data/sessionCatalog.js'
import { apiDelete, apiGet, apiPost, apiPut } from '../api/client.js'
import { INTERVIEW_TYPES, TECH_ROLES } from '../data/interviewTaxonomy.js'
import EvidenceRubricEditor from '../components/admin/EvidenceRubricEditor.jsx'

const ADMIN_NAV = [
  { label: 'Users', to: '/admin?section=users' },
  { label: 'Companies', to: '/admin?section=companies' },
  { label: 'Questions', to: '/admin?section=questions' },
]

const ROLES = [...TECH_ROLES]
const QUESTION_PAGE_SIZE = 25
const NON_TEXT_REQUEST = /\b(draw|sketch|whiteboard|upload|record (a |your )?(voice|video)|speak aloud|execute code|run code|write (a )?(function|program|code)|live coding)\b/i

function isTextAnswerable(prompt) {
  return !NON_TEXT_REQUEST.test(prompt)
}

function fromDatabaseQuestion(question) {
  return {
    id: question.id,
    prompt: question.questionText,
    role: question.role,
    company: question.company || 'All',
    type: question.interviewType,
    topic: question.topic,
    difficulty: question.difficulty,
    sourceType: question.sourceType,
    expectedAnswerSummary: question.expectedAnswerSummary,
    reviewStatus: question.reviewStatus,
    active: question.active,
    concepts: question.rubrics.map((rubric) => ({
      id: rubric.id,
      label: rubric.name,
      description: rubric.description,
      expectedEvidence: rubric.expectedEvidence,
      acceptableAlternatives: rubric.acceptableAlternatives,
      keywords: rubric.keywords,
      weight: rubric.weight,
      importance: rubric.importance,
      rubricVersion: rubric.rubricVersion,
      evidenceStatus: rubric.evidenceStatus,
      semanticDescription: rubric.semanticDescription,
      evidenceGroups: rubric.evidenceGroups || [],
    })),
  }
}

function toDatabaseQuestion(question) {
  return {
    questionText: question.prompt.trim(),
    role: question.role,
    interviewType: question.type,
    company: question.company === 'All' ? null : question.company,
    topic: question.topic.trim(),
    difficulty: question.difficulty,
    expectedAnswerSummary: question.expectedAnswerSummary.trim(),
    reviewStatus: question.reviewStatus || 'Approved',
    rubrics: question.concepts.map((criterion) => ({
      name: criterion.label,
      description: criterion.description || `Evaluates ${criterion.label.toLowerCase()}.`,
      expectedEvidence: criterion.expectedEvidence || `The answer clearly demonstrates ${criterion.label.toLowerCase()}.`,
      acceptableAlternatives: criterion.acceptableAlternatives || 'Accept equivalent evidence that satisfies the same criterion.',
      keywords: Array.isArray(criterion.keywords) ? criterion.keywords.join(',') : criterion.keywords || criterion.label,
      weight: criterion.weight,
      importance: criterion.importance,
      rubricVersion: criterion.rubricVersion || 2,
      evidenceStatus: criterion.evidenceStatus,
      semanticDescription: criterion.semanticDescription || criterion.expectedEvidence,
      evidenceGroups: criterion.evidenceGroups || [],
    })),
  }
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
    const loadUsers = () => apiGet('/admin/users')
        .then((data) => {
          if (active) {
            const nextUsers = Array.isArray(data) ? data : []
            setUsers(nextUsers)
            setSelected((current) => current
              ? nextUsers.find((user) => user.id === current.id) || current
              : null
            )
            setError('')
          }
        })
        .catch((err) => {
          if (active) setError(err.message || 'Could not load registered users.')
        })
        .finally(() => {
          if (active) setLoading(false)
        })

    loadUsers()
    const refreshId = window.setInterval(loadUsers, 10000)
    const refreshOnFocus = () => loadUsers()
    window.addEventListener('focus', refreshOnFocus)
    return () => {
      active = false
      window.clearInterval(refreshId)
      window.removeEventListener('focus', refreshOnFocus)
    }
  }, [])

  const visibleUsers = users.filter((user) => filter === 'active' ? Boolean(user.lastLoginAt) : filter === 'interviewed' ? user.interviews > 0 : true)
  const joinedDate = (value) => value
    ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value))
    : '—'
  const displayId = (id) => `#${String(id).padStart(3, '0')}`
  return (
    <>
      <AdminHeader eyebrow="Access" title="Users" />
      <div className="admin-summary">
        <button className={`card${filter === 'all' ? ' selected' : ''}`} onClick={() => setFilter('all')}><b>{users.length}</b><span>Total users</span></button>
        <button className={`card${filter === 'active' ? ' selected' : ''}`} onClick={() => setFilter('active')}><b>{users.filter((user) => user.lastLoginAt).length}</b><span>Users logged in</span></button>
        <button className={`card${filter === 'interviewed' ? ' selected' : ''}`} onClick={() => setFilter('interviewed')}><b>{users.reduce((sum, user) => sum + user.interviews, 0)}</b><span>Interviews completed</span></button>
      </div>
      {error && <div className="card admin-action-panel"><p>{error}</p></div>}
      {selected && <div className="card admin-action-panel">
        <h3>{selected.name}</h3><p className="muted">{selected.email} · {selected.role} · {selected.lastLoginAt ? 'Has logged in' : 'Registered'}</p><p>{selected.interviews} interviews completed · Joined {joinedDate(selected.joinedAt)} · Last login {selected.lastLoginAt ? joinedDate(selected.lastLoginAt) : 'Not recorded yet'}</p><button className="btn ghost sm" onClick={() => setSelected(null)}>Close</button>
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
              <td>{user.role}</td><td>{user.interviews}</td><td><span className={`pill ${user.lastLoginAt ? 'g' : 'a'}`}>{user.lastLoginAt ? 'Logged in' : 'Registered'}</span></td><td>{joinedDate(user.joinedAt)}</td>
              <td><button type="button" className="act" onClick={() => setSelected(user)}>View</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  )
}

function CompaniesPage({ companies, questions, onUpdate }) {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const questionCount = (company) => questions.filter((question) => question.company === company.name).length
  const sessionCount = (company) => getSessionHistory().filter((session) => session.company === company.name).length
  const visibleCompanies = companies.filter((company) => filter === 'questions' ? questionCount(company) > 0 : filter === 'sessions' ? sessionCount(company) > 0 : true)

  return (
    <>
      <AdminHeader eyebrow="Question targeting" title="Companies" />
      <div className="admin-summary">
        <button className={`card${filter === 'all' ? ' selected' : ''}`} onClick={() => setFilter('all')}><b>{companies.length}</b><span>Companies</span></button>
        <button className={`card${filter === 'questions' ? ' selected' : ''}`} onClick={() => setFilter('questions')}><b>{questions.filter((question) => question.company !== 'All').length}</b><span>Company-specific questions</span></button>
        <button className={`card${filter === 'sessions' ? ' selected' : ''}`} onClick={() => setFilter('sessions')}><b>{getSessionHistory().length}</b><span>Practice sessions</span></button>
      </div>
      {(selected || editing) && <div className="card admin-action-panel">
        {editing ? <form onSubmit={(event) => { event.preventDefault(); onUpdate(editing); setSelected(editing); setEditing(null) }}><h3>Edit company</h3><div className="g3">
          <div className="field"><label>Name</label><input className="inp" value={editing.name} readOnly /></div>
          <div className="field"><label>Interview style</label><input className="inp" value={editing.style} onChange={(e) => setEditing({ ...editing, style: e.target.value })} /></div>
          <div className="field"><label>Status</label><select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}><option>Active</option><option>Disabled</option></select></div>
        </div><div className="admin-form-actions"><button className="btn">Save changes</button><button type="button" className="btn ghost" onClick={() => setEditing(null)}>Cancel</button></div></form>
          : <><h3>{selected.name}</h3><p>{selected.style}</p><p className="muted">{questionCount(selected)} available questions · {sessionCount(selected)} sessions · {selected.status}</p><button className="btn ghost sm" onClick={() => setSelected(null)}>Close</button></>}
      </div>}
      <div className="admin-table-wrap"><table className="adm">
        <thead><tr><th>ID</th><th>Company</th><th>Interview style</th><th>Questions</th><th>Sessions</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{visibleCompanies.map((company) => (
          <tr key={company.id}><td>{company.id}</td><td><b>{company.name}</b></td><td>{company.style}</td>
            <td>{questionCount(company)}</td><td>{sessionCount(company)}</td>
            <td><span className={`pill ${company.status === 'Active' ? 'g' : 'c'}`}>{company.status}</span></td><td><button type="button" className="act" onClick={() => { setSelected(company); setEditing(null) }}>View</button><button type="button" className="act" onClick={() => { setEditing({ ...company }); setSelected(null) }}>Edit</button><button type="button" className="act del" onClick={() => onUpdate({ ...company, status: company.status === 'Active' ? 'Disabled' : 'Active' })}>{company.status === 'Active' ? 'Disable' : 'Enable'}</button></td></tr>
        ))}</tbody>
      </table></div>
    </>
  )
}

function QuestionsPage({ questions, companies, loading, loadError, onAdd, onUpdate, onDelete, onLoad }) {
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

  const submit = async (event) => {
    event.preventDefault()
    const rubricLines = form.rubrics.split('\n').map((line) => line.trim()).filter(Boolean)
    if (!form.prompt.trim() || !form.topic.trim() || !form.model.trim() || rubricLines.length !== 5) {
      setFormError('Question, topic, model answer, and exactly five rubric criteria are required.')
      return
    }
    if (!isTextAnswerable(form.prompt)) {
      setFormError('This question requests a non-text task. Rewrite it so the candidate can answer entirely in writing.')
      return
    }
    const baseWeight = Math.floor(100 / rubricLines.length)
    const concepts = rubricLines.map((line, index) => {
      const parts = line.split('|').map((part) => part.trim()).filter(Boolean)
      const label = parts[0]
      const alternatives = parts.slice(1)
      return {
        label,
        description: `Evaluates whether the answer clearly covers ${label.toLowerCase()}.`,
        expectedEvidence: `The answer demonstrates ${label.toLowerCase()} with a relevant explanation or example.`,
        acceptableAlternatives: alternatives.join(', '),
        keywords: parts.join(','),
        semanticDescription: `Evidence that demonstrates ${label.toLowerCase()}, including equivalent terminology.`,
        importance: index < 3 ? 'CORE' : 'SUPPORTING',
        rubricVersion: 2,
        evidenceStatus: 'DRAFT',
        weight: index === rubricLines.length - 1 ? 100 - baseWeight * (rubricLines.length - 1) : baseWeight,
        evidenceGroups: [
          { concept: label, description: `Direct evidence for ${label}.`, terms: [{ type: 'TERM', value: label }] },
          { concept: `Accepted alternatives for ${label}`, description: `Equivalent evidence for ${label}.`, terms: (alternatives.length ? alternatives : [`valid alternative for ${label}`]).map((value) => ({ type: 'ALTERNATIVE', value })) },
        ],
      }
    })
    try {
      await onAdd({ ...form, prompt: form.prompt.trim(), topic: form.topic.trim(), expectedAnswerSummary: form.model.trim(), reviewStatus: 'Review', concepts })
      setForm({ prompt: '', role: 'Software Engineer', company: 'All', type: 'Technical', topic: '', difficulty: 'Medium', rubrics: '', model: '' })
      setFormError('')
      setShowForm(false)
    } catch (error) {
      setFormError(error.message || 'Could not save the question.')
    }
  }

  const openQuestion = async (question, mode) => {
    try {
      const detailed = await onLoad(question.id)
      if (mode === 'edit') { setEditing(detailed); setSelected(null) } else { setSelected(detailed); setEditing(null) }
      setFormError('')
    } catch (error) {
      setFormError(error.message || 'Could not load question details.')
    }
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
            <div className="field"><label>Interview type</label><select value={form.type} onChange={(event) => update('type', event.target.value)}>{INTERVIEW_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
            <div className="field"><label>Topic</label><input className="inp" value={form.topic} onChange={(event) => update('topic', event.target.value)} placeholder="e.g. Databases" required /></div>
            <div className="field"><label>Difficulty</label><select value={form.difficulty} onChange={(event) => update('difficulty', event.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
          </div>
          <div className="g2">
            <div className="field"><label>Expected rubric concepts</label><textarea value={form.rubrics} onChange={(event) => update('rubrics', event.target.value)} placeholder={'Exactly five criteria, one per line\nCaching | Redis | cache\nInvalidation | TTL | expiry'} required /></div>
            <div className="field"><label>Model answer outline</label><textarea value={form.model} onChange={(event) => update('model', event.target.value)} placeholder={'One outline point per line\nClarify requirements\nExplain the approach'} /></div>
          </div>
          <p className="muted admin-help">Answer format: Written response. Use | to add accepted synonyms. Rubric weights are distributed equally and total 100%.</p>
          <div className="admin-form-actions"><button className="btn" type="submit">Save question</button><button className="btn ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button></div>
        </form>
      )}
      {loadError && <div className="card admin-action-panel"><p>{loadError}</p></div>}
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
          <option>All types</option>{INTERVIEW_TYPES.map((type) => <option key={type}>{type}</option>)}
        </select>
      </div>
      {(selected || editing) && <div className="card admin-action-panel">
        {editing ? <form onSubmit={async (event) => {
          event.preventDefault()
          if (!isTextAnswerable(editing.prompt)) { setFormError('Question must be answerable using text only.'); return }
          if (editing.concepts.reduce((sum, item) => sum + Number(item.weight), 0) !== 100) { setFormError('Rubric weights must total 100%.'); return }
          try { const updated = await onUpdate(editing); setSelected(updated); setEditing(null); setFormError('') } catch (error) { setFormError(error.message || 'Could not update the question.') }
        }}><h3>Edit question, rubric, and evidence</h3>
          <div className="field"><label>Question</label><textarea value={editing.prompt} onChange={(event) => setEditing({ ...editing, prompt: event.target.value })} /></div>
          <div className="g3">
            <div className="field"><label>Role</label><select value={editing.role} onChange={(event) => setEditing({ ...editing, role: event.target.value })}>{ROLES.map((role) => <option key={role}>{role}</option>)}</select></div>
            <div className="field"><label>Company</label><select value={editing.company} onChange={(event) => setEditing({ ...editing, company: event.target.value })}><option>All</option>{companies.map((company) => <option key={company.id}>{company.name}</option>)}</select></div>
            <div className="field"><label>Interview type</label><select value={editing.type} onChange={(event) => setEditing({ ...editing, type: event.target.value })}>{INTERVIEW_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
            <div className="field"><label>Topic</label><input className="inp" value={editing.topic} onChange={(event) => setEditing({ ...editing, topic: event.target.value })} /></div>
            <div className="field"><label>Difficulty</label><select value={editing.difficulty} onChange={(event) => setEditing({ ...editing, difficulty: event.target.value })}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
            <div className="field"><label>Review status</label><select value={editing.reviewStatus} onChange={(event) => setEditing({ ...editing, reviewStatus: event.target.value })}><option>Draft</option><option>Review</option><option>Approved</option></select></div>
          </div>
          <div className="field"><label>Expected answer summary</label><textarea value={editing.expectedAnswerSummary} onChange={(event) => setEditing({ ...editing, expectedAnswerSummary: event.target.value })} /></div>
          <EvidenceRubricEditor rubrics={editing.concepts} onChange={(concepts) => setEditing({ ...editing, concepts })} />
          {formError && <p className="admin-form-error" role="alert">{formError}</p>}
          <div className="admin-form-actions"><button className="btn">Save and validate</button><button type="button" className="btn ghost" onClick={() => setEditing(null)}>Cancel</button></div>
        </form> : <>
          <div className="admin-detail-heading"><div><h3>{selected.prompt}</h3><p className="muted">{selected.role} · {selected.company} · {selected.type} · {selected.difficulty}</p></div><span className={`pill ${selected.reviewStatus === 'Approved' ? 'g' : 'a'}`}>{selected.reviewStatus}</span></div>
          <p><b>Expected answer:</b> {selected.expectedAnswerSummary}</p>
          <h4 className="evidence-section-title">Rubric and evidence</h4>
          {selected.concepts.map((item, index) => <details className="evidence-criterion evidence-readonly" key={item.id || index}>
            <summary><b>{index + 1}. {item.label}</b><span>{item.importance} · {item.weight}% · {item.evidenceStatus}</span></summary>
            <div className="evidence-criterion-body"><p>{item.expectedEvidence}</p>{item.evidenceGroups.map((group, groupIndex) => <div className="evidence-group" key={group.id || groupIndex}><b>{group.concept}</b><p>{group.description}</p><ul>{group.terms.map((term) => <li key={term.id || `${term.type}-${term.value}`}><span className={`evidence-term-type ${term.type.toLowerCase()}`}>{term.type}</span> {term.value}</li>)}</ul></div>)}</div>
          </details>)}
          {formError && <p className="admin-form-error" role="alert">{formError}</p>}
          <div className="admin-form-actions"><button className="btn ghost sm" onClick={() => setSelected(null)}>Close</button><button className="btn ghost sm" onClick={() => { setEditing(selected); setSelected(null) }}>Edit evidence</button>{selected.reviewStatus !== 'Approved' && <button className="btn sm" onClick={async () => { try { const approved = await onUpdate({ ...selected, reviewStatus: 'Approved' }); setSelected(approved); setFormError('') } catch (error) { setFormError(error.message || 'Could not approve this question.') } }}>Approve</button>}</div>
        </>}
      </div>}
      <div className="admin-table-wrap"><table className="adm">
        <thead><tr><th>ID</th><th>Question</th><th>Role</th><th>Company</th><th>Type</th><th>Status</th><th>Difficulty</th><th>Rubrics</th><th>Actions</th></tr></thead>
        <tbody>{loading ? <tr><td colSpan="9">Loading database questions…</td></tr> : pageQuestions.length === 0 ? <tr><td colSpan="9">No database questions found.</td></tr> : pageQuestions.map((question) => (
          <tr key={question.id}><td>#{String(question.id).padStart(4, '0')}</td><td className="admin-question-cell">{question.prompt}<div className="admin-subtext">{question.topic}</div></td>
            <td>{question.role}</td><td>{question.company}</td><td>{question.type}</td><td><span className={`pill ${question.reviewStatus === 'Approved' ? 'g' : 'a'}`}>{question.reviewStatus}</span></td><td><span className={`pill ${question.difficulty === 'Hard' ? 'c' : question.difficulty === 'Easy' ? 'g' : 'a'}`}>{question.difficulty}</span></td>
            <td>{question.concepts.length}</td><td><button type="button" className="act" onClick={() => openQuestion(question, 'view')}>View</button><button type="button" className="act" onClick={() => openQuestion(question, 'edit')}>Edit</button><button type="button" className="act del" onClick={() => onDelete(question.id)}>Retire</button></td></tr>
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
  const [questions, setQuestions] = useState([])
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [questionsError, setQuestionsError] = useState('')
  const title = section === 'companies' ? 'Manage companies' : section === 'questions' ? 'Manage questions' : 'Manage users'

  const updateCompany = (company) => {
    const next = companies.map((item) => item.id === company.id ? company : item)
    saveCompanies(next)
    setCompanies(next)
  }
  useEffect(() => {
    let active = true
    apiGet('/admin/questions')
      .then((data) => {
        if (!active) return
        setQuestions((Array.isArray(data) ? data : []).map(fromDatabaseQuestion))
        setQuestionsError('')
      })
      .catch((error) => { if (active) setQuestionsError(error.message || 'Could not load database questions.') })
      .finally(() => { if (active) setQuestionsLoading(false) })
    return () => { active = false }
  }, [])

  const addQuestion = async (question) => {
    const saved = fromDatabaseQuestion(await apiPost('/admin/questions', toDatabaseQuestion(question)))
    setQuestions((current) => [...current, saved])
    return saved
  }
  const updateQuestion = async (question) => {
    const saved = fromDatabaseQuestion(await apiPut(`/admin/questions/${question.id}`, toDatabaseQuestion(question)))
    setQuestions((current) => current.map((item) => item.id === saved.id ? saved : item))
    return saved
  }
  const loadQuestion = async (id) => fromDatabaseQuestion(await apiGet(`/admin/questions/${id}`))
  const removeQuestion = async (id) => {
    await apiDelete(`/admin/questions/${id}`)
    setQuestions((current) => current.filter((question) => question.id !== id))
  }

  return (
    <section className="screen" id="admin">
      <TopBar subtitle={title} nav={ADMIN_NAV} showUser avatarStyle={{ background: 'linear-gradient(140deg,#C77E24,#e0a758)' }} />
      <div className="wrap pagepad">
        {section === 'companies'
          ? <CompaniesPage companies={companies} questions={questions} onUpdate={updateCompany} />
          : section === 'questions'
            ? <QuestionsPage questions={questions} companies={companies} loading={questionsLoading} loadError={questionsError} onAdd={addQuestion} onUpdate={updateQuestion} onDelete={removeQuestion} onLoad={loadQuestion} />
            : <UsersPage />}
      </div>
    </section>
  )
}
