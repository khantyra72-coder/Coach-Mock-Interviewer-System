const API_BASE_URL = 'http://localhost:8080/api'

// status is 0 for network-level failures (server down, CORS, no connection —
// anything that never got back an HTTP response at all).
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function apiRequest(method, path, body) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
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
