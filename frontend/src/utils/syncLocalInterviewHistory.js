import { getSessionHistory } from '../data/sessionCatalog.js'
import { completeInterview, startInterview } from '../api/interviews.js'

const SYNCED_KEY = 'aceinterview_synced_local_sessions'

function getSyncedIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SYNCED_KEY)) || [])
  } catch {
    return new Set()
  }
}

function markSynced(id) {
  const ids = getSyncedIds()
  ids.add(String(id))
  localStorage.setItem(SYNCED_KEY, JSON.stringify([...ids]))
}

export function getUnsyncedLocalSessions() {
  const synced = getSyncedIds()
  return getSessionHistory().filter((session) =>
    !String(session.id).startsWith('seed-') && !synced.has(String(session.id))
  )
}

export async function syncLocalCompletedSessions() {
  const localOnly = getUnsyncedLocalSessions().filter((session) => String(session.id).startsWith('local-'))
  for (const session of localOnly) {
    try {
      const backendSession = await startInterview({
        role: session.role || 'Software Engineer',
        interviewType: session.type || 'Technical',
        company: session.company || null,
      })
      const result = session.result || {}
      await completeInterview(backendSession.id, {
        overallScore: session.score ?? result.overallScore ?? 0,
        strengths: (result.topStrengths || []).join('; ') || null,
        improvements: (result.topImprovements || []).join('; ') || null,
        summaryFeedback: result.message || 'Interview completed.',
      })
      markSynced(session.id)
    } catch {
      // Keep the browser copy visible and retry during the next page load.
    }
  }
}
