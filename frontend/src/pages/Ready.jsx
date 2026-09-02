import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Reveal from '../components/Reveal.jsx'
import { getStoredUser } from '../api/client.js'
import { getInterviewQuestions, startInterview } from '../api/interviews.js'
import { CheckCircle2, Briefcase, ListChecks, Lightbulb, ArrowRight, Building2 } from 'lucide-react'
import { FaAirbnb, FaAmazon, FaApple, FaMeta, FaSpotify, FaUber } from 'react-icons/fa6'
import { SiNetflix, SiStripe } from 'react-icons/si'
import microsoftLogo from '../assets/logos/microsoft.svg'

const APP_NAV = [
  { label: 'Interview Setup', to: '/setup' },
  { label: 'My Sessions', to: '/sessions' },
  { label: 'Progress Report', to: '/progress' },
  { label: 'Settings', to: '/profile' },
]

// Mirrors the company logo setup in Setup.jsx (kept as a local copy here
// rather than imported, since that file isn't otherwise touched). Same
// import.meta.glob approach: if google.svg is ever missing, this quietly
// resolves to undefined instead of breaking the build.
const googleLogoFiles = import.meta.glob('../assets/logos/google.svg', { eager: true, import: 'default' })
const googleLogo = googleLogoFiles['../assets/logos/google.svg']

const COMPANY_INFO = {
  Google: { color: '#4285F4', letter: 'G', logo: googleLogo, bg: googleLogo ? '#fff' : undefined },
  Amazon: { color: '#FF9900', letter: 'a', logo: FaAmazon },
  Microsoft: { color: '#00A4EF', letter: 'M', logo: microsoftLogo },
  Meta: { color: '#0866FF', letter: 'f', logo: FaMeta },
  Apple: { color: '#111', letter: '▲', logo: FaApple },
  Netflix: { color: '#E50914', letter: 'N', logo: SiNetflix },
  Spotify: { color: '#1DB954', letter: 'S', logo: FaSpotify },
  Stripe: { color: '#635BFF', letter: 'S', logo: SiStripe },
  Airbnb: { color: '#FF385C', letter: 'A', logo: FaAirbnb },
  Uber: { color: '#111', letter: 'U', logo: FaUber },
}

const ROLE_TIPS = {
  'Software Engineer':       ['Think out loud as you work through the problem', 'State your assumptions before coding', 'Talk through time & space complexity', 'Start with a brute-force idea, then optimize'],
  'Frontend Developer':      ['Explain your component structure before coding', 'Mention accessibility and responsiveness', 'Talk through state management choices', 'Consider edge cases in the UI'],
  'Backend Developer':       ['Clarify the API contract before designing', 'Discuss data models and trade-offs', 'Mention error handling and validation', 'Think about scale and performance'],
  'Full-Stack Developer':    ['Cover both frontend and backend reasoning', 'Explain how data flows end to end', 'Mention API design and state handling', 'Call out trade-offs in your choices'],
  'Data Scientist':          ['State your assumptions about the data', 'Explain why you pick a given method', 'Mention how you would validate results', 'Talk through metrics and their trade-offs'],
  'ML / AI Engineer':        ['Explain your model choice and why', 'Discuss data prep and feature choices', 'Mention evaluation metrics and overfitting', 'Consider deployment and monitoring'],
  'Cloud / DevOps Engineer': ['Think about reliability and failure modes', 'Explain your CI/CD reasoning', 'Mention monitoring and rollback', 'Consider cost and scalability trade-offs'],
  'Mobile Developer':        ['Consider different screen sizes and states', 'Mention performance and battery impact', 'Talk through offline and error handling', 'Explain your state management choice'],
  'Cybersecurity Analyst':   ['Think like an attacker and a defender', 'Explain the risk and its impact', 'Mention detection and mitigation steps', 'Consider least-privilege and defense in depth'],
  'QA / Test Engineer':      ['Cover positive and negative test cases', 'Explain your test strategy and priorities', 'Mention edge cases and boundaries', 'Think about automation vs manual trade-offs'],
}

export default function Ready() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user] = useState(getStoredUser)
  const [starting, setStarting] = useState(false)
const [startError, setStartError] = useState('')

  const {
    role,
    type,
    company,
    level,
    difficulty,
    questionCount = '5',
    topics,
    timed = false,
  } = location.state || {}

  const displayRole = role || type || 'Not specified'
  const displayCompany = company || 'Not specified'
  const companyInfo = COMPANY_INFO[company]
  const tips = ROLE_TIPS[role] || ROLE_TIPS['Software Engineer']

  const handleBegin = async () => {
  if (starting) return

  setStarting(true)
  setStartError('')

  try {
    const backendSession = await startInterview({
      role: role || 'Software Engineer',
      interviewType: type || 'Technical',
      company: company || null,
    })

    const allQuestions = await getInterviewQuestions()
    const matchingQuestions = allQuestions.filter(
      (question) => question.category === (type || 'Technical')
    )
    const otherQuestions = allQuestions.filter(
      (question) => question.category !== (type || 'Technical')
    )
    const selectedQuestions = [...matchingQuestions, ...otherQuestions]
      .slice(0, Number(questionCount) || 5)

    if (!selectedQuestions.length) {
      throw new Error('No interview questions are available.')
    }

    navigate('/session', {
      state: {
        role,
        type,
        company,
        level,
        difficulty,
        questionCount,
        topics,
        timed,
        backendSessionId: backendSession.id,
        backendQuestions: selectedQuestions,
      },
    })
  } catch (error) {
    setStartError(error.message || 'Could not start the interview.')
    setStarting(false)
  }
}

  return (
    <section className="screen" id="ready">
      <TopBar nav={APP_NAV} showUser />
      <div className="wrap pagepad ready-body" style={{ maxWidth: 720 }}>
        <div className="ready-hd">
          <h1>You're ready{user?.name ? `, ${user.name}` : ''}!</h1>
          <p>Take a deep breath. This is a safe space to practice.</p>
        </div>

        <Reveal className="card ready-card">
          <div className="rdrow">
            <div className="rdrow-main">
              <span className="rdrow-icon"><Briefcase size={16} strokeWidth={1.8} /></span>
              <span className="k">You are interviewing for</span>
            </div>
            <span className="v">{displayRole}</span>
          </div>

          <div className="rdrow">
            <div className="rdrow-main">
              {companyInfo ? (
                <span
                  className="rdrow-co-badge"
                  style={{ background: '#fff', border: '1px solid var(--line)', color: companyInfo.color }}
                >
                  {typeof companyInfo.logo === 'string' ? (
                    <img src={companyInfo.logo} alt={`${displayCompany} logo`} />
                  ) : companyInfo.logo ? (
                    <companyInfo.logo size={14} />
                  ) : (
                    companyInfo.letter
                  )}
                </span>
              ) : (
                <span className="rdrow-icon"><Building2 size={16} strokeWidth={1.8} /></span>
              )}
              <span className="k">Company</span>
            </div>
            <span className="v">{displayCompany}</span>
          </div>

          <div className="rdrow">
            <div className="rdrow-main">
              <span className="rdrow-icon"><ListChecks size={16} strokeWidth={1.8} /></span>
              <span className="k">Session</span>
            </div>
            <span className="v">{questionCount} questions{timed ? ' · ~45 minutes' : ''}</span>
          </div>
        </Reveal>

        <Reveal className="rdtips" delay={80}>
          <h3><Lightbulb size={16} strokeWidth={1.8} /> A few gentle tips</h3>
          <ul>
            {tips.map((tip) => (
              <li key={tip}><CheckCircle2 size={15} strokeWidth={2} />{tip}</li>
            ))}
          </ul>
        </Reveal>

        {startError && (
  <p className="field-error" style={{ marginTop: 18 }}>
    {startError}
  </p>
)}

<button
  className="startbtn"
  style={{ marginTop: 22 }}
  onClick={handleBegin}
  disabled={starting}
>
  {starting ? 'Starting interview…' : 'Begin interview'}
  {!starting && <ArrowRight size={19} strokeWidth={2} />}
</button>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button type="button" className="cancel" onClick={() => navigate('/setup', { state: { role } })}>Cancel and go back</button>
        </div>
      </div>
    </section>
  )
}
