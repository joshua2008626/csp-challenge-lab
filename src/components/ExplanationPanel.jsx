import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

const TONE_ICON = {
  info: 'info',
  think: 'brain',
  good: 'check-circle',
  bad: 'alert',
  warn: 'alert',
};

/** Visual rendering of constraints being checked. */
export function ConstraintViz({ items }) {
  if (!items || !items.length) return null;
  return (
    <ul className="cviz" aria-label="Constraints involved">
      {items.map((c, i) => (
        <li key={i} className={`cviz-row cviz-${c.status || 'pending'}`}>
          {c.text ? (
            <span className="cviz-text">{c.text}</span>
          ) : (
            <>
              <span className="cviz-pill">
                {c.left.swatch && <i className="cviz-swatch" style={{ background: c.left.swatch }} />}
                <b>{c.left.label}</b>
                {c.left.value && <span className="mono">{c.left.value}</span>}
              </span>
              <span className="cviz-op" aria-label={c.opLabel || c.op}>
                {c.op}
              </span>
              <span className="cviz-pill">
                {c.right.swatch && <i className="cviz-swatch" style={{ background: c.right.swatch }} />}
                <b>{c.right.label}</b>
                {c.right.value && <span className="mono">{c.right.value}</span>}
              </span>
            </>
          )}
          <span className="cviz-status" aria-label={c.status === 'ok' ? 'satisfied' : c.status === 'bad' ? 'violated' : 'not yet decided'}>
            {c.status === 'ok' && <Icon name="check" size={14} strokeWidth={3} />}
            {c.status === 'bad' && <Icon name="x" size={14} strokeWidth={3} />}
            {(!c.status || c.status === 'pending') && <span aria-hidden="true">·</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * message = { tone, title, body, why, constraints, badge }
 * log     = [{ id, tone, text }]   (most recent last)
 * The panel is always driven by real game / algorithm state — the parent builds `message`
 * from the actual event that just happened.
 */
export default function ExplanationPanel({ message, log = [], title = 'Explanation', empty, footer }) {
  const logRef = useRef(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log.length]);

  return (
    <section className="card explain" aria-label={title}>
      <h3 className="card-title">
        <Icon name="brain" /> {title}
        <span className="spacer" />
        {message?.badge && <span className="badge badge-accent">{message.badge}</span>}
      </h3>

      {message ? (
        <div key={message.key ?? message.title} className={`explain-main tone-${message.tone || 'info'}`} aria-live="polite">
          <div className="explain-head">
            <span className="explain-icon">
              <Icon name={TONE_ICON[message.tone] || 'info'} size={18} />
            </span>
            <strong className="explain-title">{message.title}</strong>
          </div>
          {message.body && <p className="explain-body">{message.body}</p>}
          {message.why && (
            <div className="explain-why">
              <span className="explain-why-label">Why?</span>
              <span>{message.why}</span>
            </div>
          )}
          <ConstraintViz items={message.constraints} />
        </div>
      ) : (
        <div className="empty explain-empty">
          <Icon name="sparkles" />
          <h4>{empty?.title || 'Make a move'}</h4>
          <p>{empty?.body || 'Every action is explained here as it happens.'}</p>
        </div>
      )}

      {footer}

      {log.length > 0 && (
        <div className="explain-log-wrap">
          <div className="explain-log-title">Recent activity</div>
          <ol className="explain-log" ref={logRef}>
            {log.slice(-40).map((l) => (
              <li key={l.id} className={`log-${l.tone || 'info'}`}>
                {l.text}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
