const SESSION_HISTORY_KEY = 'aceinterview_session_history'

export const DEFAULT_SESSIONS = [
  { id: 'seed-1', date: 'Aug 23, 2026', completedAt: '2026-08-23T10:00:00Z', role: 'Software Engineer', type: 'Technical', company: 'Google', score: 82 },
  { id: 'seed-2', date: 'Aug 20, 2026', completedAt: '2026-08-20T10:00:00Z', role: 'Frontend Developer', type: 'Technical', company: 'Microsoft', score: 76 },
  { id: 'seed-3', date: 'Aug 18, 2026', completedAt: '2026-08-18T10:00:00Z', role: 'Backend Developer', type: 'System Design', company: 'Amazon', score: 71 },
  { id: 'seed-4', date: 'Aug 15, 2026', completedAt: '2026-08-15T10:00:00Z', role: 'Software Engineer', type: 'Behavioral', company: 'Spotify', score: 74 },
  { id: 'seed-5', date: 'Aug 12, 2026', completedAt: '2026-08-12T10:00:00Z', role: 'Backend Developer', type: 'Technical', company: 'Stripe', score: 70 },
  { id: 'seed-6', date: 'Aug 9, 2026', completedAt: '2026-08-09T10:00:00Z', role: 'Frontend Developer', type: 'Behavioral', company: 'Airbnb', score: 68 },
  { id: 'seed-7', date: 'Aug 6, 2026', completedAt: '2026-08-06T10:00:00Z', role: 'Software Engineer', type: 'System Design', company: 'Meta', score: 66 },
  { id: 'seed-8', date: 'Aug 3, 2026', completedAt: '2026-08-03T10:00:00Z', role: 'Backend Developer', type: 'Behavioral', company: 'Netflix', score: 69 },
  { id: 'seed-9', date: 'Jul 30, 2026', completedAt: '2026-07-30T10:00:00Z', role: 'Mobile Developer', type: 'Technical', company: 'Apple', score: 65 },
  { id: 'seed-10', date: 'Jul 27, 2026', completedAt: '2026-07-27T10:00:00Z', role: 'Software Engineer', type: 'System Design', company: 'Uber', score: 56 },
  { id: 'seed-11', date: 'Jul 24, 2026', completedAt: '2026-07-24T10:00:00Z', role: 'Data Scientist', type: 'Technical', company: 'Google', score: 50 },
]

export function getSessionHistory() {
  if (typeof localStorage === 'undefined') return DEFAULT_SESSIONS
  try {
    const stored = JSON.parse(localStorage.getItem(SESSION_HISTORY_KEY)) || []
    return [...stored, ...DEFAULT_SESSIONS.filter((seed) => !stored.some((item) => item.id === seed.id))]
      .sort((a, b) => new Date(b.completedAt || b.date) - new Date(a.completedAt || a.date))
  } catch {
    return DEFAULT_SESSIONS
  }
}

export function addSessionResult(result) {
  const history = getSessionHistory().filter((item) => !String(item.id).startsWith('seed-'))
  const summary = {
    id: result.id || `session-${Date.now()}`,
    date: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(result.completedAt || Date.now())),
    completedAt: result.completedAt || new Date().toISOString(),
    role: result.role,
    type: result.type || 'Technical',
    company: result.company,
    score: result.overallScore,
    result,
  }
  localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify([summary, ...history]))
}

export { SESSION_HISTORY_KEY }
