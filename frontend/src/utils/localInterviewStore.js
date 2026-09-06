import { addSessionResult, removeSessionResult } from '../data/sessionCatalog.js'
import { accountStorageKey } from './accountStorage.js'

const ACTIVE_SESSION_KEY = 'aceinterview_active_session'
const LAST_RESULT_KEY = 'aceinterview_last_result'

export function saveActiveSession(session) {
  localStorage.setItem(accountStorageKey(ACTIVE_SESSION_KEY), JSON.stringify(session))
}

export function getActiveSession() {
  try {
    return JSON.parse(localStorage.getItem(accountStorageKey(ACTIVE_SESSION_KEY)))
  } catch {
    return null
  }
}

export function clearActiveSession() {
  localStorage.removeItem(accountStorageKey(ACTIVE_SESSION_KEY))
}

export function saveLastResult(result) {
  localStorage.setItem(accountStorageKey(LAST_RESULT_KEY), JSON.stringify(result))
  addSessionResult(result)
}

export function getLastResult() {
  try {
    return JSON.parse(localStorage.getItem(accountStorageKey(LAST_RESULT_KEY)))
  } catch {
    return null
  }
}

export function deleteLocalCompletedSession(sessionId) {
  removeSessionResult(sessionId)
  const lastResult = getLastResult()
  if (lastResult && String(lastResult.id) === String(sessionId)) {
    localStorage.removeItem(accountStorageKey(LAST_RESULT_KEY))
  }
}
