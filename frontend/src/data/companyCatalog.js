import { COMPANIES, isCompany } from './interviewTaxonomy.js'

const COMPANY_KEY = 'aceinterview_admin_companies'
const SELECTED_COMPANY_KEY = 'aceinterview_selected_company'
const DATA_EVENT = 'aceinterview:data-changed'

export const DEFAULT_COMPANIES = COMPANIES.map((company, index) => ({
  id: `#C${String(index + 1).padStart(2, '0')}`,
  ...company,
  sessions: 0,
  status: 'Active',
}))

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
    stored.filter((company) => isCompany(company.name)).forEach((company, index) => {
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
  localStorage.setItem(COMPANY_KEY, JSON.stringify(companies.filter((company) => isCompany(company.name)).map(normalizeCompany)))
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
