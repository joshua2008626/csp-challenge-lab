import { useMemo, useState } from 'react';
import MiniGraph from './MiniGraph.jsx';
import QueensBoard from './QueensBoard.jsx';
import SolverControls from './SolverControls.jsx';
import ConflictChart from './ConflictChart.jsx';
import { ConstraintViz } from './ExplanationPanel.jsx';
import Icon from './Icon.jsx';
import { EVT } from '../algorithms/backtracking.js';
import { buildCryptCSP } from '../algorithms/cryptArithmetic.js';
import { colorById, findConflicts, buildMapCSP } from '../algorithms/mapColoring.js';
import { LS_EVT, recordMinConflicts } from '../algorithms/minConflicts.js';
import { buildQueensCSP } from '../algorithms/nQueens.js';
import { CHAIN_EDGES, CHAIN_NODES, DEMO_COLORS, DEMO_EDGES, DEMO_MAP, DEMO_NODES, TRI_EDGES, TRI_NODES, demoRun } from '../data/demoGraph.js';
import { getMap } from '../data/maps.js';
import { getPuzzle } from '../data/puzzles.js';
import { startingBoard } from '../data/queensLevels.js';
import { useSolverPlayer } from '../hooks/useSolverPlayer.js';
import { propagate } from '../utils/propagation.js';
import { lsStatus, mapEventMessage, minConflictsMessage } from '../utils/explain.js';

const cname = (id) => colorById(id).name;

/* ---- 1. What is a CSP: the same three parts in three different puzzles (counts come from the real builders) ---- */
export function ThreePartsDemo() {
  const [which, setWhich] = useState('map');
  const info = useMemo(() => {
    const m = getMap(3), map = buildMapCSP(m);
    const p = getPuzzle(3), cr = buildCryptCSP(p);
    const q = buildQueensCSP(8);
    return {
      map: { title: 'Map Coloring (Nine Duchies)', csp: map, d: '{Red, Green, Blue, Yellow}', c: 'Color(A) ≠ Color(B) for every border', sample: m.regions.slice(0, 5).map((r) => r.name) },
      crypt: { title: 'SEND + MORE = MONEY', csp: cr, d: '{0 … 9}  (leading letters {1 … 9})', c: 'all letters differ + every column adds up', sample: cr.variables },
      queens: { title: '8-Queens', csp: q, d: 'rows {1 … 8}', c: 'no two queens share a row or diagonal', sample: q.variables.map((v) => `Q${Number(v.slice(1)) + 1}`) },
    }[which];
  }, [which]);
  return (
    <div className="demo">
      <div className="seg" role="group" aria-label="Choose a puzzle">
        {[['map', 'Map'], ['crypt', 'Crypt'], ['queens', 'Queens']].map(([id, l]) => <button key={id} type="button" aria-pressed={which === id} onClick={() => setWhich(id)}>{l}</button>)}
      </div>
      <h4 className="demo-title">{info.title}</h4>
      <div className="parts">
        <div className="part part-v"><b>Variables ({info.csp.variables.length})</b><div className="csp-chips">{info.sample.slice(0, 10).map((s) => <span className="chip" key={s}>{s}</span>)}{info.sample.length > 10 && <span className="chip muted">…</span>}</div></div>
        <div className="part part-d"><b>Domain</b><span className="mono">{info.d}</span></div>
        <div className="part part-c"><b>Constraints ({info.csp.constraints.length})</b><span>{info.c}</span></div>
      </div>
      <p className="muted">Counts above are read from the actual CSP object the solver uses.</p>
    </div>
  );
}

/* ---- 2–8. Colouring explorer: variables, domains, constraints, assignment, consistency, completeness, solution ---- */
export function ColoringLab({ focus }) {
  const [domain, setDomain] = useState(['red', 'green', 'blue']);
  const [asg, setAsg] = useState({});
  const map = { edges: TRI_EDGES };
  const conflicts = findConflicts(map, asg);
  const n = TRI_NODES.length;
  const assigned = TRI_NODES.filter((x) => asg[x.id]).length;
  const complete = assigned === n;
  const consistent = conflicts.length === 0;
  const solution = complete && consistent;

  const cycle = (id) => {
    const seq = [undefined, ...domain];
    const next = seq[(seq.indexOf(asg[id]) + 1) % seq.length];
    setAsg((a) => { const c = { ...a }; if (next) c[id] = next; else delete c[id]; return c; });
  };
  const toggleDomain = (c) => {
    const nd = domain.includes(c) ? domain.filter((x) => x !== c) : [...domain, c];
    if (!nd.length) return;
    setDomain(['red', 'green', 'blue', 'yellow'].filter((x) => nd.includes(x)));
    setAsg((a) => Object.fromEntries(Object.entries(a).filter(([, v]) => nd.includes(v))));
  };
  const rows = [
    { id: 'assignment', label: 'Assignment', value: `{ ${TRI_NODES.map((x) => `${x.id}=${asg[x.id] ? cname(asg[x.id]) : '?'}`).join(', ')} }`, ok: null },
    { id: 'complete', label: 'Complete?', value: complete ? 'Yes — every variable has a value' : `No — ${assigned} of ${n} assigned (partial)`, ok: complete },
    { id: 'consistent', label: 'Consistent?', value: consistent ? 'Yes — no rule is broken' : `No — ${conflicts.map(([a, b]) => `${a}≠${b} broken`).join(', ')}`, ok: consistent },
    { id: 'solution', label: 'Solution?', value: solution ? 'Yes! Complete and consistent' : 'Not yet — needs both', ok: solution },
  ];
  const cons = TRI_EDGES.map(([a, b]) => ({
    left: { label: `Color(${a})`, swatch: asg[a] ? colorById(asg[a]).hex : undefined }, op: '≠', right: { label: `Color(${b})`, swatch: asg[b] ? colorById(asg[b]).hex : undefined },
    status: !asg[a] || !asg[b] ? 'pending' : asg[a] !== asg[b] ? 'ok' : 'bad',
  }));
  const focusRow = { assignment: 'assignment', consistent: 'consistent', complete: 'complete', solution: 'solution' }[focus];

  return (
    <div className="demo demo-split">
      <div>
        <MiniGraph nodes={TRI_NODES} edges={TRI_EDGES} assignment={asg} conflicts={conflicts} showEdges={focus !== 'variables' && focus !== 'domains'} onNodeClick={cycle} width={320} height={200} label="Click a node to change its colour" />
        <p className="muted demo-hint"><Icon name="info" size={14} /> Click a node to cycle through its domain.</p>
        <button type="button" className="btn btn-sm" onClick={() => setAsg({})}><Icon name="rotate" /> Clear</button>
      </div>
      <div className="demo-readout">
        {focus === 'variables' && (
          <ul className="varlist" aria-label="Variables">{TRI_NODES.map((x) => <li key={x.id} className="mono">Color({x.id}) = <b>{asg[x.id] ? cname(asg[x.id]) : '?'}</b></li>)}</ul>
        )}
        {focus === 'domains' && (
          <div>
            <p>Domain of every variable — click to add or remove a colour:</p>
            <div className="domain-edit">
              {['red', 'green', 'blue', 'yellow'].map((c) => (
                <button key={c} type="button" className={`dom-btn ${domain.includes(c) ? 'on' : ''}`} aria-pressed={domain.includes(c)} onClick={() => toggleDomain(c)}>
                  <i style={{ background: colorById(c).hex }} /> {cname(c)}
                </button>
              ))}
            </div>
            <p className="mono big">D = {'{ '}{domain.map(cname).join(', ')}{' }'}</p>
            <p className="muted">{domain.length} value{domain.length > 1 ? 's' : ''} → {domain.length ** n} possible complete assignments for these {n} variables.</p>
          </div>
        )}
        {focus === 'constraints' && <><p>Each line is a constraint. It turns ✓ or ✗ as you colour the nodes.</p><ConstraintViz items={cons} /></>}
        {['assignment', 'consistent', 'complete', 'solution'].includes(focus) && (
          <ul className="readouts">
            {rows.map((r) => (
              <li key={r.id} className={`${r.id === focusRow ? 'focus' : ''} ${r.ok === true ? 'yes' : r.ok === false ? 'no' : ''}`}>
                <span className="ro-label">{r.label}</span>
                <span className="ro-val">{r.value}</span>
                {r.ok !== null && <span className="ro-icon" aria-hidden="true"><Icon name={r.ok ? 'check' : 'x'} size={14} strokeWidth={3} /></span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---- 9 & 11. Backtracking / forward checking on the demo graph (real recorded events) ---- */
const KEY = new Set([EVT.SELECT_VARIABLE, EVT.ASSIGN, EVT.CONFLICT, EVT.BACKTRACK, EVT.PRUNE, EVT.SOLUTION_FOUND, EVT.DEAD_END]);
const isKey = (e) => KEY.has(e.type);
export function SolverDemo({ fc }) {
  const run = useMemo(() => demoRun()[fc ? 'fc' : 'plain'], [fc]);
  const player = useSolverPlayer({ events: run.events, isKey, defaultDetail: 'key' });
  const e = player.current;
  let col = e.assignment, tentative = null, conflicts = [];
  if ((e.type === EVT.TRY_VALUE || e.type === EVT.CHECK_CONSTRAINT) && e.variable) { col = { ...e.assignment }; delete col[e.variable]; tentative = { node: e.variable, color: e.value }; }
  if (e.type === EVT.CONFLICT) { conflicts = findConflicts(DEMO_MAP, e.assignment); if (!conflicts.length && e.variable) { col = { ...e.assignment }; delete col[e.variable]; tentative = { node: e.variable, color: e.value }; } }
  const msg = mapEventMessage(DEMO_MAP, e);
  return (
    <div className="demo demo-split">
      <div>
        <MiniGraph nodes={DEMO_NODES} edges={DEMO_EDGES} assignment={col} tentative={tentative} conflicts={conflicts} domains={fc ? e.domains : null}
          current={e.variable || null} backtrack={e.type === EVT.BACKTRACK ? e.variable : null} width={320} height={210} label="Backtracking demo" />
        <dl className="mini-metrics">
          <div><dt>Backtracks</dt><dd>{e.stats.backtracks}</dd></div><div><dt>Checks</dt><dd>{e.stats.checks}</dd></div>
          {fc && <div><dt>Pruned</dt><dd>{e.stats.prunes}</dd></div>}
        </dl>
      </div>
      <div className="demo-readout">
        {msg && <div className={`how-msg tone-${msg.tone}`}><b>{msg.title}</b><span>{msg.body}</span></div>}
        <SolverControls player={player} showDetail />
      </div>
    </div>
  );
}

/* ---- 10. Constraint propagation: choices cascade (unit propagation on a 2-colour chain) ---- */
export function PropagationDemo() {
  const base = useMemo(() => Object.fromEntries(CHAIN_NODES.map((n) => [n.id, ['red', 'green']])), []);
  const [choice, setChoice] = useState({});
  const result = useMemo(() => {
    const d = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, choice[k] ? [choice[k]] : v]));
    return propagate(d, CHAIN_EDGES);
  }, [base, choice]);
  const asg = Object.fromEntries(Object.entries(result.domains).filter(([, v]) => v.length === 1).map(([k, v]) => [k, v[0]]));
  const cycle = (id) => {
    const seq = [undefined, 'red', 'green'];
    const next = seq[(seq.indexOf(choice[id]) + 1) % 3];
    setChoice((c) => { const x = { ...c }; if (next) x[id] = next; else delete x[id]; return x; });
  };
  const conflicts = result.wipeout ? CHAIN_EDGES.filter(([a, b]) => a === result.wipeout || b === result.wipeout) : [];
  return (
    <div className="demo demo-split">
      <div>
        <MiniGraph nodes={CHAIN_NODES} edges={CHAIN_EDGES} assignment={asg} domains={result.domains} conflicts={result.wipeout ? conflicts : []} onNodeClick={cycle} width={320} height={190} label="Constraint propagation demo" />
        <p className="muted demo-hint"><Icon name="info" size={14} /> Click a node to choose its colour; watch the others change.</p>
        <button type="button" className="btn btn-sm" onClick={() => setChoice({})}><Icon name="rotate" /> Clear</button>
      </div>
      <div className="demo-readout">
        <p>Every node starts with the domain <span className="mono">{'{Red, Green}'}</span>. Constraint propagation uses the rules to remove impossible values <em>without searching</em>.</p>
        {result.steps.length === 0 && !result.wipeout && <div className="empty small"><Icon name="sparkles" /><p>Pick a colour for any node.</p></div>}
        <ol className="prop-steps" aria-live="polite">
          {result.steps.map((s, i) => (
            <li key={i}>{s.from} is {cname(s.color)} ⇒ {s.to} cannot be {cname(s.color)}{s.forced ? <> ⇒ <b>{s.to} must be {cname(s.forced)}</b></> : null}</li>
          ))}
        </ol>
        {result.wipeout && <div className="callout callout-bad"><Icon name="alert" /><span>{result.wipeout} has no value left — these choices contradict each other, so a solver would backtrack right now.</span></div>}
        {!result.wipeout && Object.keys(asg).length === CHAIN_NODES.length && <div className="callout callout-good"><Icon name="check-circle" /><span>One choice was enough: propagation solved the whole chain.</span></div>}
      </div>
    </div>
  );
}

/* ---- 12 & 13. Local search / Min-Conflicts on a small board (real recorded run) ---- */
const lsKey = (e) => e.type !== LS_EVT.PICK_VARIABLE;
export function LocalDemo({ detail }) {
  const rec = useMemo(() => recordMinConflicts(startingBoard(6, 5, 0), { seed: 3, maxIterations: 120, stallLimit: 40 }), []);
  const player = useSolverPlayer({ events: rec.events, isKey: lsKey, defaultDetail: 'key' });
  const e = player.current;
  const cand = e.type === LS_EVT.EVALUATE ? e : e.type === LS_EVT.MOVE && player.previous && player.previous.type === LS_EVT.EVALUATE ? player.previous : null;
  const msg = minConflictsMessage(e);
  const [status] = lsStatus(e);
  const last = rec.events[rec.events.length - 1];
  return (
    <div className="demo demo-split">
      <div>
        <QueensBoard n={6} queens={e.queens} interactive={false} activeCol={e.column !== undefined ? e.column : null}
          chosenRow={e.type === LS_EVT.EVALUATE ? e.chosenRow : e.type === LS_EVT.MOVE ? e.toRow : null} tiedRows={e.type === LS_EVT.EVALUATE ? e.tiedRows : []} fromRow={e.type === LS_EVT.EVALUATE ? e.fromRow : null} />
        <dl className="mini-metrics">
          <div><dt>Iteration</dt><dd>{e.iteration}</dd></div><div><dt>Conflicts</dt><dd>{e.conflicts}</dd></div><div><dt>Status</dt><dd className="small">{status}</dd></div>
        </dl>
      </div>
      <div className="demo-readout">
        {msg && <div className={`how-msg tone-${msg.tone}`}><b>{msg.title}</b><span>{msg.body}</span></div>}
        {detail && cand && (
          <ul className="cands-inline" aria-label="Candidate rows">
            {cand.candidates.map((c) => <li key={c.row} className={c.row === cand.chosenRow ? 'chosen' : ''}>Row {c.row + 1} → <b>{c.conflicts}</b> conflict{c.conflicts === 1 ? '' : 's'}{c.row === cand.chosenRow ? ' ← selected' : ''}</li>)}
          </ul>
        )}
        <ConflictChart history={last.history} upTo={e.history.length - 1} height={120} />
        <SolverControls player={player} showDetail={false} />
      </div>
    </div>
  );
}
