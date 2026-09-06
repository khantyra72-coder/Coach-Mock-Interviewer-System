import { apiDelete, apiGet, apiPost } from './client.js'

export function startInterview(data) {
  return apiPost('/interviews', data)
}

export function getInterviewQuestions() {
  return apiGet('/interviews/questions')
}

export function submitInterviewAnswer(sessionId, data) {
  return apiPost(`/interviews/${sessionId}/answers`, data)
}

export function completeInterview(sessionId, data) {
  return apiPost(`/interviews/${sessionId}/complete`, data)
}

export function getInterviewHistory() {
  return apiGet('/interviews')
}

export function getInterviewDetails(sessionId) {
  return apiGet(`/interviews/${sessionId}`)
}

export function deleteInterviewSession(sessionId) {
  return apiDelete(`/interviews/${sessionId}`)
}
