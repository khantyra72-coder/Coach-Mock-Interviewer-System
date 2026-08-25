const API_BASE_URL = 'http://localhost:8080/api'

const TOKEN_KEY = 'aceinterview_token'
const USER_KEY = 'aceinterview_user'

// A 401 from these two endpoints just means "wrong email/password" — it's
// not a sign the user's session expired, so it must NOT clear storage or
// redirect (that would blow away the login form's own error handling).
const PUBLIC_PATHS = ['/login', '/register']

// status is 0 for network-level failures (server down, CORS, no connection —
// anything that never got back an HTTP response at all).
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

async function apiRequest(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Could not reach the server. Please check your connection and try again.', 0)
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    // Empty or non-JSON body — leave data as null, still fine for 2xx/no-content cases.
  }

  if (!response.ok) {
    if (response.status === 401 && !PUBLIC_PATHS.includes(path)) {
      // Token missing/expired/invalid on a protected route — the session is
      // no longer valid, so clear it and send the user back to log in.
      clearSession()
      window.location.href = '/login'
    }
    throw new ApiError(data?.message || 'Something went wrong. Please try again.', response.status)
  }

  return data
}

export function apiPost(path, body) {
  return apiRequest('POST', path, body)
}

export function apiGet(path) {
  return apiRequest('GET', path)
}
