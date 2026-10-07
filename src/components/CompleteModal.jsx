import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';
import { formatTime } from '../utils/scoring.js';

const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 9) * 0.07,
  hue: [350, 150, 215, 45, 270][i % 5],
  rot: (i * 53) % 360,
}));

/**
 * End-of-level summary. All numbers are the ones that were just persisted to progress.
 * result = { score, accuracy, seconds, hints, conflicts, mistakes, xp }
 */
export default function CompleteModal({ title, result, outcome, learned, newAchievements, onAgain, onNext, nextLabel, onClose }) {
  const againRef = useRef(null);

  useEffect(() => {
    const prev = document.activeElement;
    againRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (prev && prev.focus) prev.focus();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal complete" role="dialog" aria-modal="true" aria-labelledby="complete-title">
        <div className="confetti" aria-hidden="true">
          {CONFETTI.map((c, i) => (
            <i key={i} style={{ left: `${c.left}%`, animationDelay: `${c.delay}s`, background: `hsl(${c.hue} 85% 62%)`, transform: `rotate(${c.rot}deg)` }} />
          ))}
        </div>
        <div className="complete-emoji" aria-hidden="true">
          🎉
        </div>
        <h2 id="complete-title" className="complete-title">
          Challenge Complete!
        </h2>
        <p className="complete-sub">{title}</p>

        <div className="complete-score">
          <span className="complete-score-label">Score</span>
          <span className="complete-score-value tabular">{result.score}</span>
          {outcome.isBest && <span className="badge badge-good">New best!</span>}
        </div>

        <div className="stat-grid complete-stats">
          <div className="stat">
            <div className="stat-label">
              <Icon name="target" size={12} /> Accuracy
            </div>
            <div className="stat-value">{result.accuracy}%</div>
          </div>
          <div className="stat">
            <div className="stat-label">
              <Icon name="clock" size={12} /> Time
            </div>
            <div className="stat-value">{formatTime(result.seconds)}</div>
          </div>
          <div className="stat">
            <div className="stat-label">
              <Icon name="bulb" size={12} /> Hints
            </div>
            <div className="stat-value">{result.hints}</div>
          </div>
          <div className="stat">
            <div className="stat-label">
              <Icon name="alert" size={12} /> Conflicts
            </div>
            <div className="stat-value">{result.conflicts}</div>
          </div>
          <div className="stat">
            <div className="stat-label">
              <Icon name="trophy" size={12} /> Best score
            </div>
            <div className="stat-value">{outcome.isBest ? result.score : outcome.previousBest?.score ?? result.score}</div>
          </div>
          <div className="stat">
            <div className="stat-label">
              <Icon name="zap" size={12} /> XP
            </div>
            <div className="stat-value good">+{result.xp}</div>
          </div>
        </div>

        {outcome.newAchievements.length > 0 && (
          <div className="complete-ach">
            {outcome.newAchievements.map((a) => (
              <span key={a.id} className="badge badge-accent">
                {a.emoji} {a.name}
              </span>
            ))}
          </div>
        )}

        <div className="learned">
          <div className="learned-title">What you just learned</div>
          <ul>
            {learned.map((l) => (
              <li key={l}>
                <Icon name="check" size={14} strokeWidth={3} /> {l}
              </li>
            ))}
          </ul>
        </div>

        <div className="row complete-actions">
          <button type="button" className="btn" onClick={onAgain} ref={againRef}>
            <Icon name="rotate" /> Play again
          </button>
          <span className="spacer" />
          <button type="button" className="btn btn-primary" onClick={onNext}>
            {nextLabel} <Icon name="arrow-right" />
          </button>
        </div>
      </div>
    </div>
  );
}
