import Icon from './Icon.jsx';

/**
 * Progressive hints: each press reveals a more explicit hint (1 → 2 → 3) and costs a small
 * amount of score (accounted for by the parent through `hintsUsed`).
 */
export default function HintSystem({ revealed, max = 3, cost = 40, onRequest, disabled, disabledReason }) {
  const n = revealed.length;
  const done = n >= max;
  return (
    <section className="card hint-card" aria-label="Hints">
      <h3 className="card-title">
        <Icon name="bulb" /> Hints
        <span className="spacer" />
        <span className="badge badge-warn">−{cost} pts each</span>
      </h3>
      {n === 0 ? (
        <p className="muted hint-empty">Stuck? Hints start gentle and get more explicit.</p>
      ) : (
        <ol className="hint-list" aria-live="polite">
          {revealed.map((h, i) => (
            <li key={i} className={`hint-item hint-${i + 1}`}>
              <span className="hint-num">{i + 1}</span>
              <span>{h}</span>
            </li>
          ))}
        </ol>
      )}
      <button
        type="button"
        className="btn btn-sm"
        onClick={onRequest}
        disabled={disabled || done}
        title={disabled ? disabledReason : undefined}
      >
        <Icon name="bulb" />
        {done ? 'All hints used' : n === 0 ? 'Get a hint' : `Hint ${n + 1} of ${max} — more explicit`}
      </button>
      {disabled && disabledReason && <p className="muted hint-reason">{disabledReason}</p>}
    </section>
  );
}
