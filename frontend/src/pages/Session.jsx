import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
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
const DEFAULT_MINUTES_PER_QUESTION = 3

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
    difficulty: config.difficulty || 'Medium',
    timed: config.timed ?? true,
    sessionDurationMinutes: Number(config.sessionDurationMinutes)
      || questions.length * DEFAULT_MINUTES_PER_QUESTION,
    startedAt: new Date().toISOString(),
    questions,
    answers: questions.map(() => ''),
    reviewFlags: questions.map(() => false),
  }
}

function restoreSession(session) {
  return {
    ...session,
    reviewFlags: session.questions.map((_, index) => Boolean(session.reviewFlags?.[index])),
  }
}

export default function Session() {
  const navigate = useNavigate()
  const location = useLocation()
  const hasNewConfig = Boolean(location.state && Object.keys(location.state).length)
  const [session, setSession] = useState(() => {
    const activeSession = getActiveSession()
    const incomingSessionId = location.state?.backendSessionId
    const isSamePersistedSession = activeSession && incomingSessionId
      && String(activeSession.backendSessionId) === String(incomingSessionId)

    return restoreSession(
      isSamePersistedSession
        ? activeSession
        : hasNewConfig
          ? createSession(location.state)
          : activeSession || createSession({})
    )
  })
  const [currentIndex, setCurrentIndex] = useState(() => {
    const savedIndex = Number(session.currentIndex)
    return Number.isInteger(savedIndex) && savedIndex >= 0 && savedIndex < session.questions.length
      ? savedIndex
      : 0
  })
  const [finishing, setFinishing] = useState(false)
  const [finishError, setFinishError] = useState('')
  const [timeExpired, setTimeExpired] = useState(false)
  const finishingRef = useRef(false)
  const timeUpHandledRef = useRef(false)
  const [showReviewReminder, setShowReviewReminder] = useState(false)
  const [reviewMode, setReviewMode] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
    const sessionDuration = (Number(session.sessionDurationMinutes)
      || session.questions.length * DEFAULT_MINUTES_PER_QUESTION) * 60
    return Math.max(0, sessionDuration - elapsed)
  })

  const currentQuestion = session.questions[currentIndex]
  const markedIndexes = useMemo(
    () => session.reviewFlags
      .map((marked, index) => marked ? index : -1)
      .filter((index) => index >= 0),
    [session.reviewFlags]
  )
  const reviewPosition = reviewMode ? markedIndexes.indexOf(currentIndex) : -1
  const answer = session.answers[currentIndex] || ''
  const answeredCount = useMemo(
    () => session.answers.filter((item) => item.trim().length > 0).length,
    [session.answers]
  )
  const remainingCount = session.questions.length - currentIndex - 1
  const progress = reviewMode
    ? ((reviewPosition + 1) / markedIndexes.length) * 100
    : ((currentIndex + 1) / session.questions.length) * 100
  const subtitle = `${session.role} · ${session.company}`

  useEffect(() => {
    saveActiveSession({ ...session, currentIndex })
  }, [session, currentIndex])

  useEffect(() => {
    if (!hasNewConfig) return
    navigate(location.pathname, { replace: true, state: null })
  }, [hasNewConfig, location.pathname, navigate])

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
    const wasMarked = session.reviewFlags[currentIndex]
    const remainingMarkedIndexes = markedIndexes.filter((index) => index !== currentIndex)

    setSession((previous) => ({
      ...previous,
      reviewFlags: previous.reviewFlags.map((flag, index) => index === currentIndex ? !flag : flag),
    }))
    setShowReviewReminder(false)

    if (reviewMode && wasMarked) {
      if (!remainingMarkedIndexes.length) {
        setReviewMode(false)
      } else {
        const nextIndex = remainingMarkedIndexes.find((index) => index > currentIndex)
          ?? remainingMarkedIndexes[0]
        setCurrentIndex(nextIndex)
      }
    }
  }

  const finishSession = async ({ timedOut = false } = {}) => {
  if (finishingRef.current) return

  finishingRef.current = true
  setFinishing(true)
  setFinishError('')

  let result = evaluateSession(session)

  try {
    if (session.backendSessionId) {
      const answerPayloads = session.backendQuestionsPersisted ? session.answers
        .map((answerText, index) => {
          if (!timedOut && !answerText.trim()) return null

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

      await Promise.all(
        answerPayloads.map((answerPayload) =>
          submitInterviewAnswer(session.backendSessionId, answerPayload)
        )
      )

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
        breakdown: [
          { label: 'Overall rubric coverage', value: backendResult.overallScore },
          { label: 'Technical depth', value: backendResult.technicalScore },
          { label: 'Behavioral structure', value: backendResult.behavioralScore },
          { label: 'System design', value: backendResult.systemDesignScore },
          { label: 'Concept completion', value: backendResult.conceptScore },
        ].filter((item) => Number.isFinite(item.value)),
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
    finishingRef.current = false
    setFinishError(
      error.message || 'Could not save the interview. Please try again.'
    )
    setFinishing(false)
  }
}

  const onTimeUp = useEffectEvent(() => {
    finishSession({ timedOut: true })
  })

  useEffect(() => {
    if (!session.timed || secondsLeft !== 0 || timeUpHandledRef.current) return
    timeUpHandledRef.current = true
    setTimeExpired(true)
    onTimeUp()
  }, [secondsLeft, session.timed])

  const startMarkedReview = () => {
    if (!markedIndexes.length) return
    setReviewMode(true)
    setCurrentIndex(markedIndexes[0])
    setShowReviewReminder(false)
  }

  const requestFinish = () => {
    if (!session.reviewFlags.some(Boolean)) {
      finishSession()
      return
    }
    startMarkedReview()
    setShowReviewReminder(true)
  }

  const goNext = () => {
    if (reviewMode) {
      if (reviewPosition < markedIndexes.length - 1) {
        setCurrentIndex(markedIndexes[reviewPosition + 1])
      } else {
        setShowReviewReminder(true)
      }
      return
    }
    if (currentIndex === session.questions.length - 1) requestFinish()
    else setCurrentIndex((index) => index + 1)
  }

  const goPrevious = () => {
    if (reviewMode) {
      if (reviewPosition > 0) setCurrentIndex(markedIndexes[reviewPosition - 1])
      return
    }
    setCurrentIndex((index) => Math.max(0, index - 1))
  }

  return (
    <section className="screen" id="session">
      <TopBar subtitle={subtitle} rightButton={{ label: 'Leave session', to: '/dashboard' }} />
      <div className="wrap pagepad" style={{ maxWidth: 800 }}>
        <div className="stop">
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            {reviewMode
              ? `Marked question ${reviewPosition + 1} of ${markedIndexes.length}`
              : `Question ${currentIndex + 1} of ${session.questions.length}`}
          </span>
          <div className="prog" aria-label={`${Math.round(progress)}% session progress`}>
            <i style={{ width: `${progress}%` }} />
          </div>
          <div className="timer">{session.timed ? `⏱️ ${formatTime(secondsLeft)}` : 'Untimed'}</div>
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          {reviewMode
            ? reviewPosition === markedIndexes.length - 1
              ? 'Final marked question'
              : `${markedIndexes.length - reviewPosition - 1} marked question${markedIndexes.length - reviewPosition - 1 === 1 ? '' : 's'} left`
            : remainingCount === 0
              ? 'Final question'
              : `${remainingCount} question${remainingCount === 1 ? '' : 's'} left`}
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
            disabled={timeExpired || finishing}
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
              disabled={(reviewMode ? reviewPosition === 0 : currentIndex === 0) || timeExpired || finishing}
              onClick={goPrevious}
            >
              ← Previous
            </button>
            <button type="button" className="btn ghost sm" aria-pressed={session.reviewFlags[currentIndex]} onClick={toggleReview} disabled={timeExpired || finishing}>
              {session.reviewFlags[currentIndex] ? '✓ Marked — click to remove' : '🔖 Mark for review'}
            </button>
            <button
  type="button"
  className="btn end"
  onClick={goNext}
  disabled={timeExpired || finishing}
>
  {finishing
    ? 'Saving…'
    : reviewMode
      ? reviewPosition === markedIndexes.length - 1
        ? 'Finish review →'
        : 'Next marked →'
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

        {timeExpired && (
          <div className="modal-overlay">
            <div className="modal-card" role="alertdialog" aria-modal="true" aria-labelledby="time-up-title" aria-describedby="time-up-description">
              <h3 id="time-up-title">Time is up</h3>
              <p id="time-up-description">
                {finishError
                  ? 'We could not finish the interview automatically. Your answers are still saved in this browser.'
                  : 'Your answers are being saved. Unanswered questions will receive 0 points.'}
              </p>
              {finishError && (
                <div className="modal-actions">
                  <button type="button" className="btn" onClick={() => finishSession({ timedOut: true })} disabled={finishing}>
                    {finishing ? 'Saving…' : 'Try again'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showReviewReminder && <div className="card" style={{ marginTop: 16, padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, flex: 1 }}>
            You still have {session.reviewFlags.filter(Boolean).length} question{session.reviewFlags.filter(Boolean).length === 1 ? '' : 's'} marked for review.
          </span>
          {reviewMode
            ? <button type="button" className="btn ghost sm" onClick={() => setShowReviewReminder(false)}>Continue reviewing</button>
            : <button type="button" className="btn ghost sm" onClick={startMarkedReview}>Review marked questions</button>}
          <button type="button" className="btn sm" onClick={finishSession} disabled={finishing}>Finish anyway</button>
        </div>}

        <div className="card" style={{ marginTop: 16, padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span className="muted" style={{ fontSize: 13 }}>
            You have answered {answeredCount} of {session.questions.length} questions
            {session.reviewFlags.some(Boolean) ? ` · ${session.reviewFlags.filter(Boolean).length} marked for review` : ''}.
          </span>
          <button
  type="button"
  className="btn ghost sm"
  onClick={startMarkedReview}
  disabled={!session.reviewFlags.some(Boolean)}
>
  Review marked ({session.reviewFlags.filter(Boolean).length})
</button>
          <button
  type="button"
  className="btn sm"
  style={{ marginLeft: 'auto' }}
  onClick={requestFinish}
  disabled={finishing}
>
  {finishing ? 'Saving…' : 'End & calculate score'}
</button>
        </div>
      </div>
    </section>
  )
}
