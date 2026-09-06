import { getSessionHistory } from '../data/sessionCatalog.js'
import { accountStorageKey } from './accountStorage.js'

const SYNCED_KEY = 'aceinterview_synced_local_sessions'

function getSyncedIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(accountStorageKey(SYNCED_KEY))) || [])
  } catch {
    return new Set()
  }
}

export function getUnsyncedLocalSessions() {
  const synced = getSyncedIds()
  return getSessionHistory().filter((session) =>
    !String(session.id).startsWith('seed-') && !synced.has(String(session.id))
  )
}

export async function syncLocalCompletedSessions() {
  const localOnly = getUnsyncedLocalSessions().filter((session) => String(session.id).startsWith('local-'))
  // Legacy browser-only sessions were created from a different question set,
  // so they cannot be attached safely to a new server-owned session. Keep them
  // visible locally without creating abandoned IN_PROGRESS server sessions.
  return { skippedLegacySessions: localOnly.length }
}
