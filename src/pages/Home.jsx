import HeroGraph from '../components/HeroGraph.jsx';
import HowCspWorks from '../components/HowCspWorks.jsx';
import ChallengeCard from '../components/ChallengeCard.jsx';
import Icon from '../components/Icon.jsx';
import { CHALLENGE_DEFS } from './Challenges.jsx';
import { navigate } from '../hooks/useRoute.js';
import { useProgress } from '../hooks/useProgress.jsx';

const SAME = [
  { name: 'Map Coloring', icon: 'map', v: 'one per region', d: '{Red, Green, Blue, Yellow}', c: 'neighbours differ' },
  { name: 'Crypt-Arithmetic', icon: 'hash', v: 'one per letter', d: '{0 … 9}', c: 'all-different + column sums' },
  { name: 'N-Queens', icon: 'crown', v: 'one per column', d: 'rows {1 … n}', c: 'no shared row / diagonal' },
];

export default function Home() {
  const { derived } = useProgress();
  const started = derived.completed > 0;
  return (
    <div className="page home">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow"><Icon name="sparkles" size={14} /> Interactive AI laboratory</span>
          <h1 id="hero-title" className="hero-title"><span className="grad-text">CSP Challenge Lab</span></h1>
          <p className="hero-sub">Turn constraints into solutions.</p>
          <p className="hero-desc">Learn Constraint Satisfaction Problems by solving interactive puzzles and watching AI think step by step.</p>
          <div className="row hero-cta">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate('/challenges')}>{started ? 'Continue challenges' : 'Start challenge'} <Icon name="arrow-right" /></button>
            <button type="button" className="btn btn-lg" onClick={() => navigate('/learn')}><Icon name="book" /> Learn CSP</button>
          </div>
          <p className="hero-tagline mono">Think. Constrain. Solve.</p>
        </div>
        <HeroGraph />
      </section>

      <section className="section" aria-labelledby="ch-title">
        <div className="section-head"><div><span className="eyebrow">Three challenges</span><h2 id="ch-title">Learn by playing</h2><p>Play every puzzle yourself first, then watch a real solver do the same job and explain each decision.</p></div></div>
        <div className="grid grid-3">
          {CHALLENGE_DEFS.map((c) => <ChallengeCard key={c.id} {...c} progress={derived.perChallenge[c.id]} />)}
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <div className="section-head"><div><span className="eyebrow">The big idea</span><h2 id="how-title">How CSP works</h2><p>Every puzzle here follows the same five steps. Click through them — the search step is a real algorithm running.</p></div></div>
        <HowCspWorks />
      </section>

      <section className="section" aria-labelledby="same-title">
        <div className="section-head"><div><span className="eyebrow">One model, three games</span><h2 id="same-title">Different puzzles, same structure</h2><p>The solvers in this app all consume the same CSP object: variables, domains and constraints.</p></div></div>
        <div className="grid grid-3">
          {SAME.map((s) => (
            <article className="card same-card" key={s.name}>
              <h3 className="card-title"><Icon name={s.icon} /> {s.name}</h3>
              <dl>
                <div><dt><i className="csp-dot v" /> Variables</dt><dd>{s.v}</dd></div>
                <div><dt><i className="csp-dot d" /> Domain</dt><dd className="mono">{s.d}</dd></div>
                <div><dt><i className="csp-dot c" /> Constraints</dt><dd>{s.c}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="section cta-band">
        <div><h2>Ready to think like a constraint solver?</h2><p>Fifteen levels, three real algorithms, no fake animations.</p></div>
        <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate('/play/map/1')}>Play level 1 <Icon name="arrow-right" /></button>
      </section>
    </div>
  );
}
