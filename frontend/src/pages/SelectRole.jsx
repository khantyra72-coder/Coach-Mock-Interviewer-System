import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Reveal from '../components/Reveal.jsx'
import {
  Code2,
  Palette,
  Server,
  Layers,
  BarChart3,
  BrainCircuit,
  Cloud,
  Smartphone,
  ShieldCheck,
  FlaskConical,
  Search,
  ArrowRight,
  Check,
} from 'lucide-react'

const APP_NAV = [
  { label: 'Interview Setup', to: '/role' },
  { label: 'My Sessions', to: '/sessions' },
  { label: 'Progress Report', to: '/progress' },
]

const ROLES = [
  {
    icon: Code2,
    name: 'Software Engineer',
    count: 12,
    blurb: 'Data structures, algorithms, and core CS fundamentals.',
    skills: ['DSA', 'Algorithms', 'System Design'],
  },
  {
    icon: Palette,
    name: 'Frontend Developer',
    count: 10,
    blurb: 'JavaScript, React, CSS, and building fast, accessible UIs.',
    skills: ['React', 'CSS', 'Accessibility'],
  },
  {
    icon: Server,
    name: 'Backend Developer',
    count: 11,
    blurb: 'APIs, databases, and scalable server-side systems.',
    skills: ['APIs', 'Databases', 'Scalability'],
  },
  {
    icon: Layers,
    name: 'Full-Stack Developer',
    count: 14,
    blurb: 'End-to-end product development across the whole stack.',
    skills: ['Frontend', 'Backend', 'Databases'],
  },
  {
    icon: BarChart3,
    name: 'Data Scientist',
    count: 9,
    blurb: 'Statistics, machine learning, and data-driven insights.',
    skills: ['Statistics', 'ML', 'SQL'],
  },
  {
    icon: BrainCircuit,
    name: 'ML / AI Engineer',
    count: 13,
    blurb: 'Model architecture, training pipelines, and deployment.',
    skills: ['ML Models', 'Python', 'MLOps'],
  },
  {
    icon: Cloud,
    name: 'Cloud / DevOps Engineer',
    count: 8,
    blurb: 'CI/CD, containers, and infrastructure at scale.',
    skills: ['CI/CD', 'Containers', 'Infra'],
  },
  {
    icon: Smartphone,
    name: 'Mobile Developer',
    count: 10,
    blurb: 'Native and cross-platform mobile app development.',
    skills: ['iOS', 'Android', 'React Native'],
  },
  {
    icon: ShieldCheck,
    name: 'Cybersecurity Analyst',
    count: 8,
    blurb: 'Threat detection, risk assessment, and security best practices.',
    skills: ['Security', 'Risk', 'Compliance'],
  },
  {
    icon: FlaskConical,
    name: 'QA / Test Engineer',
    count: 7,
    blurb: 'Test strategy, automation, and quality assurance.',
    skills: ['Testing', 'Automation', 'QA'],
  },
]

export default function SelectRole() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(
    () => ROLES.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase())),
    [query]
  )

  const handleContinue = () => {
    if (!selected) return
    navigate('/setup', { state: { role: selected } })
  }

  return (
    <section className="screen" id="role">
      <TopBar nav={APP_NAV} showUser />
      <div className="wrap pagepad role-select-body">
        <span className="eyebrow">Step 1 of 2</span>
        <h1 className="h-title" style={{ marginTop: 8 }}>Select your role</h1>
        <p className="sub">Choose the tech role you want to practice for.</p>

        <div className="search">
          <Search className="search-icon" size={18} strokeWidth={2} />
          <input
            placeholder="Search tech roles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="roles">
          {filtered.map((r, i) => {
            const isSelected = selected === r.name
            return (
              <Reveal
                as="div"
                key={r.name}
                className={`card role${isSelected ? ' selected' : ''}`}
                delay={i * 50}
                style={{
                  '--role-image-x': `${(i % 5) * 25}%`,
                  '--role-image-y': i < 5 ? '0%' : '100%',
                }}
                onClick={() => setSelected(r.name)}
              >
                {isSelected && (
                  <span className="role-check">
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
                <div className="ri">
                  <r.icon size={22} strokeWidth={1.8} />
                </div>
                <h4>{r.name}</h4>
                <p className="role-blurb">{r.blurb}</p>
                <div className="role-skills">
                  {r.skills.map((s) => (
                    <span className="role-chip" key={s}>{s}</span>
                  ))}
                </div>
                <div className="rq">{r.count} questions available</div>
              </Reveal>
            )
          })}
        </div>

        <button className="role-continue" disabled={!selected} onClick={handleContinue}>
          Continue
          <ArrowRight size={18} strokeWidth={2} />
        </button>
      </div>
    </section>
  )
}
