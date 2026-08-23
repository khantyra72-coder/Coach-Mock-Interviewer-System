const COMPANY_KEY = 'aceinterview_admin_companies'
const SELECTED_COMPANY_KEY = 'aceinterview_selected_company'
const DATA_EVENT = 'aceinterview:data-changed'

export const DEFAULT_COMPANIES = [
  { id: '#C01', name: 'Google', letter: 'G', color: '#4285F4', style: 'Structured reasoning, algorithms, and scalable systems', sessions: 2, status: 'Active' },
  { id: '#C02', name: 'Microsoft', letter: 'M', color: '#00A4EF', style: 'Collaboration, product thinking, and practical engineering', sessions: 1, status: 'Active' },
  { id: '#C03', name: 'Amazon', letter: 'A', color: '#FF9900', style: 'Leadership principles, ownership, and customer obsession', sessions: 1, status: 'Active' },
  { id: '#C04', name: 'Spotify', letter: 'S', color: '#1DB954', style: 'Autonomous teams, experimentation, and audio products', sessions: 1, status: 'Active' },
  { id: '#C05', name: 'Stripe', letter: 'S', color: '#635BFF', style: 'API quality, correctness, and financial infrastructure', sessions: 1, status: 'Active' },
  { id: '#C06', name: 'Airbnb', letter: 'A', color: '#FF385C', style: 'Marketplace trust, product craft, and belonging', sessions: 1, status: 'Active' },
  { id: '#C07', name: 'Meta', letter: 'M', color: '#0866FF', style: 'Product impact, execution speed, and high-scale systems', sessions: 1, status: 'Active' },
  { id: '#C08', name: 'Netflix', letter: 'N', color: '#E50914', style: 'Streaming reliability, judgment, and high ownership', sessions: 1, status: 'Active' },
  { id: '#C09', name: 'Apple', letter: 'A', color: '#111111', style: 'Product quality, privacy, and platform fundamentals', sessions: 1, status: 'Active' },
  { id: '#C10', name: 'Uber', letter: 'U', color: '#111111', style: 'Real-time systems, logistics, and operational scale', sessions: 1, status: 'Active' },
]

function normalizeCompany(company, index) {
  const name = company.name?.trim()
  return {
    id: company.id || `#C${String(index + 1).padStart(2, '0')}`,
    name,
    letter: company.letter || name?.slice(0, 1).toUpperCase() || '?',
    color: company.color || '#0E9E66',
    style: company.style || 'General technical and behavioral interview practice',
    sessions: Number(company.sessions) || 0,
    status: company.status || 'Active',
    custom: Boolean(company.custom),
  }
}

export function getCompanies() {
  if (typeof localStorage === 'undefined') return DEFAULT_COMPANIES
  try {
    const stored = JSON.parse(localStorage.getItem(COMPANY_KEY))
    if (!Array.isArray(stored)) return DEFAULT_COMPANIES

    const defaultsByName = new Map(DEFAULT_COMPANIES.map((company) => [company.name.toLowerCase(), company]))
    const byName = new Map(DEFAULT_COMPANIES.map((company, index) => [company.name.toLowerCase(), normalizeCompany(company, index)]))
    stored.forEach((company, index) => {
      const defaultCompany = defaultsByName.get(company.name?.trim().toLowerCase())
      const normalized = normalizeCompany({
        ...defaultCompany,
        ...company,
        color: defaultCompany?.color || company.color,
        letter: defaultCompany?.letter || company.letter,
      }, index)
      if (!normalized.name) return
      byName.set(normalized.name.toLowerCase(), normalized)
    })
    return [...byName.values()]
  } catch {
    return DEFAULT_COMPANIES
  }
}

export function saveCompanies(companies) {
  localStorage.setItem(COMPANY_KEY, JSON.stringify(companies.map(normalizeCompany)))
  window.dispatchEvent(new CustomEvent(DATA_EVENT, { detail: { type: 'companies' } }))
}

export function getSelectedCompany() {
  if (typeof localStorage === 'undefined') return 'Google'
  const selected = localStorage.getItem(SELECTED_COMPANY_KEY)
  return getCompanies().some((company) => company.name === selected && company.status === 'Active') ? selected : 'Google'
}

export function setSelectedCompany(company) {
  localStorage.setItem(SELECTED_COMPANY_KEY, company)
  window.dispatchEvent(new CustomEvent(DATA_EVENT, { detail: { type: 'selected-company', company } }))
}

export { COMPANY_KEY, DATA_EVENT }
