import ChallengeCard from '../components/ChallengeCard.jsx';
import Icon from '../components/Icon.jsx';
import { MapArt, CryptArt, QueensArt } from '../components/ChallengeArt.jsx';
import { MAP_LEVELS } from '../data/maps.js';
import { CRYPT_PUZZLES } from '../data/puzzles.js';
import { QUEENS_LEVELS } from '../data/queensLevels.js';
import { useProgress } from '../hooks/useProgress.jsx';
import { navigate } from '../hooks/useRoute.js';

export const CHALLENGE_DEFS = [
  { id: 'map', emoji: '🗺️', icon: 'map', title: 'Map Coloring', tagline: 'Color the world without breaking the rules.', difficulty: 'Beginner → Expert', concepts: ['Variables', 'Domains', 'Constraints', 'Backtracking'], art: <MapArt />, accent: 'var(--map-blue)', levels: MAP_LEVELS, noun: (l) => `${l.count} regions · ${l.colorLimit} colours` },
  { id: 'crypt', emoji: '🔐', icon: 'hash', title: 'Crypt-Arithmetic', tagline: 'Turn letters into numbers and solve the equation.', difficulty: 'Beginner → Expert', concepts: ['Constraint propagation', 'Variable assignment', 'Carry constraints', 'Backtracking'], art: <CryptArt />, accent: 'var(--map-yellow)', levels: CRYPT_PUZZLES, noun: (l) => `${l.addends.join(' + ')} = ${l.result}` },
  { id: 'queens', emoji: '♛', icon: 'crown', title: 'Local Search', tagline: 'Escape conflicts and find the perfect state.', difficulty: 'Beginner → Expert', concepts: ['Local search', 'Heuristics', 'Min-Conflicts', 'N-Queens'], art: <QueensArt />, accent: 'var(--map-green)', levels: QUEENS_LEVELS, noun: (l) => `${l.n} queens` },
];

export default function Challenges() {
  const { progress, derived } = useProgress();
  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow"><Icon name="gamepad" size={14} /> Challenges</span>
        <h1>Pick a puzzle. Beat it. Then watch the AI do it.</h1>
        <p>Three kinds of Constraint Satisfaction Problem, five levels each. The difficulty comes from the real size of the search, not from a timer.</p>
      </header>
      <div className="grid grid-3">
        {CHALLENGE_DEFS.map((c) => (
          <ChallengeCard key={c.id} {...c} progress={derived.perChallenge[c.id]} to={`/play/${c.id}/${Math.min(5, derived.perChallenge[c.id].done + 1)}`} />
        ))}
      </div>
      <section className="section">
        <div className="section-head"><div><h2>All levels</h2><p>Your best score is saved in this browser.</p></div></div>
        <div className="level-table">
          {CHALLENGE_DEFS.map((c) => (
            <div className="card level-group" key={c.id}>
              <h3 className="card-title"><Icon name={c.icon} /> {c.title}</h3>
              <ul>
                {c.levels.map((l) => {
                  const b = progress.best[`${c.id}-${l.level}`];
                  return (
                    <li key={l.level}>
                      <button type="button" className="level-row" onClick={() => navigate(`/play/${c.id}/${l.level}`)} aria-label={`${c.title} level ${l.level}: ${l.title}${b ? `, best score ${b.score}` : ', not completed'}`}>
                        <span className={`level-num ${b ? 'done' : ''}`}>{b ? <Icon name="check" size={14} strokeWidth={3} /> : l.level}</span>
                        <span className="level-info"><b>{l.title}</b><small>{c.noun(l)}</small></span>
                        <span className={`badge tier-badge tier-${l.tier}`}>{l.tier}</span>
                        <span className="level-best tabular">{b ? b.score : '—'}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
