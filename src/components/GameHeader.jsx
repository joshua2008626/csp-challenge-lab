import Icon from './Icon.jsx';
import { navigate } from '../hooks/useRoute.js';

/**
 * Header for every challenge page: title, tier, level picker and the Play / Watch-AI mode switch.
 */
export default function GameHeader({ icon, title, tagline, tier, level, levels, onLevel, completed = {}, mode, onMode, modeLabels }) {
  return (
    <header className="game-header">
      <div className="game-header-top">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/challenges')}>
          <Icon name="arrow-right" style={{ transform: 'rotate(180deg)' }} /> Challenges
        </button>
        <span className={`badge tier-badge tier-${tier}`}>{tier}</span>
      </div>
      <div className="game-header-main">
        <div className="game-header-icon" aria-hidden="true">
          <Icon name={icon} size={26} />
        </div>
        <div className="game-header-text">
          <h1>{title}</h1>
          <p>{tagline}</p>
        </div>
      </div>
      <div className="game-header-controls">
        <div className="level-picker" role="group" aria-label="Choose level">
          {levels.map((l) => (
            <button
              key={l.level}
              type="button"
              className="level-pill"
              aria-pressed={l.level === level}
              aria-label={`Level ${l.level}: ${l.title}${completed[l.level] ? ' (completed)' : ''}`}
              title={`${l.title} — ${l.tier}`}
              onClick={() => onLevel(l.level)}
            >
              {completed[l.level] ? <Icon name="check" size={14} strokeWidth={3} /> : l.level}
            </button>
          ))}
        </div>
        <div className="seg" role="tablist" aria-label="Mode">
          {Object.keys(modeLabels).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => onMode(m)}
            >
              <Icon name={modeLabels[m].icon} />
              {modeLabels[m].label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
