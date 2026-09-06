export const COMPANIES = Object.freeze([
  Object.freeze({ name: 'Google', letter: 'G', color: '#4285F4', style: 'Structured reasoning, algorithms, and scalable systems' }),
  Object.freeze({ name: 'Microsoft', letter: 'M', color: '#00A4EF', style: 'Collaboration, product thinking, and practical engineering' }),
  Object.freeze({ name: 'Amazon', letter: 'A', color: '#FF9900', style: 'Leadership principles, ownership, and customer obsession' }),
  Object.freeze({ name: 'Apple', letter: 'A', color: '#111111', style: 'Product quality, privacy, and platform fundamentals' }),
  Object.freeze({ name: 'Meta', letter: 'M', color: '#0866FF', style: 'Product impact, execution speed, and high-scale systems' }),
])

export const TECH_ROLES = Object.freeze([
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full-Stack Developer',
  'Data Scientist',
  'ML / AI Engineer',
  'Cloud / DevOps Engineer',
  'Mobile Developer',
  'Cybersecurity Analyst',
  'QA / Test Engineer',
])

export const INTERVIEW_TYPES = Object.freeze(['Technical', 'Behavioral', 'System Design'])
export const DIFFICULTIES = Object.freeze(['Easy', 'Medium', 'Hard'])
export const QUESTION_SOURCES = Object.freeze(['SHARED', 'COMPANY_SPECIFIC'])
export const CONTENT_STATUSES = Object.freeze(['Draft', 'Review', 'Approved', 'Retired'])

export const COMPANY_NAMES = Object.freeze(COMPANIES.map((company) => company.name))

export function isCompany(value) {
  return COMPANY_NAMES.includes(value)
}

export function isTechRole(value) {
  return TECH_ROLES.includes(value)
}

export function isInterviewType(value) {
  return INTERVIEW_TYPES.includes(value)
}

export function isDifficulty(value) {
  return DIFFICULTIES.includes(value)
}
