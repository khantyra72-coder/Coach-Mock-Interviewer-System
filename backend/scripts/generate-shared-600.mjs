import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const inputPath = resolve('src/main/resources/data/shared-questions-200.json')
const outputPath = resolve('src/main/resources/data/shared-questions-600.json')
const existing = JSON.parse(readFileSync(inputPath, 'utf8'))

const plans = {
  'Software Engineer': {
    domains: ['memory management', 'dependency management', 'fault isolation', 'data serialization', 'algorithm selection', 'code maintainability', 'event processing'],
    systems: ['distributed lock service', 'file storage service', 'event bus', 'service discovery system'],
  },
  'Frontend Developer': {
    domains: ['DOM event propagation', 'JavaScript memory leaks', 'responsive image delivery', 'internationalization', 'browser security policy', 'design-token architecture', 'server-side rendering'],
    systems: ['web rendering platform', 'internationalized storefront', 'real-time collaboration UI', 'media upload experience', 'browser extension platform', 'large-form workflow', 'web experimentation SDK'],
  },
  'Backend Developer': {
    domains: ['connection pooling', 'schema migration safety', 'cache invalidation', 'distributed locking', 'backpressure control', 'service-to-service tracing', 'data retention'],
    systems: ['billing ledger', 'search indexing backend', 'workflow engine', 'tenant configuration service', 'distributed cache', 'webhook platform', 'audit-log service'],
  },
  'Full-Stack Developer': {
    domains: ['database-to-UI consistency', 'secure file uploads', 'real-time socket state', 'schema evolution', 'authorization boundaries', 'performance tracing', 'deployment rollback'],
    systems: ['marketplace application', 'learning-management system', 'real-time polling product', 'document approval workflow', 'team knowledge base', 'expense-management application', 'appointment platform'],
  },
  'Data Scientist': {
    domains: ['sampling bias', 'multiple-hypothesis correction', 'time-series validation', 'class imbalance', 'metric decomposition', 'outlier robustness', 'confidence intervals'],
    systems: ['marketing attribution workflow', 'pricing analytics platform', 'retention cohort service', 'anomaly-detection workflow', 'survey analysis platform', 'supply-chain analytics system', 'executive metrics layer'],
  },
  'ML / AI Engineer': {
    domains: ['online inference latency', 'dataset versioning', 'model explainability', 'adversarial robustness', 'hyperparameter search', 'GPU utilization', 'model rollback'],
    systems: ['vector search platform', 'online feature computation service', 'AI safety evaluation platform', 'speech-recognition pipeline', 'forecasting service', 'computer-vision inference platform', 'prompt experimentation system'],
  },
  'Cloud / DevOps Engineer': {
    domains: ['autoscaling signals', 'load-balancer health checks', 'certificate lifecycle', 'database failover', 'artifact supply-chain security', 'capacity forecasting', 'configuration drift'],
    systems: ['global traffic-management layer', 'secrets-management platform', 'cloud backup service', 'container registry', 'service mesh', 'capacity-management platform', 'policy-as-code service'],
  },
  'Mobile Developer': {
    domains: ['deep-link routing', 'background task scheduling', 'application startup time', 'mobile database migration', 'biometric authentication', 'push notification delivery', 'platform permission handling'],
    systems: ['ride-tracking application', 'secure chat application', 'mobile document scanner', 'fitness tracking application', 'mobile commerce application', 'podcast download application', 'field-service application'],
  },
  'Cybersecurity Analyst': {
    domains: ['malware triage', 'network segmentation', 'certificate compromise', 'cloud permission escalation', 'data exfiltration detection', 'endpoint containment', 'security-control validation'],
    systems: ['threat-intelligence platform', 'data-loss prevention service', 'security awareness program', 'endpoint detection platform', 'certificate monitoring service', 'cloud security posture system', 'digital forensics platform'],
  },
  'QA / Test Engineer': {
    domains: ['mutation testing', 'concurrency test design', 'database migration testing', 'accessibility test automation', 'chaos testing', 'release defect analysis', 'test-suite parallelization'],
    systems: ['API load-testing platform', 'test-results analytics service', 'contract-test registry', 'fault-injection framework', 'accessibility testing service', 'release certification workflow', 'test flakiness management system'],
  },
}

const behaviorScenarios = [
  ['stakeholder alignment', 'stakeholders disagreed about what success should mean'],
  ['preventing recurrence', 'you converted a recurring failure into a lasting prevention mechanism'],
  ['ethical judgment', 'a technically possible approach raised privacy, fairness, or user-trust concerns'],
  ['scope negotiation', 'you had to reduce scope without losing the most important outcome'],
  ['evidence-based challenge', 'you challenged a senior colleague’s proposal using evidence'],
  ['operational ownership', 'you responded to a production or customer-impacting incident'],
  ['mentoring', 'you helped a teammate develop an important skill without taking over their work'],
  ['prioritization', 'several urgent requests competed for your limited time'],
  ['communication failure', 'your initial communication caused confusion and you had to repair it'],
  ['technical debt', 'you persuaded others to address technical debt alongside feature work'],
  ['customer empathy', 'direct user evidence changed your planned solution'],
  ['decision reversal', 'new evidence forced you to reverse a decision you had supported'],
  ['inclusive collaboration', 'you helped a quieter or excluded perspective influence a decision'],
  ['long-term impact', 'you made a decision that traded short-term speed for sustainable results'],
]

const technicalLenses = [
  ['diagnosis', 'diagnose a production failure'],
  ['implementation', 'implement a safe and maintainable solution'],
]
const designLenses = [
  ['scale and reliability', 'prioritize scale, availability, and graceful degradation'],
  ['security and evolution', 'prioritize security, data evolution, and operability'],
]
const levels = ['Easy', 'Medium', 'Hard']
const normalize = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const makeRubrics = (role, type, topic, names) => names.map((name, index) => ({
  order: index + 1,
  name,
  description: `Evaluates ${name.toLowerCase()} for this ${role} ${type.toLowerCase()} question about ${topic}.`,
  expectedEvidence: `${name}: cite concrete evidence and reasoning unique to ${role}, ${topic}, and this scenario.`,
  acceptableAlternatives: `A different ${role}-appropriate approach is acceptable when its consequences are explained.`,
  keywords: normalize(`${role} ${type} ${topic} ${name}`).split(' ').join(','),
  weight: 20,
}))

const additions = []
for (const [role, plan] of Object.entries(plans)) {
  const current = Object.groupBy(existing.filter((q) => q.role === role), (q) => q.type)
  const technicalNeeded = 20 - (current.Technical?.length ?? 0)
  const behavioralNeeded = 20 - (current.Behavioral?.length ?? 0)
  const designNeeded = 20 - (current['System Design']?.length ?? 0)

  const technicalCandidates = plan.domains.flatMap((topic) => technicalLenses.map(([lens, action]) => ({ topic, lens, action })))
  technicalCandidates.slice(0, technicalNeeded).forEach(({ topic, lens, action }, index) => additions.push({
    role, type: 'Technical', topic: `${topic}: ${lens}`, difficulty: levels[(index + 1) % 3], sourceType: 'SHARED', company: null,
    prompt: `You are the ${role} responsible for ${topic}. How would you ${action}? Explain your assumptions, technical steps, edge cases, and verification.`,
    expectedAnswerSummary: `The answer should frame the ${topic} scenario, apply a sound ${lens} method suitable for a ${role}, cover failure and edge conditions, and verify correctness with tests, telemetry, or controlled measurement.`,
    rubrics: makeRubrics(role, 'Technical', `${topic} ${lens}`, ['Assumptions and diagnosis', 'Technical correctness', 'Implementation detail', 'Failure and edge cases', 'Verification evidence']),
  }))

  behaviorScenarios.slice(0, behavioralNeeded).forEach(([topic, scenario], index) => additions.push({
    role, type: 'Behavioral', topic, difficulty: levels[(index + 2) % 3], sourceType: 'SHARED', company: null,
    prompt: `As a ${role}, tell me about a specific time when ${scenario}. How did you decide what to do, and what was the measurable outcome?`,
    expectedAnswerSummary: `A strong response uses a concrete ${role} example about ${topic}, separates personal contribution from team activity, explains judgment and communication, quantifies impact, and identifies a credible lesson.`,
    rubrics: makeRubrics(role, 'Behavioral', topic, ['Situation and stakes', 'Individual responsibility', 'Decision and actions', 'Quantified result', 'Learning and transfer']),
  }))

  const designCandidates = plan.systems.flatMap((topic) => designLenses.map(([lens, priority]) => ({ topic, lens, priority })))
  designCandidates.slice(0, designNeeded).forEach(({ topic, lens, priority }, index) => additions.push({
    role, type: 'System Design', topic: `${topic}: ${lens}`, difficulty: levels[index % 3], sourceType: 'SHARED', company: null,
    prompt: `Design a ${topic} as a ${role}. Answer entirely in text and ${priority}; include requirements, interfaces, components, data flow, failures, and trade-offs.`,
    expectedAnswerSummary: `The text answer should quantify requirements for the ${topic}, define ${role}-relevant boundaries and data flow, address ${lens}, explain failure recovery and security, and justify trade-offs with operational signals.`,
    rubrics: makeRubrics(role, 'System Design', `${topic} ${lens}`, ['Requirements and constraints', 'Interfaces and architecture', 'State and data flow', 'Failure and security strategy', 'Trade-offs and operations']),
  }))
}

const questions = [...existing, ...additions]
if (existing.length !== 200 || additions.length !== 400 || questions.length !== 600) {
  throw new Error(`Expected 200 existing + 400 additions = 600; got ${existing.length} + ${additions.length}`)
}
const counts = Object.groupBy(questions, (q) => `${q.role}|${q.type}`)
if (Object.keys(counts).length !== 30 || Object.values(counts).some((items) => items.length !== 20)) {
  throw new Error('Every role/type combination must contain exactly 20 questions')
}
if (new Set(questions.map((q) => normalize(q.prompt))).size !== 600) throw new Error('Duplicate normalized prompt')
if (new Set(questions.map((q) => q.expectedAnswerSummary.trim())).size !== 600) throw new Error('Duplicate expected answer')
if (questions.some((q) => q.rubrics.length !== 5 || q.rubrics.reduce((sum, r) => sum + r.weight, 0) !== 100)) {
  throw new Error('Invalid rubric set')
}

writeFileSync(outputPath, `${JSON.stringify(questions, null, 2)}\n`)
console.log(`Wrote ${questions.length} shared questions and ${questions.length * 5} rubrics to ${outputPath}`)
