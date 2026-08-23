import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { selectQuestions } from '../data/questionBank.js'
import { evaluateSession } from '../utils/interviewEvaluator.js'
import {
  clearActiveSession,
  getActiveSession,
  saveActiveSession,
  saveLastResult,
} from '../utils/localInterviewStore.js'

const MAX_CHARS = 2000
const DEFAULT_DURATION_SECONDS = 45 * 60

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function createSession(config) {
  const questions = selectQuestions(
    config.type || 'Technical',
    config.questionCount || 5,
    config.role || 'Software Engineer',
    config.company || 'Google'
  )
  return {
    id: `local-${Date.now()}`,
    role: config.role || 'Software Engineer',
    company: config.company || 'Google',
    type: config.type || 'Technical',
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
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
    return Math.max(0, DEFAULT_DURATION_SECONDS - elapsed)
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

  const finishSession = () => {
    const result = evaluateSession(session)
    saveLastResult(result)
    clearActiveSession()
    navigate('/results', { state: { result } })
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
            <button type="button" className="btn end" onClick={goNext}>
              {currentIndex === session.questions.length - 1 ? 'Finish interview →' : 'Next question →'}
            </button>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16, padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="muted" style={{ fontSize: 13 }}>
            You have answered {answeredCount} of {session.questions.length} questions
            {session.reviewFlags.some(Boolean) ? ` · ${session.reviewFlags.filter(Boolean).length} marked for review` : ''}.
          </span>
          <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={finishSession}>
            End & calculate score
          </button>
        </div>
      </div>
    </section>
  )
}
