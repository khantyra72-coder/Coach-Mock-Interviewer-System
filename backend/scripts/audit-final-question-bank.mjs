import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const files = ['shared-questions-final.json', 'company-specific-questions-final.json']
const questions = files.flatMap(file => JSON.parse(readFileSync(resolve('src/main/resources/data', file), 'utf8')))
const normalize = value => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const stop = new Set('about after against along also and another any are around because been before being between both can company cover describe design each either explain explicit focus for from full give given have how implementation include including into must objective only other over question required response role same should specific state system than that the their them then these they this through under using what when where which while will with would your'.split(' '))
const tokens = value => new Set(normalize(value).split(' ').filter(token => token.length > 3 && !stop.has(token)))
const similarity = (left, right) => {
  let overlap = 0
  for (const token of left) if (right.has(token)) overlap++
  return overlap / (left.size + right.size - overlap)
}

const promptSets = questions.map(question => tokens(question.prompt))
const near72 = []
const near85 = []
for (let left = 0; left < questions.length; left++) {
  for (let right = left + 1; right < questions.length; right++) {
    const score = similarity(promptSets[left], promptSets[right])
    if (score >= 0.72) near72.push({ score, left, right })
    if (score >= 0.85) near85.push({ score, left, right })
  }
}
near72.sort((a, b) => b.score - a.score)
const allRubrics = questions.flatMap(question => question.rubrics)
const rubricIssueCount = questions.filter(question =>
  question.rubrics.length !== 5 ||
  question.rubrics.reduce((sum, rubric) => sum + rubric.weight, 0) !== 100 ||
  new Set(question.rubrics.map(rubric => normalize(rubric.name))).size !== 5
).length

console.log(JSON.stringify({
  questions: questions.length,
  shared: questions.filter(question => question.sourceType === 'SHARED').length,
  companySpecific: questions.filter(question => question.sourceType === 'COMPANY_SPECIFIC').length,
  rubrics: allRubrics.length,
  exactPromptDuplicates: questions.length - new Set(questions.map(question => normalize(question.prompt))).size,
  exactAnswerDuplicates: questions.length - new Set(questions.map(question => normalize(question.expectedAnswerSummary))).size,
  exactRubricEvidenceDuplicates: allRubrics.length - new Set(allRubrics.map(rubric => normalize(rubric.expectedEvidence))).size,
  rubricStructureIssues: rubricIssueCount,
  semanticPairsAtOrAbove72: near72.length,
  semanticPairsAtOrAbove85: near85.length,
  highestSimilarityPairs: near72.slice(0, 10).map(pair => ({
    score: Number(pair.score.toFixed(3)),
    left: questions[pair.left].prompt,
    right: questions[pair.right].prompt,
  })),
}, null, 2))
