import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pilot = JSON.parse(readFileSync(resolve('src/main/resources/data/pilot-questions.json'), 'utf8'))
  .filter((q) => q.sourceType === 'COMPANY_SPECIFIC')

const companies = {
  Google: { themes: ['large-scale reliability', 'data-informed engineering'], values: ['reasoning through ambiguity', 'cross-team technical influence'], scale: ['global read-heavy traffic', 'multi-region data processing'] },
  Microsoft: { themes: ['enterprise compatibility', 'accessible cloud products'], values: ['growth through feedback', 'collaboration across product boundaries'], scale: ['regulated enterprise tenants', 'hybrid cloud and client environments'] },
  Amazon: { themes: ['operational ownership', 'customer-focused efficiency'], values: ['ownership during difficult delivery', 'working backward from customer impact'], scale: ['bursty commerce traffic', 'independently deployable regional services'] },
  Apple: { themes: ['privacy-preserving product quality', 'hardware-software integration'], values: ['attention to user experience', 'high standards under launch constraints'], scale: ['resource-constrained personal devices', 'privacy-sensitive platform services'] },
  Meta: { themes: ['rapid product experimentation', 'social systems at high scale'], values: ['moving quickly with measured risk', 'cross-functional product impact'], scale: ['high-fanout social traffic', 'real-time experimentation across regions'] },
}

const roles = {
  'Software Engineer': { topics: ['concurrent state transitions', 'dependency failure isolation'], systems: ['distributed coordination service', 'high-volume event platform'], signals: ['tail latency', 'error rate', 'resource saturation'], methods: ['tracing', 'invariant analysis', 'canary rollout'], risks: ['race conditions', 'partial writes', 'retry storms'] },
  'Frontend Developer': { topics: ['rendering performance and hydration', 'accessible interaction state'], systems: ['global web application shell', 'real-time collaborative interface'], signals: ['Core Web Vitals', 'browser traces', 'accessibility-tree checks'], methods: ['performance profiling', 'DOM inspection', 'progressive enhancement'], risks: ['hydration mismatch', 'keyboard exclusion', 'stale client state'] },
  'Backend Developer': { topics: ['transaction consistency', 'idempotent event processing'], systems: ['multi-tenant service API', 'durable workflow backend'], signals: ['p99 latency', 'query plans', 'queue depth'], methods: ['distributed tracing', 'transaction analysis', 'load shedding'], risks: ['duplicate effects', 'deadlocks', 'downstream timeouts'] },
  'Full-Stack Developer': { topics: ['cross-layer authorization', 'client-server data consistency'], systems: ['customer self-service product', 'real-time team workspace'], signals: ['browser failures', 'API traces', 'database timings'], methods: ['end-to-end tracing', 'contract validation', 'progressive delivery'], risks: ['authorization gaps', 'partial updates', 'schema mismatch'] },
  'Data Scientist': { topics: ['experiment validity', 'segment-level metric interpretation'], systems: ['decision experimentation platform', 'large-scale product analytics workflow'], signals: ['confidence intervals', 'sample distributions', 'guardrail metrics'], methods: ['power analysis', 'bias checks', 'holdout validation'], risks: ['selection bias', 'metric gaming', 'data leakage'] },
  'ML / AI Engineer': { topics: ['training-serving consistency', 'model quality under drift'], systems: ['online model-serving platform', 'retrieval and ranking pipeline'], signals: ['slice quality', 'serving latency', 'feature drift'], methods: ['golden-set evaluation', 'shadow traffic', 'controlled rollout'], risks: ['unsafe output', 'feature leakage', 'model rollback failure'] },
  'Cloud / DevOps Engineer': { topics: ['multi-region recovery', 'deployment safety and drift'], systems: ['global delivery platform', 'service reliability control plane'], signals: ['SLO burn rate', 'infrastructure events', 'capacity saturation'], methods: ['configuration diffing', 'failure drills', 'progressive rollout'], risks: ['regional outage', 'credential exposure', 'configuration drift'] },
  'Mobile Developer': { topics: ['offline synchronization', 'device lifecycle reliability'], systems: ['privacy-sensitive mobile client platform', 'cross-device notification service'], signals: ['crash-free sessions', 'startup time', 'battery and network cost'], methods: ['device profiling', 'lifecycle tracing', 'staged release'], risks: ['process termination', 'intermittent connectivity', 'unsafe local storage'] },
  'Cybersecurity Analyst': { topics: ['identity compromise detection', 'incident containment and evidence'], systems: ['enterprise threat-detection platform', 'privileged-access monitoring service'], signals: ['authentication anomalies', 'endpoint events', 'threat-intelligence matches'], methods: ['timeline reconstruction', 'IOC correlation', 'control validation'], risks: ['attacker persistence', 'evidence loss', 'excessive privilege'] },
  'QA / Test Engineer': { topics: ['risk-based release coverage', 'nondeterministic failure diagnosis'], systems: ['distributed test execution platform', 'production quality-gate service'], signals: ['failure trends', 'coverage gaps', 'escaped-defect rate'], methods: ['boundary analysis', 'failure minimization', 'deterministic replay'], risks: ['false confidence', 'environment contamination', 'flaky gating'] },
}

const oldAssignments = [
  ['Software Engineer','Technical',0], ['Software Engineer','Technical',1], ['Backend Developer','Technical',0], ['Backend Developer','Technical',1],
  ['Software Engineer','Behavioral',0], ['Software Engineer','Behavioral',1], ['Full-Stack Developer','Behavioral',0], ['Full-Stack Developer','Behavioral',1],
  ['Software Engineer','System Design',0], ['Software Engineer','System Design',1], ['Cloud / DevOps Engineer','System Design',0], ['Cloud / DevOps Engineer','System Design',1],
]
const levels = ['Medium', 'Hard']
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const criterion = (order, name, description, evidence, alternative, keywords) => ({ order, name, description, expectedEvidence: evidence, acceptableAlternatives: alternative, keywords, weight: 20 })

const questions = []
for (const [company, companyPlan] of Object.entries(companies)) {
  for (const [role, rolePlan] of Object.entries(roles)) {
    for (let variant = 0; variant < 2; variant++) {
      const topic = rolePlan.topics[variant]
      const theme = companyPlan.themes[variant]
      const signal = rolePlan.signals[variant]
      const legacyPrompt = `At ${company}, a change involving ${topic} regresses ${signal} in a system shaped by ${theme}. As a ${role}, how would you isolate the cause, choose a correction, manage rollout risk, and demonstrate recovery?`
      const prompt = variant === 0
        ? `${company} has a production regression in ${signal} immediately after a ${topic} change. As the ${role} on call, build an evidence-driven incident plan: state the first measurements, hypotheses, isolation experiments, safe mitigation, correction, rollout gates, and proof of recovery.`
        : `During a ${company} design review, you discover that the proposed ${topic} approach may fail under ${theme}. As a ${role}, identify the failure mechanism, compare two concrete alternatives, select one, and define tests, telemetry, rollout, and rollback criteria.`
      const points = [
        `Establish scope and a before/after baseline using ${rolePlan.signals.join(', ')}; correlate the regression with the relevant deployment, traffic, data, or configuration change.`,
        `Apply ${rolePlan.methods.join(', ')} to test hypotheses about ${topic}, identify the causal mechanism, and rule out misleading correlations.`,
        `Choose a correction compatible with ${company}'s ${theme} context and explain correctness, performance, maintainability, and cost trade-offs.`,
        `Cover ${rolePlan.risks.join(', ')}, define containment and rollback, and use a staged release that limits affected users or systems.`,
        `Prove recovery against an explicit ${signal} threshold, add a regression test or control, and document monitoring that detects recurrence.`,
      ]
      questions.push({ company, role, type:'Technical', topic, difficulty:levels[variant], sourceType:'COMPANY_SPECIFIC', prompt, legacyPrompt, expectedAnswerSummary:points.join(' '), rubrics:[
        criterion(1,'Baseline and scope',`Measures evidence-based framing of the ${company} ${topic} regression.`,points[0],'Equivalent production signals are acceptable when they establish scope and timing.',`${company},${role},${topic},baseline,${rolePlan.signals.join(',')}`),
        criterion(2,'Causal diagnosis',`Measures systematic root-cause analysis for ${topic}.`,points[1],'Another falsifiable diagnostic method is acceptable.',`${company},${topic},root cause,${rolePlan.methods.join(',')}`),
        criterion(3,'Correction and trade-offs',`Measures technical correctness in the ${company} context.`,points[2],'An alternative correction is acceptable with explicit consequences.',`${company},${theme},${topic},correctness,cost`),
        criterion(4,'Safe rollout',`Measures realistic failure containment.`,points[3],'Equivalent staged rollout and rollback controls are acceptable.',`${company},${rolePlan.risks.join(',')},rollback,canary`),
        criterion(5,'Verified recovery',`Measures proof that the regression is fixed and prevented.`,points[4],'Equivalent measurable release gates are acceptable.',`${company},${signal},regression test,monitoring`),
      ]})
    }

    for (let variant = 0; variant < 2; variant++) {
      const topic = companyPlan.values[variant]
      const artifact = `${rolePlan.signals[variant]} data and a ${role}-owned technical artifact`
      const legacyPrompt = `Tell me about a specific ${role} experience that demonstrates ${topic}, a recurring expectation in ${company}-oriented interviews. Explain the conflict or constraint, your individual decision, the evidence you used, and the measurable impact.`
      const prompt = variant === 0
        ? `${company} emphasizes ${topic}. As a ${role}, tell me about one real situation where your initial plan was challenged. Explain the stakes, evidence, your personal decision, how you handled resistance, the measured result, and what you changed afterward.`
        : `Tell me about a time you demonstrated ${topic} while working as a ${role}. Make the example specific enough for a ${company} interview: compare the options, identify your contribution, show how you influenced others, quantify impact, and discuss a later lesson.`
      const points = [
        `Give one concrete situation relevant to ${role} work, with stakeholders, constraints, and why ${topic} mattered.`,
        `Separate personal ownership from team activity and cite ${artifact} that informed the decision.`,
        `Compare at least two options, explain the trade-off, and show how disagreement or uncertainty was handled constructively.`,
        `Quantify impact on users, quality, reliability, delivery, security, adoption, or cost rather than claiming only that the project succeeded.`,
        `Identify a specific lesson and show how it changed a later decision or created a durable mechanism.`,
      ]
      questions.push({ company, role, type:'Behavioral', topic, difficulty:levels[variant], sourceType:'COMPANY_SPECIFIC', prompt, legacyPrompt, expectedAnswerSummary:points.join(' '), rubrics:[
        criterion(1,'Relevant situation',`Scores specificity and relevance to ${company}, ${role}, and ${topic}.`,points[0],'A different professional example is acceptable when equally concrete.',`${company},${role},${topic},stakes,constraints`),
        criterion(2,'Individual ownership',`Scores what the candidate personally decided and delivered.`,points[1],'Shared work is acceptable when personal contribution is unambiguous.',`${company},${role},ownership,${artifact}`),
        criterion(3,'Judgment and collaboration',`Scores alternatives, trade-offs, and constructive influence.`,points[2],'A different decision framework is acceptable when evidence-based.',`${company},${topic},alternatives,trade-off,collaboration`),
        criterion(4,'Measurable impact',`Scores credibility and relevance of the outcome.`,points[3],'Qualitative impact is acceptable only with observable evidence.',`${company},${role},user impact,quality,reliability,cost`),
        criterion(5,'Learning applied',`Scores reflection that changed later behavior.`,points[4],'A durable prevention mechanism can substitute for a later example.',`${company},${topic},learning,behavior change`),
      ]})
    }

    for (let variant = 0; variant < 2; variant++) {
      const topic = rolePlan.systems[variant]
      const scale = companyPlan.scale[variant]
      const legacyPrompt = `${company} needs a ${topic} supporting ${scale}. As a ${role}, design it entirely in text: quantify requirements, define interfaces and components, trace state and data flow, handle failures and security, estimate capacity, and justify company-relevant trade-offs.`
      const prompt = variant === 0
        ? `${company} is launching a ${topic} for ${scale}. As a ${role}, provide a text-only design with quantified requirements, APIs, component ownership, storage and data flow, capacity estimates, failure recovery, security, observability, and justified trade-offs.`
        : `${company} must evolve an existing ${topic} to support ${scale} without a disruptive cutover. As a ${role}, give a text-only target design and migration plan covering compatibility, state movement, scaling, partial failure, security, rollout stages, rollback, and success metrics.`
      const points = [
        `Define core operations, users, sensitivity, latency, availability, throughput, retention, and cost targets for ${scale}.`,
        `Specify role-appropriate interfaces and boundaries for ingestion or clients, control logic, durable state, asynchronous work, and observability.`,
        `Describe the ${topic} data model, partitioning, read/write path, caching or batching, and correctness for concurrent, retried, or out-of-order operations.`,
        `Address ${rolePlan.risks.join(', ')}, regional and dependency failure, authentication, authorization, encryption, recovery objectives, and graceful degradation.`,
        `Estimate the dominant capacity constraint, justify consistency and availability choices for ${company}'s ${companyPlan.themes[variant]}, and monitor ${rolePlan.signals.join(', ')}.`,
      ]
      questions.push({ company, role, type:'System Design', topic, difficulty:levels[variant], sourceType:'COMPANY_SPECIFIC', prompt, legacyPrompt, expectedAnswerSummary:points.join(' '), rubrics:[
        criterion(1,'Quantified requirements',`Scores whether ${company} scale and constraints drive the design.`,points[0],'Different numeric assumptions are acceptable when consistent.',`${company},${topic},${scale},latency,availability,throughput`),
        criterion(2,'Architecture and interfaces',`Scores component responsibilities and boundaries.`,points[1],'Alternative boundaries are acceptable when coupling is explained.',`${company},${role},${topic},API,components,boundaries`),
        criterion(3,'State and data flow',`Scores end-to-end correctness and storage choices.`,points[2],'Alternative storage choices are acceptable with access-pattern justification.',`${company},${topic},data model,partition,idempotency,ordering`),
        criterion(4,'Reliability and security',`Scores recovery and protection of users and data.`,points[3],'Comparable controls are acceptable with explicit threat and failure coverage.',`${company},${rolePlan.risks.join(',')},authentication,encryption,recovery`),
        criterion(5,'Capacity and trade-offs',`Scores quantitative reasoning and operability.`,points[4],'Different trade-offs are acceptable when tied to stated requirements.',`${company},${topic},capacity,consistency,${rolePlan.signals.join(',')}`),
      ]})
    }
  }
}

oldAssignments.forEach(([role, type, variant], index) => {
  const position = questions.findIndex(q => q.company === 'Google' && q.role === role && q.type === type
    && questions.filter((candidate, candidateIndex) => candidateIndex <= questions.indexOf(q)
      && candidate.company === 'Google' && candidate.role === role && candidate.type === type).length === variant + 1)
  if (position < 0 || !pilot[index]) throw new Error(`Missing original Google pilot slot ${index}`)
  const generated = questions[position]
  questions[position] = {
    ...pilot[index],
    company: 'Google',
    role,
    legacyPrompt: generated.legacyPrompt,
    isOriginalPilot: true,
  }
})

for (const question of questions) {
  if (question.isOriginalPilot) continue
  question.rubrics = question.rubrics.map(rubric => ({
    ...rubric,
    expectedEvidence: `${rubric.expectedEvidence} Evaluate this evidence specifically for ${question.company}, ${question.role}, ${question.type}, and ${question.topic}.`,
  }))
}

if (questions.length !== 300) throw new Error(`Expected 300 questions, got ${questions.length}`)
const combos = Object.groupBy(questions, q => `${q.company}|${q.role}|${q.type}`)
if (Object.keys(combos).length !== 150 || Object.values(combos).some(q => q.length !== 2)) throw new Error('Invalid company/role/type distribution')
if (new Set(questions.map(q => norm(q.prompt))).size !== 300) throw new Error('Duplicate prompts')
if (new Set(questions.map(q => q.expectedAnswerSummary)).size !== 300) throw new Error('Duplicate expected answers')
const evidence = questions.flatMap(q => q.rubrics.map(r => r.expectedEvidence))
if (new Set(evidence).size !== 1500) throw new Error('Duplicate rubric evidence')
if (questions.filter(q => q.legacyPrompt).length !== 300) throw new Error('All revised questions must have migration mappings')
if (questions.filter(q => q.isOriginalPilot).length !== 12) throw new Error('The original 12 Google questions must be included exactly once')

writeFileSync(resolve('src/main/resources/data/company-specific-questions-300.json'), `${JSON.stringify(questions, null, 2)}\n`)
console.log(`Wrote ${questions.length} company-specific questions and ${evidence.length} rubrics; mapped 12 pilot rows for in-place migration.`)
