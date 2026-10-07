export default function ProgressBar({ label, value, max = 100, valueText, fill, large = false, ariaLabel }) {
  const pct = Math.max(0, Math.min(100, max === 0 ? 0 : (value / max) * 100));
  return (
    <div className={`pbar ${large ? 'pbar-lg' : ''}`}>
      {(label || valueText !== undefined) && (
        <div className="pbar-top">
          <span>{label}</span>
          <strong>{valueText !== undefined ? valueText : `${Math.round(pct)}%`}</strong>
        </div>
      )}
      <div
        className="pbar-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={ariaLabel || label || 'progress'}
      >
        <div className="pbar-fill" style={{ width: `${pct}%`, ...(fill ? { '--fill': fill } : {}) }} />
      </div>
    </div>
  );
}
