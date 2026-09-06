import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const input = resolve('src/main/resources/data/shared-questions-600.json')
const output = resolve('src/main/resources/data/shared-questions-reviewed.json')
const questions = JSON.parse(readFileSync(input, 'utf8'))

const profiles = {
  'Software Engineer': { signals: ['latency percentiles', 'error rate', 'resource profiles'], methods: ['minimal reproduction', 'binary isolation', 'complexity analysis'], risks: ['race conditions', 'partial failure', 'backward incompatibility'], tests: ['unit and integration tests', 'load tests', 'canary metrics'], components: ['API layer', 'durable store', 'cache and worker tier'] },
  'Frontend Developer': { signals: ['Core Web Vitals', 'browser performance traces', 'accessibility-tree output'], methods: ['DevTools profiling', 'DOM and network inspection', 'progressive enhancement'], risks: ['hydration mismatch', 'keyboard inaccessibility', 'stale client state'], tests: ['component tests', 'cross-browser tests', 'Lighthouse and screen-reader checks'], components: ['browser client', 'edge delivery layer', 'frontend telemetry collector'] },
  'Backend Developer': { signals: ['p95 latency', 'database query plans', 'queue depth'], methods: ['distributed tracing', 'transaction analysis', 'idempotent processing'], risks: ['duplicate delivery', 'deadlock', 'dependency timeout'], tests: ['contract tests', 'failure-injection tests', 'load and recovery tests'], components: ['service API', 'transactional database', 'queue and worker fleet'] },
  'Full-Stack Developer': { signals: ['browser errors', 'API traces', 'database timings'], methods: ['end-to-end tracing', 'schema validation', 'layer-by-layer isolation'], risks: ['authorization gaps', 'client/server inconsistency', 'failed partial updates'], tests: ['UI-to-database integration tests', 'contract tests', 'deployment smoke tests'], components: ['web client', 'application API', 'database and background jobs'] },
  'Data Scientist': { signals: ['sample distributions', 'confidence intervals', 'segment-level metrics'], methods: ['exploratory analysis', 'statistical testing', 'holdout validation'], risks: ['data leakage', 'selection bias', 'misleading aggregate metrics'], tests: ['data-quality checks', 'sensitivity analysis', 'out-of-sample validation'], components: ['validated data source', 'analysis pipeline', 'metric and reporting layer'] },
  'ML / AI Engineer': { signals: ['offline quality metrics', 'serving latency', 'feature and prediction drift'], methods: ['slice evaluation', 'training-serving comparison', 'controlled model rollout'], risks: ['feature leakage', 'model drift', 'unsafe or biased output'], tests: ['golden-set evaluation', 'shadow traffic', 'canary and rollback checks'], components: ['feature pipeline', 'model registry and serving tier', 'evaluation and monitoring service'] },
  'Cloud / DevOps Engineer': { signals: ['SLO burn rate', 'infrastructure events', 'CPU memory and saturation'], methods: ['runbook-guided triage', 'configuration diffing', 'progressive delivery'], risks: ['regional outage', 'configuration drift', 'credential exposure'], tests: ['infrastructure policy tests', 'disaster-recovery exercise', 'canary health checks'], components: ['control plane', 'regional runtime clusters', 'observability and deployment system'] },
  'Mobile Developer': { signals: ['crash-free sessions', 'startup duration', 'battery and network usage'], methods: ['device profiling', 'lifecycle tracing', 'offline-state reconciliation'], risks: ['process termination', 'intermittent connectivity', 'unsafe local data'], tests: ['device-matrix tests', 'offline and lifecycle tests', 'staged-store rollout metrics'], components: ['mobile client', 'synchronization API', 'local store and notification service'] },
  'Cybersecurity Analyst': { signals: ['authentication anomalies', 'network and endpoint events', 'threat-intelligence matches'], methods: ['timeline reconstruction', 'IOC correlation', 'containment and evidence preservation'], risks: ['attacker persistence', 'evidence destruction', 'excessive access'], tests: ['detection-rule replay', 'tabletop exercises', 'control validation'], components: ['event collectors', 'correlation and detection engine', 'case-management and response layer'] },
  'QA / Test Engineer': { signals: ['failure rate by build', 'coverage gaps', 'flakiness and escaped-defect trends'], methods: ['risk-based test design', 'failure minimization', 'boundary and state-transition analysis'], risks: ['false confidence', 'environment contamination', 'nondeterministic results'], tests: ['deterministic regression suite', 'contract and boundary tests', 'production synthetic checks'], components: ['test orchestrator', 'isolated execution workers', 'results and quality-gate service'] },
}

const roleArtifacts = {
  'Software Engineer': 'design document, code review, and production metrics',
  'Frontend Developer': 'accessibility evidence, browser trace, and user-impact metric',
  'Backend Developer': 'API contract, trace, and reliability metric',
  'Full-Stack Developer': 'end-to-end trace, product metric, and deployment evidence',
  'Data Scientist': 'analysis notebook, statistical evidence, and decision metric',
  'ML / AI Engineer': 'evaluation set, model card, and serving metric',
  'Cloud / DevOps Engineer': 'runbook, infrastructure diff, and SLO evidence',
  'Mobile Developer': 'device trace, lifecycle evidence, and release metric',
  'Cybersecurity Analyst': 'incident timeline, control evidence, and risk assessment',
  'QA / Test Engineer': 'test report, reproducible failure, and quality metric',
}

const isTemplate = (q) => q.prompt.startsWith('As a ') || q.prompt.startsWith('You are the ')
  || (q.prompt.startsWith('Tell me about a time, as a ')) || q.prompt.startsWith('Design a ') && q.prompt.includes(' perspective')
  || q.prompt.startsWith('As a') || q.prompt.includes('Answer entirely in text and prioritize')

const cleanTopic = (topic) => topic.replace(/: (diagnosis|implementation|scale and reliability|security and evolution)$/i, '')
const rubric = (name, description, evidence, alternatives, keywords, order) => ({ order, name, description, expectedEvidence: evidence, acceptableAlternatives: alternatives, keywords, weight: 20 })

let revised = 0
const result = questions.map((original, questionIndex) => {
  if (!isTemplate(original)) return original
  revised++
  const q = structuredClone(original)
  const p = profiles[q.role]
  const topic = cleanTopic(q.topic)
  const angle = q.topic.includes(': ') ? q.topic.split(': ').at(-1) : 'applied practice'
  const variant = questionIndex % 3
  q.legacyPrompt = original.prompt

  if (q.type === 'Technical') {
    const symptom = [p.signals[0], p.signals[1], p.signals[2]][variant]
    q.prompt = `A recent change involving ${topic} causes an unexpected regression in ${symptom}. As the ${q.role}, explain how you would approach ${angle}: reproduce the problem, isolate the cause, implement a safe correction, and prove the fix.`
    const points = [
      `Establish a baseline using ${p.signals.join(', ')} and identify the affected scope before changing the system.`,
      `Use ${p.methods.join(', ')} to test competing hypotheses about ${topic} and distinguish correlation from the root cause.`,
      `Propose a correction grounded in how ${topic} works, including compatibility, resource, and operational trade-offs.`,
      `Address ${p.risks.join(', ')} and define rollback or containment if the correction makes behavior worse.`,
      `Verify with ${p.tests.join(', ')} and compare the original ${symptom} against an explicit success threshold.`,
    ]
    q.expectedAnswerSummary = points.join(' ')
    q.rubrics = [
      rubric('Evidence-based reproduction', `Measures whether the candidate can make the ${topic} failure observable and repeatable.`, points[0], 'Equivalent role-appropriate telemetry is acceptable if it isolates scope and establishes a baseline.', `${topic},baseline,${p.signals.join(',')}`, 1),
      rubric('Root-cause isolation', `Measures causal diagnosis rather than unstructured troubleshooting.`, points[1], 'A different systematic isolation method is acceptable when hypotheses can be falsified.', `${topic},root cause,${p.methods.join(',')}`, 2),
      rubric('Technically sound correction', `Measures understanding of ${topic} and the safety of the proposed implementation.`, points[2], 'Alternative corrections receive credit when their compatibility and resource costs are explicit.', `${topic},implementation,compatibility,trade-off`, 3),
      rubric('Failure and rollback handling', 'Measures preparation for realistic adverse conditions.', points[3], 'Comparable failure cases and containment controls are acceptable.', `${topic},${p.risks.join(',')},rollback`, 4),
      rubric('Proof of correctness', `Measures whether the candidate can demonstrate that the ${topic} fix works.`, points[4], 'Equivalent automated tests and measurable release gates are acceptable.', `${topic},${p.tests.join(',')},success threshold`, 5),
    ]
  } else if (q.type === 'Behavioral') {
    const artifact = roleArtifacts[q.role]
    q.prompt = `As a ${q.role}, tell me about one specific situation where ${topic} tested your judgment. Explain the stakes, your personal decision, evidence from a ${artifact}, how you handled disagreement or constraints, and the measurable result.`
    const points = [
      `Describe one concrete ${q.role} situation involving ${topic}, including the stakes, constraints, and people affected.`,
      `Separate personal decisions and actions from team activity, supported by a specific ${artifact}.`,
      `Explain at least one alternative considered, why it was rejected, and how disagreement or risk was handled.`,
      `Report a verifiable result such as quality, reliability, delivery, risk, adoption, or user-impact improvement.`,
      `Identify a specific behavior changed afterward and show how it influenced a later ${q.role} situation.`,
    ]
    q.expectedAnswerSummary = points.join(' ')
    q.rubrics = [
      rubric('Concrete situation and stakes', `Scores specificity and relevance to ${topic}.`, points[0], 'A different but equally specific professional example is acceptable.', `${q.role},${topic},stakes,constraints`, 1),
      rubric('Demonstrated ownership', 'Scores the candidate’s individual contribution and supporting evidence.', points[1], 'Shared ownership is acceptable when the candidate clearly identifies their decisions.', `${q.role},ownership,${artifact}`, 2),
      rubric('Judgment and collaboration', 'Scores alternatives, trade-offs, communication, and conflict handling.', points[2], 'A different decision process is acceptable when it is evidence-based and respectful.', `${topic},alternatives,trade-offs,collaboration`, 3),
      rubric('Measured outcome', 'Scores whether the result is credible and attributable to the actions described.', points[3], 'Qualitative outcomes are acceptable only when the candidate explains how they were observed.', `${topic},quality,reliability,impact,result`, 4),
      rubric('Transferred learning', 'Scores honest reflection and evidence that learning changed later behavior.', points[4], 'A well-supported prevention mechanism can substitute for a later example.', `${q.role},learning,behavior change,prevention`, 5),
    ]
  } else {
    const scale = q.difficulty === 'Easy' ? '10,000 daily users in one region' : q.difficulty === 'Medium' ? 'one million daily users across three regions' : '100 million daily users across multiple regions'
    q.prompt = `Design a ${topic} for ${scale}, with special emphasis on ${angle}. Answer entirely in text as a ${q.role}: define functional and non-functional requirements, interfaces, components, state and data flow, capacity assumptions, failure recovery, security, observability, and the main trade-offs.`
    const points = [
      `Clarify core operations, users, data sensitivity, consistency needs, and targets for latency, availability, throughput, retention, and cost at ${scale}.`,
      `Define interfaces and assign clear responsibilities to ${p.components.join(', ')}, including synchronous and asynchronous boundaries.`,
      `Describe the ${topic} data model, partition key, read/write path, caching or batching, and how concurrent or repeated operations remain correct.`,
      `Handle ${p.risks.join(', ')}, regional or dependency failure, authentication and authorization, encryption, recovery objectives, and graceful degradation.`,
      `Estimate the dominant capacity constraint, justify consistency and availability choices, and monitor the design using ${p.signals.join(', ')} with alert and rollback thresholds.`,
    ]
    q.expectedAnswerSummary = points.join(' ')
    q.rubrics = [
      rubric('Quantified requirements', `Scores whether requirements for the ${topic} drive the design.`, points[0], 'Different numerical assumptions are acceptable when internally consistent.', `${topic},${scale},latency,availability,throughput,retention`, 1),
      rubric('Interfaces and component boundaries', 'Scores completeness and separation of responsibilities.', points[1], 'Alternative component boundaries are acceptable when coupling and ownership are explained.', `${topic},${p.components.join(',')},API,boundary`, 2),
      rubric('Data model and request flow', 'Scores state ownership, correctness, and end-to-end flow.', points[2], 'Alternative storage and messaging choices are acceptable with justified access patterns.', `${topic},data model,partition,read path,write path,idempotency`, 3),
      rubric('Reliability and security', 'Scores concrete failure recovery and protection of users and data.', points[3], 'Comparable controls are acceptable when threat and failure coverage is explicit.', `${topic},${p.risks.join(',')},authentication,encryption,recovery`, 4),
      rubric('Capacity, trade-offs, and operations', 'Scores quantitative reasoning and production operability.', points[4], 'Different trade-offs are acceptable when linked to requirements and measurable signals.', `${topic},capacity,consistency,${p.signals.join(',')},alerts`, 5),
    ]
  }
  q.rubrics = q.rubrics.map((item) => ({
    ...item,
    expectedEvidence: `${item.expectedEvidence} Apply this criterion specifically to ${q.role}, ${topic}, and the ${angle} focus of this question.`,
  }))
  return q
})

if (revised !== 562) throw new Error(`Expected to revise 562 template questions, revised ${revised}`)
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
if (new Set(result.map((q) => norm(q.prompt))).size !== 600) {
  const seen = new Map()
  for (const item of result) {
    const key = norm(item.prompt)
    if (seen.has(key)) console.error('DUPLICATE:', seen.get(key), '\nAND:', item.prompt)
    seen.set(key, item.prompt)
  }
  throw new Error('Revised prompts are not unique')
}
if (new Set(result.map((q) => q.expectedAnswerSummary)).size !== 600) throw new Error('Revised expected answers are not unique')
const evidence = result.flatMap((q) => q.rubrics.map((r) => r.expectedEvidence))
if (new Set(evidence).size !== 3000) throw new Error('Revised rubric evidence is not unique')
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`)
console.log(`Revised ${revised} template questions; wrote ${result.length} questions and ${evidence.length} rubric criteria.`)
