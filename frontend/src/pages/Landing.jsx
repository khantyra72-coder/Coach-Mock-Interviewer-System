import { useNavigate } from 'react-router-dom'

const PATHS = [
  { icon: '💻', title: 'Software Engineering', desc: 'DSA, coding & core CS fundamentals.' },
  { icon: '🎨', title: 'Frontend & UI', desc: 'JavaScript, React, CSS, web performance.' },
  { icon: '📊', title: 'Data & AI', desc: 'ML, statistics, data pipelines & SQL.' },
  { icon: '☁️', title: 'Cloud & DevOps', desc: 'CI/CD, containers, system design.' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <section className="screen on" id="landing">
      <div className="top">
        <div className="wrap">
          <div className="logo" onClick={() => navigate('/')}>A</div>
          <div className="bname">AceInterview</div>
          <nav className="tnav"><a>How it works</a></nav>
          <button className="btn ghost sm" onClick={() => navigate('/login')}>Log in</button>
          <button className="btn sm" onClick={() => navigate('/register')}>Sign up</button>
        </div>
      </div>

      <div className="wrap">
        <div className="hero">
          <div>
            <span className="eyebrow">Tech interview prep</span>
            <h1 style={{ marginTop: 12 }}>
              Practice smarter.<br /><span className="em">Prepare better.</span>
            </h1>
            <p className="lead">
              Realistic mock interviews for real tech roles and companies. Get scored feedback on
              every answer and watch your progress climb. Create a free account to begin.
            </p>
            <div className="cta">
              <button className="btn" onClick={() => navigate('/register')}>Sign up free →</button>
              <button className="btn ghost" onClick={() => navigate('/login')}>Log in</button>
            </div>
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

        <div className="grow">
          <h2>Where do you want to grow?</h2>
          <p>Sign up and pick a tech track to get a tailored set of questions.</p>
          <div className="paths">
            {PATHS.map((p) => (
              <div className="card pcard" key={p.title} onClick={() => navigate('/register')}>
                <div className="pi">{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
