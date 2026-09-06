import { DEFAULT_COMPANIES } from './companyCatalog.js'
import { TECH_ROLES } from './interviewTaxonomy.js'

const TECHNICAL_TOPICS = [
  'arrays and linked lists', 'hash maps and collision handling', 'trees and graph traversal', 'sorting and search algorithms',
  'dynamic programming', 'concurrency and synchronization', 'processes and threads', 'memory management',
  'database indexes', 'SQL query optimization', 'transactions and isolation', 'REST API design',
  'authentication and authorization', 'caching and invalidation', 'message queues', 'distributed locks',
  'JavaScript event loop', 'React rendering and reconciliation', 'web accessibility', 'browser performance',
  'Java and Spring dependency injection', 'exception handling and observability', 'unit and integration testing', 'CI/CD pipelines',
  'containers and orchestration', 'networking and load balancing', 'data modeling', 'feature engineering',
  'model evaluation', 'mobile application performance', 'application security', 'rate limiting',
  'idempotency and retries', 'eventual consistency',
]

const SYSTEM_DESIGN_TOPICS = [
  'a URL shortening platform', 'a real-time chat service', 'a notification delivery platform', 'a cloud file synchronization service',
  'a video streaming service', 'a music recommendation platform', 'an online payment system', 'a ride dispatch platform',
  'a global search autocomplete service', 'a social news feed', 'an e-commerce checkout system', 'a feature-flag service',
  'an API rate limiter', 'a distributed job scheduler', 'a metrics and alerting platform', 'a multi-tenant analytics dashboard',
  'an identity and access platform', 'a secure audit-log service', 'an experimentation platform', 'a content moderation pipeline',
  'a collaborative document editor', 'an image processing pipeline', 'an inventory reservation service', 'a fraud detection platform',
  'a location tracking service', 'an offline-first mobile sync service', 'a customer support ticketing system', 'a data ingestion pipeline',
  'a secrets-management service', 'a package delivery tracking system', 'a podcast publishing platform', 'a marketplace search service',
  'a high-volume webhook delivery system',
]

const BEHAVIORAL_TOPICS = [
  'resolved a disagreement with a teammate', 'delivered under a difficult deadline', 'received difficult feedback',
  'owned a project that did not go as planned', 'influenced a decision without formal authority', 'improved a process',
  'made a decision with incomplete information', 'balanced speed with quality', 'handled an unhappy customer',
  'mentored or supported a teammate', 'responded to a production incident', 'challenged an existing approach',
  'learned a new technology quickly', 'managed competing priorities', 'identified and reduced a major risk',
  'used data to change a decision', 'worked across multiple teams', 'simplified a complex problem',
  'made a mistake and repaired its impact', 'disagreed with a manager', 'protected user privacy',
  'improved system reliability', 'gave constructive feedback', 'handled ambiguous requirements',
  'advocated for accessibility', 'reduced technical debt', 'led a project from idea to delivery',
  'adapted after a sudden change', 'made a difficult trade-off', 'improved team communication',
  'investigated a recurring failure', 'created a measurable customer benefit', 'demonstrated ownership beyond your role',
]

const difficultyFor = (index) => ['Easy', 'Medium', 'Hard'][index % 3]

function conceptsFor(type, topic) {
  if (type === 'Behavioral') {
    return [
      ['Situation and stakes', ['situation', 'context', 'impact']], ['Personal responsibility', ['responsibility', 'my role', 'i owned']],
      ['Specific actions', ['i did', 'action', 'steps']], ['Measurable result', ['result', 'improved', 'reduced']],
      ['Learning', ['learned', 'next time', 'lesson']],
    ]
  }
  if (type === 'System Design') {
    return [
      ['Requirements', ['requirements', 'scale', 'users']], ['Architecture', ['service', 'component', 'architecture']],
      ['Data design', ['database', 'storage', 'schema']], ['Reliability and scale', ['replication', 'cache', 'failure']],
      ['Trade-offs and monitoring', ['trade-off', 'metrics', 'monitor']],
    ]
  }
  return [
    ['Core concept', topic.split(' ').slice(0, 3)], ['Complexity or cost', ['complexity', 'cost', 'performance']],
    ['Practical approach', ['approach', 'implementation', 'steps']], ['Trade-offs', ['trade-off', 'advantage', 'disadvantage']],
    ['Verification', ['test', 'measure', 'verify']],
  ]
}

function buildQuestion(company, type, topic, index) {
  const role = TECH_ROLES[index % TECH_ROLES.length]
  const prompt = type === 'Technical'
    ? `${company.name} technical scenario: explain in writing ${topic}, its key trade-offs, and how you would apply it in a production system. No executable code is required.`
    : type === 'System Design'
      ? `${company.name} system-design interview: describe in writing how you would design ${topic} for production scale and explain your major trade-offs. No diagram is required.`
      : `Tell me about a time you ${topic}. What did you personally do, what was the result, and what did you learn?`
  const concepts = conceptsFor(type, topic).map(([label, keywords]) => ({
    label,
    keywords,
    guidance: `Cover ${label.toLowerCase()} clearly.`,
    weight: 20,
  }))
  return {
    id: `seed-${company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${type.toLowerCase().replace(' ', '-')}-${index + 1}`,
    role,
    company: company.name,
    type,
    topic: topic.replace(/(^|\s)\S/g, (letter) => letter.toUpperCase()),
    difficulty: difficultyFor(index),
    prompt,
    tips: type === 'Behavioral'
      ? ['Use a clear STAR structure.', 'Describe your personal actions.', 'Finish with the result and lesson.']
      : ['Clarify assumptions first.', 'Explain the core approach.', 'Discuss trade-offs and verification.'],
    model: concepts.map((item) => item.label),
    concepts,
    responseMode: 'Written response',
    textAnswerable: true,
    seeded: true,
  }
}

export function generateCompanyQuestionSeeds() {
  return DEFAULT_COMPANIES.flatMap((company) => [
    ...TECHNICAL_TOPICS.map((topic, index) => buildQuestion(company, 'Technical', topic, index)),
    ...SYSTEM_DESIGN_TOPICS.map((topic, index) => buildQuestion(company, 'System Design', topic, index + TECHNICAL_TOPICS.length)),
    ...BEHAVIORAL_TOPICS.map((topic, index) => buildQuestion(company, 'Behavioral', topic, index + TECHNICAL_TOPICS.length + SYSTEM_DESIGN_TOPICS.length)),
  ])
}

export const SEEDED_QUESTION_COUNT_PER_COMPANY = TECHNICAL_TOPICS.length + SYSTEM_DESIGN_TOPICS.length + BEHAVIORAL_TOPICS.length
