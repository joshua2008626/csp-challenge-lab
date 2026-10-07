import { useEffect, useMemo, useState } from 'react';
import MiniGraph from './MiniGraph.jsx';
import { EVT } from '../algorithms/backtracking.js';
import { findConflicts, colorById } from '../algorithms/mapColoring.js';
import { DEMO_COLORS, DEMO_EDGES, DEMO_MAP, DEMO_NODES, demoRun } from '../data/demoGraph.js';
import { mapEventMessage } from '../utils/explain.js';

const reduced = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Hero visual: a REAL backtracking run on the demo CSP, replayed on a loop. */
export default function HeroGraph() {
  const { plain } = useMemo(demoRun, []);
  const events = plain.events;
  const [i, setI] = useState(() => (reduced() ? events.length - 1 : 0));

  useEffect(() => {
    if (reduced()) return undefined;
    const last = events.length - 1;
    const id = setTimeout(() => setI((x) => (x >= last ? 0 : x + 1)), i >= last ? 2600 : 520);
    return () => clearTimeout(id);
  }, [i, events.length]);

  const e = events[i];
  let col = e.assignment, tentative = null, conflicts = [];
  if ((e.type === EVT.TRY_VALUE || e.type === EVT.CHECK_CONSTRAINT) && e.variable) { col = { ...e.assignment }; delete col[e.variable]; tentative = { node: e.variable, color: e.value }; }
  if (e.type === EVT.CONFLICT) conflicts = findConflicts(DEMO_MAP, e.assignment);
  const msg = mapEventMessage(DEMO_MAP, e);
  const stats = e.stats;

  return (
    <div className="hero-graph glass" aria-label="Live backtracking search on a small constraint graph">
      <div className="hero-graph-top">
        <span className="badge badge-accent mono">live backtracking search</span>
        <span className="hero-legend" aria-label="Domain">
          domain {'{'}{DEMO_COLORS.map((c) => <i key={c} style={{ background: colorById(c).hex }} />)}{'}'}
        </span>
      </div>
      <MiniGraph nodes={DEMO_NODES} edges={DEMO_EDGES} assignment={col} tentative={tentative} conflicts={conflicts}
        current={e.variable || null} backtrack={e.type === EVT.BACKTRACK ? e.variable : null} width={320} height={210} label="Demo constraint graph" />
      <div className={`hero-caption tone-${msg ? msg.tone : 'info'}`} aria-live="off">
        <b>{msg ? msg.title : ''}</b>
        <span>{stats.backtracks} backtrack{stats.backtracks === 1 ? '' : 's'} · {stats.checks} checks</span>
      </div>
    </div>
  );
}
