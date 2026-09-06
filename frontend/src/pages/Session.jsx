import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { selectQuestions } from '../data/questionBank.js'
import { evaluateSession } from '../utils/interviewEvaluator.js'
import {
  completeInterview,
  getInterviewDetails,
  submitInterviewAnswer,
} from '../api/interviews.js'
import {
  clearActiveSession,
  getActiveSession,
  saveActiveSession,
  saveLastResult,
} from '../utils/localInterviewStore.js'

const MAX_CHARS = 2000
const MINUTES_PER_QUESTION = 3

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function createSession(config) {
  const selectedTypes = config.types?.length ? config.types : [config.type || 'Technical']
  const questions = config.backendQuestions?.length
    ? config.backendQuestions.map((question) => ({
        id: question.id,
        type: question.category,
        prompt: question.questionText,
        topic: question.topic,
        difficulty: question.difficulty,
        tips: [
          'Explain your reasoning clearly.',
          'Use a concrete example when possible.',
          'Mention important trade-offs.',
        ],
      }))
    : selectedTypes.flatMap((interviewType, index) => selectQuestions(
        interviewType,
        Math.floor((Number(config.questionCount) || 15) / selectedTypes.length) + (index < (Number(config.questionCount) || 15) % selectedTypes.length ? 1 : 0),
        config.role || 'Software Engineer',
        config.company || 'Google'
      )).filter((question, index, all) => all.findIndex((candidate) => candidate.id === question.id || candidate.prompt === question.prompt) === index)
  return {
    id: config.backendSessionId || `local-${Date.now()}`,
backendSessionId: config.backendSessionId || null,
    backendQuestionsPersisted: config.backendQuestionsPersisted ?? Boolean(config.backendQuestions?.length),
    role: config.role || 'Software Engineer',
    company: config.company || 'Google',
    type: selectedTypes.join(', '),
    types: selectedTypes,
    level: config.level || 'Entry (0–2 yrs)',
    difficulty: config.difficulty || 'Medium',
    timed: config.timed ?? true,
    startedAt: new Date().toISOString(),
    questions,
    answers: questions.map(() => ''),
    reviewFlags: questions.map(() => false),
  }
}

export default function Session() {
  const navigate = useNavigate()
  const location = useLocation()
  const hasNewConfig = Boolean(location.state && Object.keys(location.state).length)
  const [session, setSession] = useState(() => (
    hasNewConfig ? createSession(location.state) : getActiveSession() || createSession({})
  ))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [finishing, setFinishing] = useState(false)
const [finishError, setFinishError] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
    const sessionDuration = session.questions.length * MINUTES_PER_QUESTION * 60
    return Math.max(0, sessionDuration - elapsed)
  })

  const currentQuestion = session.questions[currentIndex]
  const answer = session.answers[currentIndex] || ''
  const answeredCount = useMemo(
    () => session.answers.filter((item) => item.trim().length > 0).length,
    [session.answers]
  )
  const remainingCount = session.questions.length - currentIndex - 1
  const progress = ((currentIndex + 1) / session.questions.length) * 100
  const subtitle = `${session.role} · ${session.company}`

  useEffect(() => {
    saveActiveSession(session)
  }, [session])

  useEffect(() => {
    if (!session.timed || secondsLeft <= 0) return undefined
    const timerId = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [session.timed, secondsLeft])

  const updateAnswer = (value) => {
    setSession((previous) => ({
      ...previous,
      answers: previous.answers.map((item, index) => index === currentIndex ? value : item),
    }))
  }

  const toggleReview = () => {
    setSession((previous) => ({
      ...previous,
      reviewFlags: previous.reviewFlags.map((flag, index) => index === currentIndex ? !flag : flag),
    }))
  }

  const finishSession = async () => {
  if (finishing) return

  setFinishing(true)
  setFinishError('')

  let result = evaluateSession(session)

  try {
    if (session.backendSessionId) {
      const answerPayloads = session.backendQuestionsPersisted ? session.answers
        .map((answerText, index) => {
          if (!answerText.trim()) return null

          return {
            questionId: session.questions[index].id,
            answerText: answerText.trim(),
            score: result.questions[index].score,
            feedback: result.questions[index].suggestion,
            coveredConcepts: result.questions[index].strengths.join('; '),
            missingConcepts: result.questions[index].weaknesses.join('; '),
          }
        })
        .filter(Boolean) : []

      for (const answerPayload of answerPayloads) {
        await submitInterviewAnswer(session.backendSessionId, answerPayload)
      }

      const backendResult = await completeInterview(session.backendSessionId, {
        overallScore: result.overallScore,
        technicalScore: result.breakdown.find((item) => item.label === 'Technical depth')?.value ?? null,
        behavioralScore: result.breakdown.find((item) => item.label === 'Behavioral structure')?.value ?? null,
        conceptScore: result.breakdown.find((item) => item.label === 'Concept completion')?.value ?? null,
        algorithmScore: result.skillScores.algorithm,
        communicationScore: result.skillScores.communication,
        problemSolvingScore: result.skillScores.problemSolving,
        systemDesignScore: result.skillScores.systemDesign,
        strengths: result.topStrengths.join('; '),
        improvements: result.topImprovements.join('; '),
        summaryFeedback: result.message,
        resultDetails: JSON.stringify(result),
      })
      const backendDetails = await getInterviewDetails(session.backendSessionId)
      const answerByQuestion = new Map(backendDetails.answers.map((item) => [item.questionId, item]))
      result = {
        ...result,
        overallScore: backendResult.overallScore,
        message: backendResult.summaryFeedback,
        scoringSource: 'SERVER_RUBRIC',
        topStrengths: backendResult.strengths?.split(';').map((item) => item.trim()).filter(Boolean) || [],
        topImprovements: backendResult.improvements?.split(';').map((item) => item.trim()).filter(Boolean) || [],
        questions: result.questions.map((question) => {
          const serverAnswer = answerByQuestion.get(question.questionId)
          if (!serverAnswer) return question
          return {
            ...question,
            score: serverAnswer.score,
            strengths: serverAnswer.coveredConcepts?.split(';').map((item) => item.trim()).filter(Boolean) || [],
            weaknesses: serverAnswer.missingConcepts?.split(';').map((item) => item.trim()).filter(Boolean) || [],
            suggestion: serverAnswer.feedback || 'Review the rubric feedback for this answer.',
          }
        }),
      }
    }

    saveLastResult(result)
    clearActiveSession()
    navigate('/results', { state: { result } })
  } catch (error) {
    setFinishError(
      error.message || 'Could not save the interview. Please try again.'
    )
    setFinishing(false)
  }
}

  const goNext = () => {
    if (currentIndex === session.questions.length - 1) finishSession()
    else setCurrentIndex((index) => index + 1)
  }

  return (
    <section className="screen" id="session">
      <TopBar subtitle={subtitle} rightButton={{ label: 'Leave session', to: '/dashboard' }} />
      <div className="wrap pagepad" style={{ maxWidth: 800 }}>
        <div className="stop">
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            Question {currentIndex + 1} of {session.questions.length}
          </span>
          <div className="prog" aria-label={`${Math.round(progress)}% session progress`}>
            <i style={{ width: `${progress}%` }} />
          </div>
          <div className="timer">{session.timed ? `⏱️ ${formatTime(secondsLeft)}` : 'Untimed'}</div>
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          {remainingCount === 0 ? 'Final question' : `${remainingCount} question${remainingCount === 1 ? '' : 's'} left`}
        </p>

        <div className="card qcard">
          <div className="qhead">
            <div className="qbadge">{currentIndex + 1}</div>
            <div>
              <span className="pill g" style={{ marginBottom: 9 }}>{currentQuestion.type}</span>
              <div className="qt">{currentQuestion.prompt}</div>
              <p className="muted" style={{ fontSize: 12, marginTop: 7 }}>
                {currentQuestion.topic} · {currentQuestion.difficulty}
              </p>
            </div>
          </div>
          <textarea
            aria-label={`Answer to question ${currentIndex + 1}`}
            placeholder="Type your answer here. Structure your thinking and give concrete examples…"
            value={answer}
            maxLength={MAX_CHARS}
            onChange={(event) => updateAnswer(event.target.value)}
          />
          <div className="cc">{answer.length} / {MAX_CHARS} characters · Saved in this browser</div>
          <div className="tips">
            <h5>Tips for a strong answer</h5>
            <ul>{currentQuestion.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
          </div>
          <div className="sact">
            <button
              type="button"
              className="btn ghost sm"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
            >
              ← Previous
            </button>
            <button type="button" className="btn ghost sm" onClick={toggleReview}>
              {session.reviewFlags[currentIndex] ? '✓ Marked for review' : '🔖 Mark for review'}
            </button>
            <button
  type="button"
  className="btn end"
  onClick={goNext}
  disabled={finishing}
>
  {finishing
    ? 'Saving…'
    : currentIndex === session.questions.length - 1
      ? 'Finish interview →'
      : 'Next question →'}
</button>
          </div>
        </div>

        {finishError && (
  <p className="field-error" style={{ marginTop: 16 }}>
    {finishError}
  </p>
)}

        <div className="card" style={{ marginTop: 16, padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="muted" style={{ fontSize: 13 }}>
            You have answered {answeredCount} of {session.questions.length} questions
            {session.reviewFlags.some(Boolean) ? ` · ${session.reviewFlags.filter(Boolean).length} marked for review` : ''}.
          </span>
          <button
  className="btn sm"
  style={{ marginLeft: 'auto' }}
  onClick={finishSession}
  disabled={finishing}
>
  {finishing ? 'Saving…' : 'End & calculate score'}
</button>
        </div>
      </div>
    </section>
  )
}
