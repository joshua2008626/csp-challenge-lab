import Icon from './Icon.jsx';
import { SPEEDS } from '../hooks/useSolverPlayer.js';

/**
 * Transport controls for any recorded solver run (useSolverPlayer).
 *   showDetail: show the "key steps / every check" switch (backtracking runs have thousands of low-level checks)
 */
export default function SolverControls({ player, showDetail = true, children }) {
  const { playing, atStart, atEnd, total, index } = player;
  return (
    <section className="card solver-controls" aria-label="Solver controls">
      <h3 className="card-title">
        <Icon name="play" /> Playback
        <span className="spacer" />
        <span className="muted tabular solver-count">
          {index + 1} / {total}
        </span>
      </h3>
      <div className="transport">
        <button type="button" className="btn btn-icon" onClick={player.restart} disabled={atStart && !playing} aria-label="Restart">
          <Icon name="restart" />
        </button>
        <button type="button" className="btn btn-icon" onClick={player.prev} disabled={atStart} aria-label="Previous step">
          <Icon name="step-back" />
        </button>
        <button type="button" className="btn btn-primary transport-play" onClick={player.toggle} aria-label={playing ? 'Pause' : 'Play'}>
          <Icon name={playing ? 'pause' : 'play'} filled />
          {playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}
        </button>
        <button type="button" className="btn btn-icon" onClick={player.next} disabled={atEnd} aria-label="Next step">
          <Icon name="step-forward" />
        </button>
        <button type="button" className="btn btn-icon" onClick={player.end} disabled={atEnd} aria-label="Skip to the end">
          <Icon name="skip-forward" />
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={Math.max(0, total - 1)}
        value={index}
        onChange={(e) => player.seek(e.target.value)}
        aria-label="Step scrubber"
      />
      <div className="row solver-opts">
        <label className="field">
          Speed
          <select value={player.speed} onChange={(e) => player.setSpeed(Number(e.target.value))} aria-label="Playback speed">
            {SPEEDS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        {showDetail && (
          <div className="field">
            Detail
            <div className="seg" role="group" aria-label="Detail level">
              <button type="button" aria-pressed={player.detail === 'key'} onClick={() => player.setDetail('key')}>
                Key steps
              </button>
              <button type="button" aria-pressed={player.detail === 'full'} onClick={() => player.setDetail('full')}>
                Every check
              </button>
            </div>
          </div>
        )}
      </div>
      {children}
    </section>
  );
}
