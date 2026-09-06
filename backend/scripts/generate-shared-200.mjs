import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pilotPath = resolve('src/main/resources/data/pilot-questions.json')
const outputPath = resolve('src/main/resources/data/shared-questions-200.json')
const existing = JSON.parse(readFileSync(pilotPath, 'utf8'))
  .filter((question) => question.sourceType === 'SHARED')
  .map((question) => ({ ...question, role: 'Software Engineer', company: null }))

const rolePlans = {
  'Frontend Developer': {
    technical: ['browser rendering pipeline', 'accessible component semantics', 'client-side state management', 'web performance measurement', 'CSS layout and stacking contexts', 'frontend testing strategy'],
    design: ['component library', 'real-time analytics dashboard', 'offline-capable web application', 'micro-frontend platform', 'accessible checkout experience', 'frontend observability platform'],
  },
  'Backend Developer': {
    technical: ['REST API idempotency', 'database transaction isolation', 'message queue delivery semantics', 'API authentication and authorization', 'query-plan optimization', 'concurrent request handling'],
    design: ['multi-tenant API platform', 'order-processing service', 'notification delivery backend', 'inventory reservation service', 'API gateway', 'data synchronization service'],
  },
  'Full-Stack Developer': {
    technical: ['end-to-end form validation', 'session and token authentication', 'optimistic UI updates', 'API pagination and filtering', 'cross-layer error handling', 'full-stack test boundaries'],
    design: ['project-management application', 'subscription SaaS product', 'customer-support portal', 'event-booking platform', 'content-management system', 'collaborative task board'],
  },
  'Data Scientist': {
    technical: ['experimental design and power', 'missing-data treatment', 'feature leakage detection', 'model evaluation metrics', 'causal versus correlational inference', 'data-drift analysis'],
    design: ['product experimentation platform', 'customer-churn analysis system', 'demand-forecasting workflow', 'fraud analytics platform', 'recommendation evaluation framework', 'self-service business intelligence platform'],
  },
  'ML / AI Engineer': {
    technical: ['training-serving skew', 'embedding retrieval quality', 'model calibration', 'distributed training bottlenecks', 'LLM evaluation and hallucination', 'feature-store consistency'],
    design: ['real-time recommendation system', 'model-serving platform', 'retrieval-augmented generation service', 'ML feature platform', 'content-moderation pipeline', 'continuous model-training system'],
  },
  'Cloud / DevOps Engineer': {
    technical: ['container resource limits', 'infrastructure-as-code state', 'Kubernetes rollout failures', 'service-level objectives', 'networking and DNS diagnosis', 'secret rotation automation'],
    design: ['multi-region deployment platform', 'centralized logging system', 'continuous-delivery platform', 'disaster-recovery architecture', 'cloud cost-governance system', 'internal developer platform'],
  },
  'Mobile Developer': {
    technical: ['mobile application lifecycle', 'offline data synchronization', 'battery and network efficiency', 'secure local storage', 'responsive mobile rendering', 'mobile crash diagnosis'],
    design: ['offline messaging application', 'mobile payment application', 'location-sharing service', 'mobile media-feed application', 'cross-platform notification system', 'mobile analytics SDK'],
  },
  'Cybersecurity Analyst': {
    technical: ['threat-model construction', 'SQL injection investigation', 'identity and access review', 'incident log correlation', 'vulnerability prioritization', 'phishing and credential response'],
    design: ['security information and event management platform', 'zero-trust access system', 'vulnerability-management program', 'cloud threat-detection pipeline', 'privileged-access management system', 'incident-response automation platform'],
  },
  'QA / Test Engineer': {
    technical: ['test-case boundary analysis', 'flaky-test diagnosis', 'API contract testing', 'performance-test modeling', 'test-data management', 'risk-based regression selection'],
    design: ['cross-browser test platform', 'mobile device test lab', 'continuous quality-gate system', 'production synthetic-monitoring service', 'test-environment provisioning platform', 'visual regression system'],
  },
}

const behaviorThemes = [
  ['quality advocacy', 'you identified a serious quality risk that others had underestimated'],
  ['cross-functional conflict', 'you resolved a disagreement with a partner from another discipline'],
  ['delivery setback', 'an important project missed an expectation and you helped recover it'],
  ['ambiguous ownership', 'you took responsibility for a problem with no clear owner'],
  ['measurable improvement', 'you improved a recurring engineering or analysis workflow'],
  ['learning under pressure', 'you had to learn an unfamiliar area quickly to deliver a result'],
]

const difficulty = (index) => ['Easy', 'Medium', 'Hard'][index % 3]
const rubric = (role, type, topic, labels) => labels.map((label, index) => ({
  order: index + 1,
  name: label,
  description: `Evaluates ${label.toLowerCase()} for the ${role} ${type.toLowerCase()} question about ${topic}.`,
  expectedEvidence: `${label}: provide concrete, question-specific evidence about ${topic} from a ${role} perspective.`,
  acceptableAlternatives: `An equivalent ${role}-appropriate method is acceptable when its trade-offs are justified.`,
  keywords: `${role},${type},${topic},${label}`.toLowerCase().replace(/[^a-z0-9, ]/g, ''),
  weight: 20,
}))

const generated = []
for (const [role, plan] of Object.entries(rolePlans)) {
  plan.technical.forEach((topic, index) => generated.push({
    role, type: 'Technical', topic, difficulty: difficulty(index), sourceType: 'SHARED', company: null,
    prompt: `As a ${role}, how would you analyze and solve a realistic problem involving ${topic}? Include the checks and trade-offs you would use.`,
    expectedAnswerSummary: `A strong answer defines the ${topic} problem, selects a ${role}-appropriate method, explains implementation trade-offs, tests edge cases, and verifies the result with measurable evidence.`,
    rubrics: rubric(role, 'Technical', topic, ['Problem framing', 'Technical method', 'Trade-off reasoning', 'Edge-case handling', 'Verification']),
  }))
  behaviorThemes.forEach(([topic, scenario], index) => generated.push({
    role, type: 'Behavioral', topic, difficulty: difficulty(index + 1), sourceType: 'SHARED', company: null,
    prompt: `Tell me about a time, as a ${role}, when ${scenario}. What did you personally do and what changed?`,
    expectedAnswerSummary: `Use a specific STAR example relevant to a ${role}: establish the ${topic} context, distinguish personal ownership, explain decisions and collaboration, quantify the result, and reflect on learning.`,
    rubrics: rubric(role, 'Behavioral', topic, ['Specific context', 'Personal ownership', 'Actions and judgment', 'Measured outcome', 'Reflection and learning']),
  }))
  plan.design.forEach((topic, index) => generated.push({
    role, type: 'System Design', topic, difficulty: difficulty(index + 2), sourceType: 'SHARED', company: null,
    prompt: `Design a ${topic} from a ${role} perspective. Give the complete answer in text, including scale, components, data flow, failure handling, and trade-offs.`,
    expectedAnswerSummary: `A complete text answer clarifies requirements and scale for the ${topic}, proposes role-relevant components and data flow, addresses reliability and security, and justifies important trade-offs and observability.`,
    rubrics: rubric(role, 'System Design', topic, ['Requirements and scale', 'Architecture and boundaries', 'Data flow and state', 'Reliability and security', 'Trade-offs and observability']),
  }))
}

const questions = [...existing, ...generated]
if (existing.length !== 38 || generated.length !== 162 || questions.length !== 200) {
  throw new Error(`Expected 38 existing + 162 generated = 200; got ${existing.length} + ${generated.length}`)
}
const normalized = questions.map((item) => item.prompt.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim())
if (new Set(normalized).size !== questions.length) throw new Error('Duplicate normalized prompts detected')
if (questions.some((item) => item.rubrics.length !== 5 || item.rubrics.reduce((sum, item) => sum + item.weight, 0) !== 100)) {
  throw new Error('Invalid rubric set detected')
}

writeFileSync(outputPath, `${JSON.stringify(questions, null, 2)}\n`)
console.log(`Wrote ${questions.length} shared questions and ${questions.length * 5} rubric criteria to ${outputPath}`)
