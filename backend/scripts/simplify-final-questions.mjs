import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const files = ['shared-questions-final.json', 'company-specific-questions-final.json']
const noisyPrompt = /Name the assumption most likely|Separate your own decision|Ground the diagnosis|Answer in text with/

function firstSentence(value) {
  const match = value.trim().match(/^.*?[.!?](?=\s|$)/)
  return (match?.[0] || value.trim()).replace(/\s+/g, ' ')
}

function behavioralPrompt(question) {
  const context = question.company
    ? `in a ${question.company} interview for a ${question.role}`
    : `as a ${question.role}`
  const topic = question.topic.toLowerCase() === 'ethical judgment'
    ? 'an ethical decision'
    : `a situation involving ${question.topic.toLowerCase()}`
  return `Describe a real example ${context} where you handled ${topic}. What did you personally do, and what measurable result followed?`
}

function technicalPrompt(question) {
  return `${firstSentence(question.legacyPrompt)} How would you diagnose and fix it as a ${question.role}? Explain how you would verify the result.`
}

function systemDesignPrompt(question) {
  const scope = question.company ? ` for ${question.company}` : ''
  return `As a ${question.role}, design a ${question.topic.toLowerCase()}${scope}. Explain the main components, data flow, scaling, failure handling, security, and trade-offs.`
}

function simplify(question) {
  if (!noisyPrompt.test(question.prompt) && !noisyPrompt.test(question.legacyPrompt || '')) return question
  const originalPrompt = noisyPrompt.test(question.prompt) ? question.prompt : question.legacyPrompt
  let prompt
  if (question.type === 'Behavioral') prompt = behavioralPrompt(question)
  else if (question.type === 'System Design') prompt = systemDesignPrompt(question)
  else prompt = technicalPrompt(question)
  return { ...question, prompt, legacyPrompt: originalPrompt }
}

for (const file of files) {
  const path = resolve('src/main/resources/data', file)
  const questions = JSON.parse(readFileSync(path, 'utf8'))
  const revised = questions.map(simplify)
  const changed = revised.filter((question, index) => question.prompt !== questions[index].prompt).length
  writeFileSync(path, `${JSON.stringify(revised, null, 2)}\n`)
  console.log(`${file}: simplified ${changed} questions`)
}
