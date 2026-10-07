import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

function Stat({ label, icon, value, tone }) {
  const prev = useRef(value);
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setBump(true);
      const id = setTimeout(() => setBump(false), 400);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [value]);
  return (
    <div className={`stat ${bump ? 'bump' : ''}`}>
      <div className="stat-label">
        {icon && <Icon name={icon} size={12} />}
        {label}
      </div>
      <div className={`stat-value ${tone || ''}`} aria-live="off">
        {value}
      </div>
    </div>
  );
}

/**
 * items: [{ key, label, icon, value, tone }]  — every number comes from real game state.
 */
export default function ScorePanel({ items, title = 'Scoreboard', columns = 3 }) {
  return (
    <section className="card" aria-label={title}>
      <h3 className="card-title">
        <Icon name="trophy" /> {title}
      </h3>
      <div className="stat-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {items.map((it) => (
          <Stat key={it.key} label={it.label} icon={it.icon} value={it.value} tone={it.tone} />
        ))}
      </div>
    </section>
  );
}
