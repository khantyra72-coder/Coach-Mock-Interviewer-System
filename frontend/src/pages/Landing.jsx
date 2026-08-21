import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import Logo from '../components/Logo.jsx'
import useInViewOnce from '../hooks/useInViewOnce.js'
import useScrolled from '../hooks/useScrolled.js'
import {
  Code,
  Layout,
  BarChart3,
  Cloud,
  Target,
  MessageSquare,
  LineChart,
  Building2,
  CheckCircle,
  TrendingUp,
  Clock,
  Star,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Mail,
  Globe,
  Share2,
} from 'lucide-react'

const STATS = [
  { value: 9, suffix: '', label: 'Tech roles' },
  { value: 6, suffix: '', label: 'Top companies' },
  { value: 3, suffix: '', label: 'Interview types' },
  { value: 100, suffix: '%', label: 'Free to practise' },
]

const PATHS = [
  { icon: Code, title: 'Software Engineering', desc: 'Data structures, algorithms, and core computer-science fundamentals.' },
  { icon: Layout, title: 'UI', desc: 'JavaScript, React, CSS, and building fast, accessible interfaces.' },
  { icon: BarChart3, title: 'Data & AI', desc: 'Machine learning, statistics, SQL, and data pipelines.' },
  { icon: Cloud, title: 'Cloud & DevOps', desc: 'CI/CD, containers, and system design at scale.' },
]

const STEPS = [
  { icon: Target, title: 'Pick your role and company', desc: "Choose a tech role and the company you're targeting to get questions in their real style." },
  { icon: MessageSquare, title: 'Answer, one question at a time', desc: 'Respond just like a real interview, with a timer and helpful tips as you go.' },
  { icon: LineChart, title: 'Get scored feedback', desc: 'See your strengths, your weak spots, and a model answer for every question — then track your progress over time.' },
]

const FEATURES = [
  { icon: Building2, title: 'Real company-style questions', desc: 'Practice with questions modelled on the roles and companies you actually want.' },
  { icon: CheckCircle, title: 'Feedback on every answer', desc: 'Clear strengths, areas to improve, and a model answer, not just a score.' },
  { icon: TrendingUp, title: 'Track your progress', desc: 'Watch your scores climb across sessions and see exactly which skills are improving.' },
  { icon: Clock, title: 'Practice anytime', desc: 'No scheduling, no pressure. Rehearse as often as you like, whenever it suits you.' },
]

const TESTIMONIALS = [
  // 5 stars — enthusiastic, clearly loved it
  { quote: "I used to freeze on the 'tell me about yourself' question. After a week of practice, I finally have an answer I'm proud of.", name: 'Aung K.', role: 'Computer Science student', rating: 5 },
  { quote: "The per-question feedback is the best part. It doesn't just give a score — it shows me exactly what to fix.", name: 'Priya S.', role: 'aspiring frontend developer', rating: 5 },
  { quote: 'Being able to pick a role and company made the questions feel real. I walked into my interview genuinely ready.', name: 'Daniel M.', role: 'recent graduate', rating: 5 },
  { quote: 'Watching my score climb from session to session kept me motivated. It made practising feel less scary.', name: 'Hnin W.', role: 'final-year student', rating: 5 },
  { quote: "I practiced for two weeks straight and walked into my interview feeling like I'd already done it before. I genuinely can't recommend this enough.", name: 'Marcus T.', role: 'backend developer', rating: 5 },

  // 4.5 stars — very positive, with a tiny gentle nitpick
  { quote: 'The feedback after each answer completely changed how I prepare. My only small wish is being able to save favorite questions to revisit later.', name: 'Sophia R.', role: 'career switcher', rating: 4.5 },
  { quote: 'This made me so much more comfortable talking through my thought process out loud. The one nitpick is the timer feels a touch aggressive on the harder questions.', name: 'Kevin L.', role: 'junior data analyst', rating: 4.5 },
  { quote: "Practicing with real company-style questions made such a difference in my confidence. I'd just love a dark mode for late-night sessions.", name: 'Amara O.', role: 'final-year student', rating: 4.5 },

  // 4 stars — positive and helpful, with one honest small limitation
  { quote: 'Solid practice sessions and the model answers are genuinely useful. Wish there were more questions specific to iOS roles though.', name: 'Ben H.', role: 'mobile developer', rating: 4 },
  { quote: 'Helped me structure my answers so much better using STAR. Would love voice practice too instead of typing everything out.', name: 'Grace P.', role: 'QA engineer', rating: 4 },
  { quote: 'The company-style questions are a great touch. My only wish is a few more system design scenarios at the senior level.', name: 'Tariq M.', role: 'DevOps engineer', rating: 4 },
  { quote: 'Great for building confidence before real interviews. I did notice the same couple of questions repeat if you practice a lot in one week.', name: 'Wei C.', role: 'recent bootcamp graduate', rating: 4 },
  { quote: 'Really useful feedback on structure and clarity. Would be even better with more ML-specific technical questions.', name: 'Fatima Z.', role: 'data scientist', rating: 4 },
  { quote: 'Liked how it broke down strengths and weaknesses per answer. A mobile app version would make it easier to practice on the go.', name: 'Owen S.', role: 'frontend developer', rating: 4 },
  { quote: 'Practicing under a timer helped me a lot with pacing. Just wish there were more behavioral questions tailored to non-traditional backgrounds.', name: 'Lena V.', role: 'career switcher into tech', rating: 4 },
]

const FAQS = [
  { q: 'Is AceInterview free?', a: 'Yes. You can create an account and start practising interviews at no cost.' },
  { q: 'Do I need to prepare anything before I start?', a: 'Nothing at all. Just pick a role, choose a company style, and begin — the questions and tips guide you through each step.' },
  { q: 'What kinds of interviews can I practise?', a: 'Technical, behavioral, and system-design questions across tech roles like software engineering, frontend, backend, data, and more.' },
  { q: 'How does the scoring work?', a: 'After each session, AceInterview reviews your answers and gives you a score, your strengths, your areas to improve, and a model answer for every question.' },
  { q: 'Are the companies real?', a: "The company options are used to shape the style of questions so your practice feels realistic. AceInterview isn't affiliated with or endorsed by any company." },
  { q: 'Can I track my progress over time?', a: 'Yes. Your dashboard shows your score history and which skills are improving, so you can see yourself getting better session by session.' },
  { q: 'Who is AceInterview for?', a: 'Students, fresh graduates, and job seekers who want a low-pressure, repeatable way to practise interviews and build confidence.' },
]

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const STAR_SIZE = 14

function HalfStar({ size }) {
  return (
    <span className="star-half" style={{ width: size, height: size }}>
      <Star size={size} className="star-half-base" fill="none" strokeWidth={1.5} />
      <span className="star-half-clip">
        <Star size={size} className="star-half-fill" fill="currentColor" strokeWidth={0} />
      </span>
    </span>
  )
}

function renderStars(rating) {
  const full = Math.floor(rating)
  const hasHalf = rating - full === 0.5
  const stars = []
  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(<Star key={i} size={STAR_SIZE} className="star-full" fill="currentColor" strokeWidth={0} />)
    } else if (i === full && hasHalf) {
      stars.push(<HalfStar key={i} size={STAR_SIZE} />)
    } else {
      stars.push(<Star key={i} size={STAR_SIZE} className="star-empty" fill="none" strokeWidth={1.5} />)
    }
  }
  return stars
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

const STAT_COUNT_DURATION_MS = 1800

function useCountUp(target, active, reducedMotion) {
  const [value, setValue] = useState(() => (reducedMotion ? target : 0))

  useEffect(() => {
    if (reducedMotion) {
      setValue(target)
      return
    }
    if (!active) return

    let rafId
    const start = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - start) / STAT_COUNT_DURATION_MS, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(Math.round(eased * target))
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafId)
  }, [active, reducedMotion, target])

  return value
}

function StatItem({ value, suffix, label, active }) {
  const reducedMotion = usePrefersReducedMotion()
  const displayValue = useCountUp(value, active, reducedMotion)

  return (
    <div className="stat">
      <div className="num">{displayValue}{suffix}</div>
      <div className="label">{label}</div>
    </div>
  )
}

const HERO_LINE1 = 'Practice smarter.'
const HERO_LINE2 = 'Prepare better.'
const HERO_TYPE_SPEED_MS = 80
const HERO_LINE_PAUSE_MS = 300

function renderTypedLine(text, revealed) {
  return text.split('').map((ch, i) => (
    <span key={i} className={i < revealed ? 'hero-ch show' : 'hero-ch'}>{ch}</span>
  ))
}

function HeroHeadline({ active }) {
  const reducedMotion = usePrefersReducedMotion()
  const [revealed1, setRevealed1] = useState(() => (reducedMotion ? HERO_LINE1.length : 0))
  const [revealed2, setRevealed2] = useState(() => (reducedMotion ? HERO_LINE2.length : 0))

  useEffect(() => {
    if (reducedMotion || !active) return
    let cancelled = false
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

    async function run() {
      for (let i = 1; i <= HERO_LINE1.length; i++) {
        if (cancelled) return
        setRevealed1(i)
        await wait(HERO_TYPE_SPEED_MS)
      }
      if (cancelled) return
      await wait(HERO_LINE_PAUSE_MS)
      if (cancelled) return
      for (let i = 1; i <= HERO_LINE2.length; i++) {
        if (cancelled) return
        setRevealed2(i)
        await wait(HERO_TYPE_SPEED_MS)
      }
    }
    run()

    return () => {
      cancelled = true
    }
  }, [active, reducedMotion])

  return (
    <h1 style={{ marginTop: 12 }}>
      {renderTypedLine(HERO_LINE1, revealed1)}
      <br />
      <span className="em">
        {renderTypedLine(HERO_LINE2, revealed2)}
      </span>
    </h1>
  )
}

function useCardsPerView() {
  const [cardsPerView, setCardsPerView] = useState(3)

  useEffect(() => {
    const mqTablet = window.matchMedia('(max-width: 900px)')
    const mqMobile = window.matchMedia('(max-width: 600px)')
    const update = () => {
      setCardsPerView(mqMobile.matches ? 1 : mqTablet.matches ? 2 : 3)
    }
    update()
    mqTablet.addEventListener('change', update)
    mqMobile.addEventListener('change', update)
    return () => {
      mqTablet.removeEventListener('change', update)
      mqMobile.removeEventListener('change', update)
    }
  }, [])

  return cardsPerView
}

function TestimonialCard({ t }) {
  return (
    <div className="card tcard">
      <div className="tstars">{renderStars(t.rating)}</div>
      <p className="tquote">"{t.quote}"</p>
      <div className="tfoot">
        <div className="tavatar">{initials(t.name)}</div>
        <div>
          <div className="tauthor">{t.name}</div>
          <div className="trole">{t.role}</div>
        </div>
      </div>
    </div>
  )
}

const TESTI_AUTO_ADVANCE_MS = 5000
const TESTI_SWIPE_THRESHOLD_PX = 40

function TestimonialCarousel({ testimonials }) {
  const reducedMotion = usePrefersReducedMotion()
  const [carouselRef, carouselInView] = useInViewOnce(0.3)
  const cardsPerView = useCardsPerView()
  const [groupIndex, setGroupIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef(null)

  const totalGroups = Math.ceil(testimonials.length / cardsPerView)

  useEffect(() => {
    setGroupIndex((g) => Math.min(g, totalGroups - 1))
  }, [totalGroups])

  // Single source of truth for the auto-advance timer. groupIndex is a
  // dependency, so EVERY navigation — automatic tick or manual click —
  // runs this effect's cleanup (clearing the current interval) and then
  // re-runs the body (scheduling a fresh 5s interval). That means a
  // manual click can never leave autoplay dead: it always results in
  // exactly one live interval, freshly reset from that moment. Only
  // `paused` (hover) or reducedMotion/visibility can skip rescheduling,
  // and those un-set themselves (mouse leave, scroll into view) which
  // re-runs this same effect and restarts the timer again.
  useEffect(() => {
    if (reducedMotion || !carouselInView || paused || totalGroups <= 1) return
    const id = setInterval(() => {
      setGroupIndex((g) => (g + 1) % totalGroups)
    }, TESTI_AUTO_ADVANCE_MS)
    return () => clearInterval(id)
  }, [reducedMotion, carouselInView, paused, totalGroups, groupIndex])

  if (reducedMotion) {
    return (
      <div className="testi-static-row">
        {testimonials.map((t) => (
          <TestimonialCard key={t.name} t={t} />
        ))}
      </div>
    )
  }

  const startIndex = Math.min(groupIndex * cardsPerView, Math.max(testimonials.length - cardsPerView, 0))
  const trackStyle = { transform: `translateX(-${(startIndex * 100) / cardsPerView}%)` }

  // Wraps in both directions (going back past the first group lands on
  // the last one). Changing groupIndex is all that's needed here — the
  // effect above reacts to it and resets the 5s timer automatically.
  const goTo = (g) => setGroupIndex(((g % totalGroups) + totalGroups) % totalGroups)
  const prev = () => goTo(groupIndex - 1)
  const next = () => goTo(groupIndex + 1)

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta > TESTI_SWIPE_THRESHOLD_PX) prev()
    else if (delta < -TESTI_SWIPE_THRESHOLD_PX) next()
    touchStartX.current = null
  }

  return (
    <div
      ref={carouselRef}
      className={`testi-carousel${carouselInView ? ' in' : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="testi-viewport" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="testi-track" style={trackStyle}>
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="testi-slide"
              style={{ flex: `0 0 ${100 / cardsPerView}%`, maxWidth: `${100 / cardsPerView}%` }}
            >
              <TestimonialCard t={t} />
            </div>
          ))}
        </div>
      </div>

      <div className="testi-nav">
        <button type="button" className="testi-arrow" onClick={prev} aria-label="Previous testimonials">
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <div className="testi-dots">
          {Array.from({ length: totalGroups }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`testi-dot${i === groupIndex ? ' active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to testimonial group ${i + 1}`}
            />
          ))}
        </div>
        <button type="button" className="testi-arrow" onClick={next} aria-label="Next testimonials">
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState(null)
  const [statsRef, statsInView] = useInViewOnce(0.3)
  const [heroRef, heroInView] = useInViewOnce(0.3)
  const scrolled = useScrolled(40)
  const [mobileOpen, setMobileOpen] = useState(false)

  const goToSection = (id) => {
    scrollToId(id)
    setMobileOpen(false)
  }

  return (
    <section className="screen on" id="landing">
      <div className={`top${scrolled ? ' scrolled' : ''}`}>
        <div className="wrap">
          <Logo onClick={() => navigate('/')} />
          <div className="bname">AceInterview</div>
          <nav className={`tnav${mobileOpen ? ' mobile-open' : ''}`}>
            <a onClick={() => goToSection('how')}>How it works</a>
            <a onClick={() => goToSection('features')}>Features</a>
            <a onClick={() => goToSection('paths')}>Roles</a>
          </nav>
          <button
            type="button"
            className="nav-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} strokeWidth={1.8} /> : <Menu size={20} strokeWidth={1.8} />}
          </button>
          <button className="btn ghost sm" onClick={() => navigate('/login')}>Log in</button>
          <button className="btn sm" onClick={() => navigate('/register')}>Sign up</button>
        </div>
      </div>

      <div className="hero-band">
        <div className="wrap">
        {/* ===== HERO ===== */}
        <div className="hero" ref={heroRef}>
          <div className="hero-copy">
            <span className="eyebrow">Tech interview practice, done right</span>
            <HeroHeadline active={heroInView} />
            <p className="lead">
              Run realistic mock interviews for real tech roles and top companies. Get instant,
              honest feedback on every answer — and watch your confidence grow with each session.
            </p>
            <div className="cta">
              <button className="btn" onClick={() => navigate('/register')}>Start practicing free →</button>
              <button className="btn ghost hero-glass" onClick={() => scrollToId('how')}>See how it works</button>
            </div>
            <p className="trust">No credit card needed · Built for students and job seekers</p>
          </div>
          <div className="illus fl">
            <svg viewBox="0 0 460 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A mock interview question being answered and scored instantly">
              <defs>
                <filter id="soft" x="-25%" y="-25%" width="150%" height="150%">
                  <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#0C1A13" floodOpacity="0.08" />
                </filter>
              </defs>
              <ellipse cx="140" cy="135" rx="120" ry="95" fill="#ECF6F1" />
              <ellipse cx="345" cy="300" rx="115" ry="92" fill="#F4FAF7" />
              <g filter="url(#soft)"><rect x="70" y="92" width="264" height="216" rx="22" fill="#FFFFFF" stroke="#E7ECE9" /></g>
              <circle cx="92" cy="116" r="4" fill="#0E9E66" /><circle cx="108" cy="116" r="4" fill="#E4B85C" /><circle cx="124" cy="116" r="4" fill="#E08A80" />
              <line x1="70" y1="134" x2="334" y2="134" stroke="#EEF2F0" strokeWidth="1.5" />
              <rect x="90" y="152" width="30" height="30" rx="9" fill="#0E9E66" />
              <text x="105" y="173" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="15" fontWeight="800" fill="#fff" textAnchor="middle">Q</text>
              <rect x="130" y="156" width="168" height="9" rx="4.5" fill="#E4EAE7" /><rect x="130" y="172" width="120" height="9" rx="4.5" fill="#EEF2F0" />
              <rect x="90" y="198" width="224" height="94" rx="12" fill="#F5F8F6" />
              <rect x="104" y="214" width="196" height="8" rx="4" fill="#DBE5DF" /><rect x="104" y="232" width="176" height="8" rx="4" fill="#E2EAE5" />
              <rect x="104" y="250" width="150" height="8" rx="4" fill="#E2EAE5" /><rect x="104" y="268" width="96" height="8" rx="4" fill="#E9EFEB" />
              <g filter="url(#soft)"><circle cx="366" cy="150" r="52" fill="#FFFFFF" stroke="#E7ECE9" /></g>
              <circle cx="366" cy="150" r="38" fill="none" stroke="#EAF0ED" strokeWidth="9" />
              <circle cx="366" cy="150" r="38" fill="none" stroke="#0E9E66" strokeWidth="9" strokeLinecap="round" strokeDasharray="181.5 238.8" transform="rotate(-90 366 150)" />
              <text x="366" y="157" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="21" fontWeight="800" fill="#0A6E45" textAnchor="middle">76%</text>
              <circle cx="398" cy="112" r="14" fill="#0E9E66" stroke="#fff" strokeWidth="3" />
              <path d="M392 112 l4 4 l7 -8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M84 356 l0 22 l20 -18 z" fill="#0E9E66" />
              <g filter="url(#soft)"><rect x="60" y="300" width="104" height="58" rx="18" fill="#0E9E66" /></g>
              <text x="112" y="339" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="30" fontWeight="800" fill="#fff" textAnchor="middle">?</text>
              <path d="M346 240 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5 z" fill="#E4B85C" />
            </svg>
          </div>
        </div>

        {/* ===== STATS STRIP ===== */}
        <div className="stats" ref={statsRef}>
          {STATS.map((s) => (
            <StatItem
              key={s.label}
              value={s.value}
              suffix={s.suffix}
              label={s.label}
              active={statsInView}
            />
          ))}
        </div>
        </div>
      </div>

      {/* ===== CHOOSE YOUR PATH ===== */}
      <div className="band" id="paths">
        <div className="wrap">
        <div className="grow">
          <Reveal as="h2">Choose your path</Reveal>
          <Reveal as="p" delay={60}>Pick a tech track and get questions tailored to the role you're aiming for.</Reveal>
          <div className="paths">
            {PATHS.map((p, i) => (
              <Reveal
                as="div"
                className="card pcard"
                key={p.title}
                delay={i * 70}
                onClick={() => navigate('/register')}
              >
                <div className="pi"><p.icon size={22} strokeWidth={1.8} /></div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* ===== HOW IT WORKS ===== */}
      <div className="band band-mist" id="how">
        <div className="wrap">
        <div className="how">
          <Reveal as="h2">From nervous to ready in three steps</Reveal>
          <Reveal as="p" delay={60}>A simple loop: practice, get feedback, improve.</Reveal>
          <div className="steps">
            {STEPS.map((s, i) => (
              <Reveal as="div" className="card step" key={s.title} delay={i * 70}>
                <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="si"><s.icon size={22} strokeWidth={1.8} /></div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* ===== WHY ACEINTERVIEW ===== */}
      <div className="band" id="features">
        <div className="wrap">
        <div className="features">
          <Reveal as="h2">Everything you need to walk in confident</Reveal>
          <div className="feat-grid">
            {FEATURES.map((f, i) => (
              <Reveal as="div" className="card feat" key={f.title} delay={i * 60}>
                <div className="fi"><f.icon size={22} strokeWidth={1.8} /></div>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* ===== TESTIMONIALS ===== */}
      <div className="band band-mist">
        <div className="wrap">
        <div className="testi">
          <Reveal as="h2">What learners are saying</Reveal>
          <Reveal as="p" className="sub-t" delay={60}>Real prep, real progress — here's what practising with AceInterview feels like.</Reveal>
          <TestimonialCarousel testimonials={TESTIMONIALS} />
        </div>
        </div>
      </div>

      {/* ===== FAQ ===== */}
      <div className="band">
        <div className="wrap">
        <div className="faq">
          <Reveal as="h2">Frequently asked questions</Reveal>
          {FAQS.map((f, i) => {
            const isOpen = openFaq === i
            return (
              <Reveal
                as="div"
                className={`faq-item${isOpen ? ' active' : ''}`}
                key={f.q}
                delay={Math.min(i, 4) * 50}
              >
                <button
                  className="faq-q"
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                >
                  <span>{f.q}</span>
                  <ChevronDown className="chev" size={18} strokeWidth={1.8} />
                </button>
                <div className="faq-a-wrap" id={`faq-panel-${i}`}>
                  <div className="faq-a-inner">
                    <p className="faq-a">{f.a}</p>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
        </div>
      </div>

      <footer>
        {/* ===== FOOTER CTA BAND ===== */}
        <div className="foot-cta">
          <div className="wrap">
            <Reveal>
              <h2>Ready to ace your next interview?</h2>
              <p>Join students and job seekers sharpening their interview skills with AceInterview.</p>
              <button className="btn" onClick={() => navigate('/register')}>Start practicing free →</button>
            </Reveal>
          </div>
        </div>

        {/* ===== FOOTER MAIN ===== */}
        <div className="foot-main">
          <div className="wrap">
            <div className="foot-top">
              <div className="foot-brand">
                <Logo />
                <p className="foot-tag">AceInterview — practice, feedback, and confidence for your next tech interview.</p>
                <div className="foot-social">
                  <a className="foot-icon" aria-label="Website"><Globe size={16} strokeWidth={1.8} /></a>
                  <a className="foot-icon" aria-label="Email"><Mail size={16} strokeWidth={1.8} /></a>
                  <a className="foot-icon" aria-label="Share"><Share2 size={16} strokeWidth={1.8} /></a>
                </div>
              </div>
              <div className="foot-col">
                <h5>Product</h5>
                <a onClick={() => scrollToId('features')}><ChevronRight className="foot-chev" size={13} strokeWidth={2.2} />Features</a>
                <a onClick={() => scrollToId('paths')}><ChevronRight className="foot-chev" size={13} strokeWidth={2.2} />Roles</a>
                <a onClick={() => scrollToId('how')}><ChevronRight className="foot-chev" size={13} strokeWidth={2.2} />How it works</a>
              </div>
              <div className="foot-col">
                <h5>Company</h5>
                <a><ChevronRight className="foot-chev" size={13} strokeWidth={2.2} />About</a>
                <a><ChevronRight className="foot-chev" size={13} strokeWidth={2.2} />Contact</a>
              </div>
              <div className="foot-col">
                <h5>Support</h5>
                <a><ChevronRight className="foot-chev" size={13} strokeWidth={2.2} />Help</a>
                <a><ChevronRight className="foot-chev" size={13} strokeWidth={2.2} />Privacy</a>
              </div>
            </div>

            <div className="foot-divider" />

            <div className="foot-bottom-row">
              <span className="foot-copy">© 2026 AceInterview · A student project by Group 3, University of Information Technology.</span>
              <div className="foot-legal">
                <a>Privacy</a><span>·</span><a>Terms</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </section>
  )
}
