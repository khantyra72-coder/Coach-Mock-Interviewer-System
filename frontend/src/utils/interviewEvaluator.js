function normalize(value = '') {
  return value
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9+#().%\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasBehavioralEvidence(label, normalized) {
  const rubricLabel = normalize(label)
  if (!normalized || !rubricLabel) return false

  const situationEvidence = /\b(during|when|while|after|before|migration|project|production|cutover|incident|outage|failure|problem|challenge|unexpected|degradation|contention|risk|impact|stakes|critical)\b/.test(normalized)
  const personalEvidence = /\b(i personally|i|my)\b/.test(normalized)
  const ownershipEvidence = /\b(my responsibility|my role|my task|i (?:owned|led|managed|drove|coordinated|executed|was responsible|was tasked|needed to|had to|took ownership|took responsibility))\b/.test(normalized)
  const actionMatches = normalized.match(/\bi (?:personally )?(?:executed|analyzed|redesigned|updated|implemented|created|built|fixed|refactored|investigated|identified|introduced|changed|spoke|met|prioritized|planned|tested|deployed|redeployed|rolled back|used|decided|proposed|coordinated|communicated|resolved|reproduced|isolated|verified|monitored|mitigated)\b/g) || []
  const actionEvidence = new Set(actionMatches).size >= 1
  const outcomeLanguage = /\b(result|outcome|delivered|restored|resolved|improved|reduced|increased|saved|processed|achieved|seamlessly|successfully)\b/.test(normalized)
  const measurableEvidence = /\b\d+(?:\.\d+)?\s*(?:%|percent|ms|milliseconds?|seconds?|minutes?|hours?|days?|weeks?|months?|x)(?=\s|-|$)/.test(normalized)
  const learningEvidence = /\b(i learned|lesson|taught me|i realized|experience (?:showed|taught)|since then|going forward|next time|i now)\b/.test(normalized)
  const judgmentEvidence = /\b(priorit\w*|because|recognizing|trade-offs?|alternatives?|competing|instead|decision|rationale)\b/.test(normalized)
  const collaborationEvidence = /\b(team|stakeholders?|product manager|aligned|agreed|discussed|reviewed|consensus|partnered|coordinated|communicated)\b/.test(normalized)

  if (/situation|context|stakes|goal and failure|problem context|incident context|symptoms/.test(rubricLabel)) return situationEvidence
  if (/personal responsibility|ownership/.test(rubricLabel)) return ownershipEvidence || (personalEvidence && actionEvidence)
  if (/judgment|decision|collaboration|alternative/.test(rubricLabel)) return judgmentEvidence || collaborationEvidence
  if (/specific actions|constructive action|recovery action|action plan|diagnosis|triage|fix and verification|reproduction/.test(rubricLabel)) return actionEvidence
  if (/measurable result|result|outcome|improvement|impact/.test(rubricLabel)) {
    return outcomeLanguage && (measurableEvidence || /\b(result|outcome|delivered|resolved|achieved)\b/.test(normalized))
  }
  if (/learning|lesson|prevention/.test(rubricLabel)) return learningEvidence

  return false
}

function hasTechnicalEvidence(label, answer) {
  const name = normalize(label)
  const measured = /(?:\$\s*\d|\d+(?:\.\d+)?\s*(?:%|ms|seconds?|minutes?|hours?|days?|x)\b|\bp(?:95|99)\b|\bzero\b)/.test(answer)
  if (/reproduc|baseline|impact|scope|evidence/.test(name)) return /reproduc|replicat|simulat|trigger|fault injection|load test|stress test|experiment|inspect|crash log|thread dump/.test(answer) && (measured || /baseline|failure rate|error rate|metric|monitor|affected/.test(answer))
  if (/root cause|causal|diagnos|isolation|mechanism/.test(name)) return /diagnos|isolat|trace|log|thread dump|profil|inspect|investigat|debug/.test(answer) && /because|cause|saturat|stuck|blocked|timeout|contention|bottleneck|race/.test(answer)
  if (/correction|solution|implement|fix|alternative|comparison|design choice/.test(name)) return /fix|configur|implement|bounded|circuit breaker|retry|replace|refactor|patch|select|choose|compar|versus|option/.test(answer) && /trade-off|tradeoff|because|safe|minimal|resource|complexity|operational|overhead|benefit|drawback/.test(answer)
  if (/proof|correct|verif|validation|measur|result|outcome|prevention|confidence|observability/.test(name)) return /verif|validat|test|regression|monitor|grafana|assert|benchmark|restart/.test(answer) && (measured || /threshold|error rate|capacity|below|under|confirmed/.test(answer))
  if (/failure|rollback|recovery|contain|resilien|rollout|safe/.test(name)) return /failure|fault|crash|termination|timeout|error|risk|degrad|unavailable/.test(answer) && /rollback|contain|fallback|circuit breaker|failover|restore|recovery|revert|gracefully|locally|background worker|next launch|canary|staged/.test(answer)
  return false
}

function hasSystemDesignEvidence(label, answer) {
  const name = normalize(label)
  const measured = /\d+(?:\.\d+)?\s*(?:%|ms|seconds?|minutes?|hours?|rps|qps|million|billion)\b/.test(answer)
  if (/requirement|workload|slo|scale|product/.test(name)) return /requirement|user|request|traffic|latency|availability|throughput|rps|qps|slo|use case/.test(answer) && (measured || /peak|capacity|target|constraint|assume/.test(answer))
  if (/interface|component|boundar|ownership|contract|architecture|control plane|execution plane/.test(name)) return /api|endpoint|service|component|gateway|worker|queue|topic|client|control plane|data plane/.test(answer) && /own|responsib|boundary|contract|call|publish|consume|route|separate|between/.test(answer)
  if (/data model|request flow|state|correctness|storage|persistence|ingestion|pipeline|routing/.test(name)) return /database|table|schema|record|event|state|store|storage|cache|request|message|flow|pipeline|partition/.test(answer) && /idempot|consistent|atomic|transaction|version|sequence|dedup|unique|ordering|read path|write path|persist/.test(answer)
  if (/reliab|security|recovery|failure|safety|integrity|authorization|audit|secure/.test(name)) return /failure|retry|replica|backup|failover|timeout|circuit breaker|dead letter|rollback|recovery|authentication|authorization|encrypt|security|audit/.test(answer) && /idempot|multi-zone|region|restore|contain|fallback|least privilege|token|key|tls|monitor|alert|rto|rpo/.test(answer)
  if (/capacity|trade-off|tradeoff|operation|evolution|efficiency|observability|telemetry/.test(name)) return /scale|capacity|shard|partition|cache|batch|queue|replica|autoscal|monitor|metric|log|trace|deploy|migration/.test(answer) && /trade-off|tradeoff|cost|complexity|latency|throughput|availability|consistency|bottleneck|alert|dashboard|canary|evolve/.test(answer)
  return false
}

function hasCriticalUnsafeRecommendation(answer) {
  const unsafePattern = /(?:disable|turn\s+off|remove|bypass).{0,35}(?:firewalls?|authentication|authorization|encryption|security\s+controls?|monitoring|audit(?:ing)?|backups?|antivirus)|grant.{0,80}(?:global|full|admin(?:istrator)?|root|read\s*\/?\s*write|wildcard|\*\s*[:.]\s*\*)|(?:make|set|expose).{0,35}(?:buckets?|databases?|services?|endpoints?|ports?).{0,25}public|(?:open|allow).{0,25}(?:all|every|any).{0,20}(?:ports?|traffic|users?|addresses?)|(?:store|log|send).{0,35}(?:passwords?|secrets?|credentials?|tokens?).{0,25}(?:plain|unencrypt)|(?:delete|drop|truncate).{0,35}(?:production|databases?|tables?|backups?)/g
  const negationPattern = /(?:do\s+not|don't|never|avoid|must\s+not|should\s+not|instead\s+of|prevent)\s*.{0,28}$/
  return [...answer.matchAll(unsafePattern)].some((match) => {
    const prefix = answer.slice(Math.max(0, match.index - 40), match.index)
    return !negationPattern.test(prefix)
  })
}

export function evaluateAnswer(question, answerText) {
  const normalized = normalize(answerText)
  const rubrics = question.concepts || []
  const unsafeBypass = question.type !== 'Behavioral' && /(?:bypass(?:es|ing)?|skip(?:s|ping)?|disable[sd]?|suppress(?:es|ing)?).{0,45}(?:validat|compiler|security|authentication|authorization|type.?check|warning|error|test|release.?gate)|(?:raw|unparsed|unchecked).{0,35}(?:css|json|string|input|payload)|hardcod(?:e|ed|ing).{0,30}(?:credential|secret|token|fallback|value)/.test(normalized)
  const criticalUnsafe = question.type !== 'Behavioral' && hasCriticalUnsafeRecommendation(normalized)

  if (!rubrics.length) {
    const wordCount = normalized ? normalized.split(' ').length : 0
    let score = normalized
      ? Math.min(100, 25 + (wordCount * 3))
      : 0
    if (criticalUnsafe) score = Math.min(score, 39)

    return {
      score,
      strengths: normalized
        ? ['Submitted a clear written response']
        : ['No answer submitted'],
      weaknesses: wordCount < 20
        ? ['Answer needs more explanation and detail']
        : ['No major structural weakness detected'],
      suggestion: criticalUnsafe
        ? 'The proposed solution contains a critically unsafe action. Preserve security controls, use least privilege, and replace the unsafe action before continuing.'
        : wordCount < 20
        ? 'Explain your reasoning in more detail and include a concrete example.'
        : 'Add a concise conclusion and mention important trade-offs.',
      matchedConcepts: [],
      missingConcepts: [],
    }
  }

  const matched = []
  const missing = []

  rubrics.forEach((rubric) => {
    let found = rubric.keywords.some((keyword) =>
      normalized.includes(normalize(keyword))
    ) || (question.type === 'Behavioral' && hasBehavioralEvidence(rubric.label, normalized))
      || (question.type === 'Technical' && hasTechnicalEvidence(rubric.label, normalized))
      || (question.type === 'System Design' && hasSystemDesignEvidence(rubric.label, normalized))
    const label = normalize(rubric.label)
    if (unsafeBypass && /correction|solution|implement|fix|safety|security/.test(label)) found = false
    if (criticalUnsafe && /correction|solution|implement|fix|safety|security|failure|rollback|recovery|contain|proof|correct|verif|validation/.test(label)) found = false
    ;(found ? matched : missing).push(rubric)
  })

  let score = matched.reduce((total, rubric) => total + rubric.weight, 0)
  const wordCount = normalized ? normalized.split(' ').length : 0
  const relevant = matched.length > 0 && wordCount >= 8

  if (normalized.length === 0) score = 0
  else if (relevant) score = Math.max(score, 65)
  else score = Math.min(score, 39)
  if (unsafeBypass) score = Math.min(score, 69)
  if (criticalUnsafe) score = Math.min(score, 39)

  const strengths = matched.map(
    (rubric) => `Covered ${rubric.label.toLowerCase()}`
  )
  const weaknesses = missing.map(
    (rubric) => `Missing ${rubric.label.toLowerCase()}`
  )
  const rubricSuggestion = missing.length
    ? missing.slice(0, 2).map((rubric) => rubric.guidance).join(' ')
    : 'Strong coverage. Make the answer even clearer with a concise conclusion and a concrete example.'
  const suggestion = criticalUnsafe
    ? `The proposed solution contains a critically unsafe action. Preserve security and safety controls, use least privilege, and replace the unsafe action before applying the remaining rubric guidance. ${rubricSuggestion}`
    : rubricSuggestion

  return {
    score: Math.round(score),
    strengths: strengths.length
      ? strengths
      : ['Submitted an answer for review'],
    weaknesses: weaknesses.length
      ? weaknesses
      : ['No major rubric concepts were missed'],
    suggestion,
    matchedConcepts: matched.map((rubric) => rubric.label),
    missingConcepts: missing.map((rubric) => rubric.label),
  }
}

export function evaluateSession(session) {
  const questionResults = session.questions.map((question, index) => ({
    n: index + 1,
    questionId: question.id,
    text: question.prompt,
    type: question.type,
    topic: question.topic,
    difficulty: question.difficulty,
    answer: session.answers[index] || '',
    model: question.model,
    ...evaluateAnswer(question, session.answers[index] || ''),
  }))

  const answered = questionResults.filter((result) => result.answer.trim().length > 0)
  const overallScore = questionResults.length
    ? Math.round(questionResults.reduce((sum, result) => sum + result.score, 0) / questionResults.length)
    : 0
  const averageFor = (filter) => {
    const matches = questionResults.filter(filter)
    return matches.length ? Math.round(matches.reduce((sum, item) => sum + item.score, 0) / matches.length) : null
  }
  const conceptCoverage = questionResults.flatMap((result) => result.matchedConcepts).length
  const conceptTotal = questionResults.reduce((sum, result) => sum + result.matchedConcepts.length + result.missingConcepts.length, 0)

  const allStrengths = questionResults.flatMap((result) => result.strengths)
  const allWeaknesses = questionResults.flatMap((result) => result.weaknesses)

  return {
    id: session.id,
    completedAt: new Date().toISOString(),
    role: session.role,
    company: session.company,
    type: session.type,
    answeredCount: answered.length,
    questionCount: questionResults.length,
    overallScore,
    message: overallScore >= 80
      ? 'Strong performance with broad rubric coverage.'
      : overallScore >= 60
        ? 'Good foundation. Focus on the missing concepts highlighted below.'
        : 'Keep practising. Add more complete reasoning and concrete details.',
    breakdown: [
      { label: 'Overall rubric coverage', value: overallScore },
      { label: 'Technical depth', value: averageFor((item) => item.type !== 'Behavioral') },
      { label: 'Behavioral structure', value: averageFor((item) => item.type === 'Behavioral') },
      { label: 'Concept completion', value: conceptTotal ? Math.round((conceptCoverage / conceptTotal) * 100) : 0 },
    ].filter((item) => item.value !== null),
    skillScores: {
      algorithm: averageFor((item) => /algorithm|data structure|complexity/i.test(`${item.topic} ${item.text}`)),
      communication: averageFor((item) => item.type === 'Behavioral'),
      problemSolving: averageFor((item) => item.type === 'Technical'),
      systemDesign: averageFor((item) => item.type === 'System Design' || /system design|scalab|architecture/i.test(`${item.topic} ${item.text}`)),
    },
    topStrengths: [...new Set(allStrengths)].slice(0, 3),
    topImprovements: [...new Set(allWeaknesses)].slice(0, 3),
    questions: questionResults,
  }
}
