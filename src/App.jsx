import { useEffect, useRef } from 'react';
import Icon from './components/Icon.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import ToastHost from './components/ToastHost.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ProgressProvider, useProgress } from './hooks/useProgress.jsx';
import { navigate, useRoute } from './hooks/useRoute.js';
import { useTheme } from './hooks/useTheme.js';
import Home from './pages/Home.jsx';
import Learn from './pages/Learn.jsx';
import Challenges from './pages/Challenges.jsx';
import Play from './pages/Play.jsx';
import Progress from './pages/Progress.jsx';
import Lab from './pages/Lab.jsx';
import About from './pages/About.jsx';

const NAV = [
  { id: 'home', label: 'Home', icon: 'home', to: '/' },
  { id: 'learn', label: 'Learn', icon: 'book', to: '/learn' },
  { id: 'challenges', label: 'Challenges', icon: 'gamepad', to: '/challenges' },
  { id: 'progress', label: 'Progress', icon: 'trophy', to: '/progress' },
  { id: 'lab', label: 'Lab Mode', icon: 'flask', to: '/lab' },
  { id: 'about', label: 'About', icon: 'info', to: '/about' },
];
const SUB = [
  { to: '/play/map/1', label: 'Map Coloring', type: 'map' },
  { to: '/play/crypt/1', label: 'Crypt-Arithmetic', type: 'crypt' },
  { to: '/play/queens/1', label: 'Local Search', type: 'queens' },
];

export function BrandMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#0a0e1c" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="6" cy="7" r="2.4" fill="#0a0e1c" /><circle cx="18" cy="6" r="2.4" fill="#0a0e1c" /><circle cx="12" cy="18" r="2.4" fill="#0a0e1c" />
      <path d="M8 7.5l8 -1M7.2 9l3.6 7M16.8 8.3l-3.6 7.8" />
    </svg>
  );
}

function ThemeToggle({ theme, toggle }) {
  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title="Toggle theme">
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} /> {theme === 'dark' ? 'Light' : 'Dark'} mode
    </button>
  );
}

function Shell() {
  const route = useRoute();
  const { theme, toggle } = useTheme();
  const { progress, derived } = useProgress();
  const mainRef = useRef(null);
  const activeId = route.name === 'play' ? 'challenges' : route.name;

  useEffect(() => {
    document.title = `${{ home: 'CSP Challenge Lab', learn: 'Learn CSP', challenges: 'Challenges', play: 'Play', progress: 'Progress', lab: 'Lab Mode', about: 'About' }[route.name] || 'CSP Challenge Lab'} — Think. Constrain. Solve.`;
    mainRef.current && mainRef.current.focus({ preventScroll: true });
  }, [route]);

  let page;
  switch (route.name) {
    case 'learn': page = <Learn topic={route.params.topic} />; break;
    case 'challenges': page = <Challenges />; break;
    case 'play': page = <Play type={route.params.type} level={route.params.level} />; break;
    case 'progress': page = <Progress />; break;
    case 'lab': page = <Lab topic={route.params.topic} />; break;
    case 'about': page = <About />; break;
    default: page = <Home />;
  }

  return (
    <div className="app">
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); mainRef.current && mainRef.current.focus(); }}>Skip to content</a>
      <aside className="sidebar" aria-label="Primary">
        <button type="button" className="brand" onClick={() => navigate('/')} aria-label="CSP Challenge Lab home">
          <span className="brand-mark"><BrandMark /></span>
          <span><span className="brand-name">CSP Challenge Lab</span><br /><span className="brand-sub">Think. Constrain. Solve.</span></span>
        </button>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <div key={n.id}>
              <button type="button" className="nav-item" aria-current={activeId === n.id && !(n.id === 'challenges' && route.name === 'play') ? 'page' : undefined} onClick={() => navigate(n.to)}>
                <Icon name={n.icon} /> {n.label}
              </button>
              {n.id === 'challenges' && SUB.map((s) => (
                <button key={s.type} type="button" className="nav-item nav-sub" aria-current={route.name === 'play' && route.params.type === s.type ? 'page' : undefined} onClick={() => navigate(s.to)}>{s.label}</button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="xp-chip">
            <div className="xp-chip-top"><span>{derived.level.name}</span><strong className="tabular">{progress.xp} XP</strong></div>
            <ProgressBar value={derived.level.pct} max={100} valueText={derived.level.next ? `${derived.level.toNext} XP to ${derived.level.next.name}` : 'Max level'} ariaLabel="Progress to next level" />
          </div>
          <ThemeToggle theme={theme} toggle={toggle} />
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button type="button" className="brand" onClick={() => navigate('/')} aria-label="CSP Challenge Lab home">
            <span className="brand-mark"><BrandMark /></span><span className="brand-name">CSP Lab</span>
          </button>
          <div className="row"><span className="badge badge-accent tabular">{progress.xp} XP</span>
            <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button></div>
        </header>
        <main id="main" tabIndex={-1} ref={mainRef} style={{ outline: 'none' }}>
          <ErrorBoundary resetKey={`${route.name}-${route.params.type}-${route.params.level}`}>{page}</ErrorBoundary>
        </main>
      </div>

      <nav className="tabbar" aria-label="Mobile">
        {NAV.map((n) => (
          <button key={n.id} type="button" className="tab" aria-current={activeId === n.id ? 'page' : undefined} onClick={() => navigate(n.to)}>
            <Icon name={n.icon} />{n.id === 'challenges' ? 'Play' : n.id === 'progress' ? 'Progress' : n.label.replace(' Mode', '')}
          </button>
        ))}
      </nav>
      <ToastHost />
    </div>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <Shell />
    </ProgressProvider>
  );
}
