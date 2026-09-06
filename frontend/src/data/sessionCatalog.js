import { accountStorageKey } from '../utils/accountStorage.js'

const SESSION_HISTORY_KEY = 'aceinterview_session_history'

export const DEFAULT_SESSIONS = []

export function getSessionHistory() {
  if (typeof localStorage === 'undefined') return DEFAULT_SESSIONS
  try {
    const stored = JSON.parse(localStorage.getItem(accountStorageKey(SESSION_HISTORY_KEY))) || []
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
  localStorage.setItem(accountStorageKey(SESSION_HISTORY_KEY), JSON.stringify([summary, ...history]))
}

export function removeSessionResult(sessionId) {
  if (typeof localStorage === 'undefined') return
  const history = getSessionHistory().filter((item) =>
    !String(item.id).startsWith('seed-') && String(item.id) !== String(sessionId)
  )
  localStorage.setItem(accountStorageKey(SESSION_HISTORY_KEY), JSON.stringify(history))
}

export { SESSION_HISTORY_KEY }
