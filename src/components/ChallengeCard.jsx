import Icon from './Icon.jsx';
import ProgressBar from './ProgressBar.jsx';
import { navigate } from '../hooks/useRoute.js';

/**
 * Large entry card for one of the three challenges.
 * progress = { done, total } (optional) — comes from persisted progress.
 */
export default function ChallengeCard({ id, emoji, title, tagline, difficulty, concepts, art, progress, accent, to }) {
  return (
    <article className="challenge-card" style={{ '--accent-card': accent }}>
      <div className="challenge-art" aria-hidden="true">
        {art}
      </div>
      <div className="challenge-body">
        <div className="row">
          <span className="challenge-emoji" aria-hidden="true">
            {emoji}
          </span>
          <h3>{title}</h3>
        </div>
        <p className="challenge-tag">“{tagline}”</p>
        <div className="challenge-meta">
          <span className="badge">
            <Icon name="trending" size={12} /> {difficulty}
          </span>
        </div>
        <ul className="challenge-concepts" aria-label="Concepts covered">
          {concepts.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        {progress && (
          <ProgressBar label="Levels cleared" value={progress.done} max={progress.total} valueText={`${progress.done}/${progress.total}`} fill={accent} />
        )}
        <button type="button" className="btn btn-primary" onClick={() => navigate(to || `/play/${id}/1`)} aria-label={`Play ${title}`}>
          {progress && progress.done > 0 ? 'Continue' : 'Start'} <Icon name="arrow-right" />
        </button>
      </div>
    </article>
  );
}
