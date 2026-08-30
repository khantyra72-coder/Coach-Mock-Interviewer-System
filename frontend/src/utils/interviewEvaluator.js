function normalize(value = '') {
  return value
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9+#().\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function evaluateAnswer(question, answerText) {
  const normalized = normalize(answerText)
  const rubrics = question.concepts || []

  if (!rubrics.length) {
    const wordCount = normalized ? normalized.split(' ').length : 0
    const score = normalized
      ? Math.min(100, 25 + (wordCount * 3))
      : 0

    return {
      score,
      strengths: normalized
        ? ['Submitted a clear written response']
        : ['No answer submitted'],
      weaknesses: wordCount < 20
        ? ['Answer needs more explanation and detail']
        : ['No major structural weakness detected'],
      suggestion: wordCount < 20
        ? 'Explain your reasoning in more detail and include a concrete example.'
        : 'Add a concise conclusion and mention important trade-offs.',
      matchedConcepts: [],
      missingConcepts: [],
    }
  }

  const matched = []
  const missing = []

  rubrics.forEach((rubric) => {
    const found = rubric.keywords.some((keyword) =>
      normalized.includes(normalize(keyword))
    )
    ;(found ? matched : missing).push(rubric)
  })

  let score = matched.reduce((total, rubric) => total + rubric.weight, 0)

  if (normalized.length === 0) score = 0
  else if (normalized.length < 25) score = Math.min(score, 20)
  else if (normalized.length < 60) score = Math.min(score, 45)

  const strengths = matched.map(
    (rubric) => `Covered ${rubric.label.toLowerCase()}`
  )
  const weaknesses = missing.map(
    (rubric) => `Missing ${rubric.label.toLowerCase()}`
  )
  const suggestion = missing.length
    ? missing.slice(0, 2).map((rubric) => rubric.guidance).join(' ')
    : 'Strong coverage. Make the answer even clearer with a concise conclusion and a concrete example.'

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
    return matches.length ? Math.round(matches.reduce((sum, item) => sum + item.score, 0) / matches.length) : overallScore
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
    ],
    topStrengths: [...new Set(allStrengths)].slice(0, 3),
    topImprovements: [...new Set(allWeaknesses)].slice(0, 3),
    questions: questionResults,
  }
}
