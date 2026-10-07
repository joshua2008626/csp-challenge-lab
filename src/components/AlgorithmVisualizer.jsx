import Icon from './Icon.jsx';

/**
 * Reusable live algorithm panel.
 *
 *   algorithm : 'BACKTRACKING SEARCH' | 'MIN-CONFLICTS' | …
 *   step/total: current event position
 *   metrics   : [{ label, value, tone?, mono? }]
 *   status    : short sentence ("Trying assignment…")
 *   tone      : good | bad | think | info (colours the status line)
 *   extra     : optional children (domain table, candidate list, …)
 */
export default function AlgorithmVisualizer({ algorithm, step, total, metrics, status, tone = 'info', extra }) {
  const pct = total > 1 ? Math.round((step / (total - 1)) * 100) : 0;
  return (
    <section className="card algo" aria-label="Algorithm state">
      <h3 className="card-title">
        <Icon name="cpu" /> Algorithm
        <span className="spacer" />
        <span className="badge badge-info mono">{algorithm}</span>
      </h3>
      <div className="algo-step">
        <span className="algo-step-label">Step</span>
        <span className="algo-step-value tabular">
          {step + 1} <span className="muted">/ {total}</span>
        </span>
        <div className="algo-step-track" aria-hidden="true">
          <div className="algo-step-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <dl className="algo-metrics">
        {metrics.map((m) => (
          <div key={m.label} className="algo-metric">
            <dt>{m.label}</dt>
            <dd className={`${m.tone || ''} ${m.mono === false ? '' : 'mono'}`}>{m.value}</dd>
          </div>
        ))}
      </dl>
      <div className={`algo-status tone-${tone}`} aria-live="polite">
        <span className="algo-status-dot" />
        <span>
          <span className="muted">Status: </span>
          {status}
        </span>
      </div>
      {extra}
    </section>
  );
}
