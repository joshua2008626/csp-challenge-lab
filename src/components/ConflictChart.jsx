/**
 * Conflicts vs iteration. `history` is the real list produced by Min-Conflicts; `upTo` limits how
 * much of it is drawn so the chart grows as the solver plays.
 */
export default function ConflictChart({ history, upTo = history.length - 1, height = 150, title = 'Conflicts vs iteration' }) {
  const data = history.slice(0, Math.max(1, upTo + 1));
  const W = 320, H = height, pl = 30, pr = 10, pt = 12, pb = 24;
  const maxY = Math.max(2, ...history);
  const maxX = Math.max(1, history.length - 1);
  const x = (i) => pl + (i / maxX) * (W - pl - pr);
  const y = (v) => pt + (1 - v / maxY) * (H - pt - pb);
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)},${y(0)} L${x(0)},${y(0)} Z`;
  const last = data[data.length - 1];
  const ticks = [0, Math.round(maxY / 2), maxY].filter((v, i, a) => a.indexOf(v) === i);
  return (
    <figure className="chart" aria-label={`${title}: starts at ${history[0]}, now ${last}`}>
      <figcaption className="chart-title">{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}. Iteration ${data.length - 1}: ${last} conflicts.`}>
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} className="chart-grid" />
            <text x={pl - 6} y={y(t)} className="chart-tick" textAnchor="end" dominantBaseline="central">{t}</text>
          </g>
        ))}
        <line x1={pl} x2={W - pr} y1={y(0)} y2={y(0)} className="chart-zero" />
        <path d={area} fill="url(#chart-fill)" />
        <path d={line} className="chart-line" fill="none" />
        <circle cx={x(data.length - 1)} cy={y(last)} r="4.5" className={`chart-dot ${last === 0 ? 'chart-dot-good' : ''}`} />
        <text x={pl} y={H - 6} className="chart-tick">0</text>
        <text x={W - pr} y={H - 6} className="chart-tick" textAnchor="end">iteration {maxX}</text>
      </svg>
    </figure>
  );
}
