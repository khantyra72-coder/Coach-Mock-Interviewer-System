import { apiGet, apiPut } from './client.js'

export function getMe() {
  return apiGet('/me')
}

export function updateProfile(data) {
  return apiPut('/me', data)
}

export function changePassword(data) {
  return apiPut('/me/password', data)
}
