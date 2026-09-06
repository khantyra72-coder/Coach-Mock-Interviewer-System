import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BarChart3, Code2, Database, Monitor, Search } from 'lucide-react'
import { FaAmazon, FaApple, FaMeta, FaMicrosoft } from 'react-icons/fa6'
import TopBar from '../components/TopBar.jsx'
import googleLogo from '../assets/logos/google.svg'
import { getCompanies } from '../data/companyCatalog.js'
import { INTERVIEW_TYPES, TECH_ROLES } from '../data/interviewTaxonomy.js'
import {
  getInterviewDetails,
  getInterviewHistory,
} from '../api/interviews.js'
import { getUnsyncedLocalSessions, syncLocalCompletedSessions } from '../utils/syncLocalInterviewHistory.js'

const APP_NAV = [
  { label: 'Interview Setup', to: '/role' },
  { label: 'My Sessions', to: '/sessions' },
  { label: 'Progress Report', to: '/progress' },
]

const PAGE_SIZE = 6

const ROLE_ICONS = {
  'Software Engineer': { icon: Code2, className: 'software' },
  'Frontend Developer': { icon: Monitor, className: 'frontend' },
  'Backend Developer': { icon: Database, className: 'backend' },
  'Data Scientist': { icon: BarChart3, className: 'data' },
}

const COMPANY_ICONS = {
  Google: { image: googleLogo },
  Microsoft: { icon: FaMicrosoft, color: '#00a4ef' },
  Amazon: { icon: FaAmazon, color: '#ff9900' },
  Meta: { icon: FaMeta, color: '#0866ff' },
  Apple: { icon: FaApple, color: '#111' },
}

function RoleCell({ role }) {
  const roleStyle = ROLE_ICONS[role] || ROLE_ICONS['Software Engineer']
  const RoleIcon = roleStyle.icon
  return (
    <span className="ass-role-cell">
      <span className={`ass-role-icon ${roleStyle.className}`}><RoleIcon size={15} strokeWidth={1.8} /></span>
      <span>{role}</span>
    </span>
  )
}

function CompanyCell({ company }) {
  const companyStyle = COMPANY_ICONS[company]
  const CompanyIcon = companyStyle?.icon
  return (
    <span className="ass-company-cell">
      {companyStyle?.image
        ? <img src={companyStyle.image} alt="" />
        : CompanyIcon
          ? <CompanyIcon size={18} color={companyStyle.color} aria-hidden="true" />
          : <span className="ass-company-fallback">{company.slice(0, 1)}</span>}
      <span>{company}</span>
    </span>
  )
}

function average(items) {
  return Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length)
}

function splitText(value, fallback) {
  if (!value) return fallback ? [fallback] : []
  return value
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
}

function convertBackendSession(session, details) {
  const result = details.result
  const overallScore = result?.overallScore ?? 0
  let savedResult = null
  try {
    savedResult = result?.resultDetails ? JSON.parse(result.resultDetails) : null
  } catch {
    savedResult = null
  }

  if (savedResult && Array.isArray(savedResult.breakdown) && Array.isArray(savedResult.topStrengths)
    && Array.isArray(savedResult.topImprovements) && Array.isArray(savedResult.questions)) {
    const completedAt = session.completedAt || session.startedAt
    return {
      id: session.id,
      date: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(completedAt)),
      completedAt,
      role: session.role,
      type: session.interviewType,
      company: session.company || 'Not specified',
      level: session.experienceLevel || 'Not specified',
      score: overallScore,
      result: { ...savedResult, id: session.id, completedAt },
    }
  }

  const frontendResult = {
    id: session.id,
    completedAt: session.completedAt || session.startedAt,
    role: session.role,
    company: session.company || 'Not specified',
    level: session.experienceLevel || 'Not specified',
    type: session.interviewType,
    answeredCount: details.answers.length,
    questionCount: details.answers.length,
    overallScore,
    message: result?.summaryFeedback || 'Interview completed.',
    breakdown: [
      { label: 'Overall score', value: overallScore },
      { label: 'Technical depth', value: result?.technicalScore },
      { label: 'Behavioral structure', value: result?.behavioralScore },
      { label: 'Concept completion', value: result?.conceptScore },
    ].filter((item) => Number.isFinite(item.value)),
    skillScores: {
      algorithm: result?.algorithmScore ?? null,
      communication: result?.communicationScore ?? null,
      problemSolving: result?.problemSolvingScore ?? null,
      systemDesign: result?.systemDesignScore ?? null,
    },
    topStrengths: splitText(
      result?.strengths,
      'Completed the interview'
    ),
    topImprovements: splitText(
      result?.improvements,
      'Continue practising'
    ),
    questions: details.answers.map((answer, index) => ({
      n: index + 1,
      questionId: answer.questionId,
      text: answer.questionText,
      answer: answer.answerText,
      score: answer.score,
      strengths: splitText(answer.coveredConcepts),
      weaknesses: splitText(answer.missingConcepts),
      suggestion: answer.feedback || 'No saved feedback is available for this older answer.',
      model: null,
    })),
  }

  return {
    id: session.id,
    date: new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(session.completedAt || session.startedAt)),
    completedAt: session.completedAt || session.startedAt,
    role: session.role,
    type: session.interviewType,
    company: session.company || 'Not specified',
    score: overallScore,
    result: frontendResult,
  }
}

export default function AllSessions() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const showingRoles = searchParams.get('view') === 'roles'
  const selectedRole = searchParams.get('role')
  const [sessions, setSessions] = useState([])
const [loading, setLoading] = useState(true)
const [loadError, setLoadError] = useState('')
useEffect(() => {
  let cancelled = false

  async function loadSessions() {
    try {
      await syncLocalCompletedSessions()
      const history = await getInterviewHistory()
      const completed = history.filter(
        (session) => session.status === 'COMPLETED'
      )

      const sessionsWithDetails = await Promise.all(
        completed.map(async (session) => {
          const details = await getInterviewDetails(session.id)
          return convertBackendSession(session, details)
        })
      )

      const backendIds = new Set(sessionsWithDetails.map((session) => String(session.id)))
      const localOnly = getUnsyncedLocalSessions().filter((session) =>
        !backendIds.has(String(session.id))
      )
      if (!cancelled) {
        setSessions([...sessionsWithDetails, ...localOnly])
      }
    } catch (error) {
      if (!cancelled) {
        setSessions(getUnsyncedLocalSessions())
        setLoadError(
          error.message || 'Could not sync interview history with the server.'
        )
      }
    } finally {
      if (!cancelled) setLoading(false)
    }
  }

  loadSessions()

  return () => {
    cancelled = true
  }
}, [])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All roles')
  const [typeFilter, setTypeFilter] = useState('All interview types')
  const [companyFilter, setCompanyFilter] = useState('All companies')
  const [sort, setSort] = useState('Newest first')
  const [page, setPage] = useState(1)
  const roles = useMemo(
    () => [...new Set(sessions.map((session) => session.role).filter(Boolean))],
    [sessions]
  )
  const roleSummaries = useMemo(() => roles.map((role) => {
    const roleSessions = sessions.filter((session) => session.role === role)
    return {
      role,
      interviews: roleSessions.length,
      average: average(roleSessions),
      best: Math.max(...roleSessions.map((session) => session.score)),
    }
  }), [roles, sessions])

  const visibleSessions = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filteredSessions = sessions.filter((session) => {
      if (selectedRole && session.role !== selectedRole) return false
      if (roleFilter !== 'All roles' && session.role !== roleFilter) return false
      if (typeFilter !== 'All interview types' && session.type !== typeFilter) return false
      if (companyFilter !== 'All companies' && session.company !== companyFilter) return false
      if (!query) return true
      return [session.date, session.role, session.type, session.company]
        .some((value) => value.toLowerCase().includes(query))
    })

    return [...filteredSessions].sort((a, b) => {
      if (sort === 'Oldest first') return new Date(a.completedAt) - new Date(b.completedAt)
      if (sort === 'Highest score') return b.score - a.score
      if (sort === 'Lowest score') return a.score - b.score
      return new Date(b.completedAt) - new Date(a.completedAt)
    })
  }, [companyFilter, roleFilter, search, selectedRole, sessions, sort, typeFilter])

  const pageCount = Math.max(1, Math.ceil(visibleSessions.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageSessions = visibleSessions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const updateFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  return (
    <section className="screen" id="allsessions">
      <TopBar nav={APP_NAV} showUser />
      <div className="wrap pagepad">
        {loading && <p className="sub muted">Loading interview history…</p>}

{loadError && (
  <p className="field-error">
    {loadError}
  </p>
)}

        {showingRoles && !selectedRole ? (
          <>
            <h1 className="h-title">Roles practiced</h1>
            <p className="sub muted" style={{ marginTop: 6, marginBottom: 20 }}>
              You have practiced {roles.length} role{roles.length === 1 ? '' : 's'} across{' '}
              {sessions.length} interview{sessions.length === 1 ? '' : 's'}.
            </p>
            <div className="ass-role-grid">
              {roleSummaries.map((summary) => (
                <button
                  type="button"
                  className="card ass-role-card"
                  key={summary.role}
                  onClick={() => setSearchParams({ view: 'roles', role: summary.role })}
                >
                  <span className="ass-role-name">{summary.role}</span>
                  <span><b>{summary.interviews}</b> interview{summary.interviews === 1 ? '' : 's'}</span>
                  <span><b>{summary.average}%</b> average</span>
                  <span><b>{summary.best}%</b> best</span>
                  <span className="ass-role-link">View interviews →</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="h-title" style={{ marginBottom: 6 }}>
              {selectedRole ? `${selectedRole} interviews` : 'All interviews'}
            </h1>
            <p className="sub muted" style={{ marginBottom: 20 }}>
              {visibleSessions.length} completed interview{visibleSessions.length === 1 ? '' : 's'}
            </p>
            <div className="card ass-history">
              <div className="ass-filters">
                <label className="ass-search">
                  <Search size={17} strokeWidth={1.8} />
                  <input
                    type="search"
                    value={search}
                    onChange={updateFilter(setSearch)}
                    placeholder="Search sessions"
                    aria-label="Search sessions"
                  />
                </label>
                <select value={roleFilter} onChange={updateFilter(setRoleFilter)} aria-label="Filter by role">
                  <option>All roles</option>
                  {TECH_ROLES.map((role) => <option key={role}>{role}</option>)}
                </select>
                <select value={typeFilter} onChange={updateFilter(setTypeFilter)} aria-label="Filter by interview type">
                  <option>All interview types</option>
                  {INTERVIEW_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
                <select value={companyFilter} onChange={updateFilter(setCompanyFilter)} aria-label="Filter by company">
                  <option>All companies</option>
                  {getCompanies().filter((company) => company.status === 'Active').map((company) => <option key={company.id}>{company.name}</option>)}
                </select>
                <select value={sort} onChange={updateFilter(setSort)} aria-label="Sort sessions">
                  <option>Newest first</option>
                  <option>Oldest first</option>
                  <option>Highest score</option>
                  <option>Lowest score</option>
                </select>
              </div>

              <div className="ass-table-wrap">
                <table className="ass-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Role</th>
                      <th>Interview type</th>
                      <th>Company</th>
                      <th>Score</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageSessions.map((session) => (
                      <tr key={session.id}>
                        <td>{session.date}</td>
                        <td><RoleCell role={session.role} /></td>
                        <td>{session.type}</td>
                        <td><CompanyCell company={session.company} /></td>
                        <td><span className={`ass-score${session.score < 75 ? ' amber' : ''}`}>{session.score}%</span></td>
                        <td>
                          <button
  className="ass-results"
  type="button"
  onClick={() =>
    navigate('/results', { state: { result: session.result } })
  }
>
  View results <span aria-hidden="true">→</span>
</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!pageSessions.length && <div className="ass-empty">No sessions match these filters.</div>}
              </div>

              <div className="ass-pagination">
                <span>
                  Showing {visibleSessions.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(currentPage * PAGE_SIZE, visibleSessions.length)} of {visibleSessions.length} sessions
                </span>
                <div>
                  {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                    <button
                      type="button"
                      className={currentPage === pageNumber ? 'active' : undefined}
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))} aria-label="Next page">→</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
