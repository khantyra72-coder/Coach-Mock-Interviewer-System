import { addSessionResult } from '../data/sessionCatalog.js'

const ACTIVE_SESSION_KEY = 'aceinterview_active_session'
const LAST_RESULT_KEY = 'aceinterview_last_result'

export function saveActiveSession(session) {
  localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session))
}

export function getActiveSession() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_SESSION_KEY))
  } catch {
    return null
  }
}

export function clearActiveSession() {
  localStorage.removeItem(ACTIVE_SESSION_KEY)
}

export function saveLastResult(result) {
  localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result))
  addSessionResult(result)
}

export function getLastResult() {
  try {
    return JSON.parse(localStorage.getItem(LAST_RESULT_KEY))
  } catch {
    return null
  }
}
