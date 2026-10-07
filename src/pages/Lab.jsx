import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import ConflictChart from '../components/ConflictChart.jsx';
import { recordSearch } from '../algorithms/backtracking.js';
import { buildCryptCSP, wordValue } from '../algorithms/cryptArithmetic.js';
import { MAP_COLORS, buildMapCSP, colorById } from '../algorithms/mapColoring.js';
import { recordMinConflicts } from '../algorithms/minConflicts.js';
import { countConflicts } from '../algorithms/nQueens.js';
import { CRYPT_PUZZLES } from '../data/puzzles.js';
import { MAP_LEVELS, getMap } from '../data/maps.js';
import { startingBoard } from '../data/queensLevels.js';
import { navigate } from '../hooks/useRoute.js';

const EXPS = {
  map: {
    tab: 'Map Coloring', title: 'Map Coloring using Backtracking Search',
    problem: 'Given a map of regions and a set of colours, colour every region so that no two adjacent regions have the same colour.',
    aim: 'To formulate map colouring as a Constraint Satisfaction Problem and solve it with recursive backtracking search (optionally with MRV ordering and forward checking).',
    algorithm: `function BACKTRACK(assignment, csp):
    if assignment is complete: return assignment
    var ← SELECT-UNASSIGNED-VARIABLE(csp, assignment)   # given order or MRV
    for each value in DOMAIN(var):
        if value is consistent with assignment:         # neighbours differ
            add {var = value} to assignment
            [forward checking: prune neighbours' domains; fail if one empties]
            result ← BACKTRACK(assignment, csp)
            if result ≠ failure: return result
            remove {var = value} from assignment        # backtrack
    return failure`,
    steps: ['Model each region as a variable and the colours as its domain.', 'Add one constraint Color(A) ≠ Color(B) for every shared border.', 'Select an unassigned variable (given order or Minimum Remaining Values).', 'Try each colour; check the constraints on that region.', 'If a constraint is violated, reject the colour; if none remains, backtrack.', 'Stop when all regions are coloured consistently.'],
    input: 'A map graph (regions, borders) and a colour set (3 or 4 colours).', output: 'A colour for every region, or “no solution”, plus search statistics.',
    complexity: ['Time: O(kⁿ) worst case for n regions and k colours.', 'Space: O(n) — recursion depth equals the number of regions.', 'MRV and forward checking do not change the worst case but remove most dead ends in practice.'],
  },
  crypt: {
    tab: 'Crypt-Arithmetic', title: 'Crypt-Arithmetic Puzzle using CSP',
    problem: 'Replace each letter of an addition such as SEND + MORE = MONEY with a digit so that the arithmetic is correct. Different letters get different digits and leading letters are not zero.',
    aim: 'To model a cryptarithm as a CSP with all-different and carry (column) constraints, and solve it by backtracking search.',
    algorithm: `variables   ← distinct letters, ordered units column first
domains     ← 0..9  (1..9 for leading letters)
constraints ← ALL-DIFFERENT(letters)
              COLUMN_k : low k+1 digits of the addends ≡ low k+1 digits of the result (mod 10^(k+1))
              EQUATION : the full sum holds
BACKTRACK as in the map-colouring experiment
    (a column constraint fires as soon as all its letters are assigned)`,
    steps: ['Collect the distinct letters (the variables).', 'Give each a domain of digits; forbid 0 for leading letters.', 'Add pairwise “≠” constraints (all-different).', 'Add a carry constraint for every column, starting at the units column.', 'Assign letters column by column, checking constraints after each digit.', 'Backtrack on any violation; stop when all letters are assigned.'],
    input: 'Addend words and a result word (e.g. SEND, MORE, MONEY).', output: 'A digit for each letter satisfying the equation, plus statistics.',
    complexity: ['Time: at most 10!/(10−L)! assignments for L letters (≈ 1.8 million for 8 letters).', 'Column constraints prune most of these early, so far fewer are explored.', 'Space: O(L).'],
  },
  queens: {
    tab: 'Local Search', title: 'N-Queens using Local Search (Min-Conflicts)',
    problem: 'Place n queens on an n × n board, one per column, so that no two queens attack each other.',
    aim: 'To solve a CSP with local search: start from a complete random assignment and repeatedly repair it using the Min-Conflicts heuristic.',
    algorithm: `function MIN-CONFLICTS(csp, max_steps):
    current ← a complete random assignment (one queen per column)
    for i = 1 to max_steps:
        if current is a solution: return current
        var ← a randomly chosen conflicted variable
        value ← the value of var with the fewest conflicts   # ties broken randomly
        set var = value in current
    return failure     # (this implementation also does a random restart when stuck)`,
    steps: ['Represent a state as queens[col] = row.', 'Start with a random complete state.', 'Choose a random queen that is attacked.', 'Count the conflicts each row in its column would cause.', 'Move it to a row with the minimum count.', 'Repeat until there are 0 attacking pairs.'],
    input: 'Board size n and a random seed.', output: 'A conflict-free placement (row of the queen in each column), with the number of iterations and moves.',
    complexity: ['Time per iteration: O(n²) here (n rows × O(n) conflict count); O(n) with incremental counters.', 'In practice the number of iterations needed grows very slowly with n (the classic result is that millions of queens are solvable).', 'Space: O(n). Incomplete: it can fail within the step limit.'],
  },
};

function MapRun() {
  const [level, setLevel] = useState(3);
  const [order, setOrder] = useState('static');
  const [fc, setFc] = useState(false);
  const [res, setRes] = useState(null);
  const run = () => {
    const map = getMap(level);
    const ids = MAP_COLORS.slice(0, map.colorLimit).map((c) => c.id);
    const r = recordSearch(buildMapCSP(map, ids), { order, forwardChecking: fc, maxEvents: 300000 });
    const last = r.events[r.events.length - 1];
    setRes({ map, solved: r.solved, sol: r.solution, stats: last.stats, events: r.events.length, label: `Level ${level} (${map.regions.length} regions, ${map.colorLimit} colours), ${order === 'mrv' ? 'MRV' : 'given order'}${fc ? ' + forward checking' : ''}` });
  };
  return (
    <>
      <div className="row lab-controls">
        <label className="field">Map<select value={level} onChange={(e) => setLevel(+e.target.value)}>{MAP_LEVELS.map((l) => <option key={l.level} value={l.level}>L{l.level} · {l.title} ({l.count} regions)</option>)}</select></label>
        <label className="field">Variable order<select value={order} onChange={(e) => setOrder(e.target.value)}><option value="static">Given order</option><option value="mrv">MRV</option></select></label>
        <label className="check"><input type="checkbox" checked={fc} onChange={(e) => setFc(e.target.checked)} /> Forward checking</label>
        <button type="button" className="btn btn-primary" onClick={run}><Icon name="play" filled /> Run experiment</button>
      </div>
      {res && (
        <div className="lab-out" aria-live="polite">
          <p><b>{res.solved ? 'Solution found' : 'No solution'}</b> — {res.label}</p>
          <table className="runs"><thead><tr><th>Region</th><th>Colour</th></tr></thead><tbody>
            {res.map.regions.map((r) => <tr key={r.id}><td>{r.name}</td><td>{res.sol ? <><i className="dot" style={{ background: colorById(res.sol[r.id]).hex }} /> {colorById(res.sol[r.id]).name}</> : '—'}</td></tr>)}
          </tbody></table>
          <Stats items={[['Assignments', res.stats.assignments], ['Constraint checks', res.stats.checks], ['Backtracks', res.stats.backtracks], ['Max depth', res.stats.maxDepth], ['Events', res.events]]} />
        </div>
      )}
    </>
  );
}

function CryptRun() {
  const [level, setLevel] = useState(3);
  const [fc, setFc] = useState(true);
  const [res, setRes] = useState(null);
  const run = () => {
    const p = CRYPT_PUZZLES.find((x) => x.level === level);
    const r = recordSearch(buildCryptCSP(p), { forwardChecking: fc, maxEvents: 300000 });
    const last = r.events[r.events.length - 1];
    setRes({ p, solved: r.solved, sol: r.solution, stats: last.stats, events: r.events.length });
  };
  const eq = res && res.sol ? `${res.p.addends.map((w) => wordValue(w, res.sol)).join(' + ')} = ${wordValue(res.p.result, res.sol)}` : null;
  return (
    <>
      <div className="row lab-controls">
        <label className="field">Puzzle<select value={level} onChange={(e) => setLevel(+e.target.value)}>{CRYPT_PUZZLES.map((p) => <option key={p.level} value={p.level}>{p.addends.join(' + ')} = {p.result}</option>)}</select></label>
        <label className="check"><input type="checkbox" checked={fc} onChange={(e) => setFc(e.target.checked)} /> Forward checking</label>
        <button type="button" className="btn btn-primary" onClick={run}><Icon name="play" filled /> Run experiment</button>
      </div>
      {res && (
        <div className="lab-out" aria-live="polite">
          <p><b>{res.solved ? 'Solution found' : 'No solution'}</b>{eq && <> — <span className="mono">{eq}</span></>}</p>
          {res.sol && <div className="csp-chips">{Object.entries(res.sol).map(([l, d]) => <span key={l} className="chip">{l}={d}</span>)}</div>}
          <Stats items={[['Assignments', res.stats.assignments], ['Constraint checks', res.stats.checks], ['Backtracks', res.stats.backtracks], ['Values pruned', res.stats.prunes], ['Events', res.events]]} />
        </div>
      )}
    </>
  );
}

function QueensRun() {
  const [n, setN] = useState(8);
  const [seed, setSeed] = useState(0);
  const [res, setRes] = useState(null);
  const run = () => {
    const start = startingBoard(n, 3, seed);
    const r = recordMinConflicts(start, { seed: 7 + seed, maxIterations: 500, stallLimit: 40 });
    const last = r.events[r.events.length - 1];
    setRes({ n, start, solved: r.solved, final: last.queens, it: last.iteration, moves: last.moves, restarts: last.restarts, history: last.history });
  };
  return (
    <>
      <div className="row lab-controls">
        <label className="field">Board size<select value={n} onChange={(e) => setN(+e.target.value)}>{[4, 6, 8, 10, 12, 16, 24].map((v) => <option key={v} value={v}>{v} queens</option>)}</select></label>
        <label className="field">Random start<select value={seed} onChange={(e) => setSeed(+e.target.value)}>{[0, 1, 2, 3, 4].map((v) => <option key={v} value={v}>#{v + 1}</option>)}</select></label>
        <button type="button" className="btn btn-primary" onClick={run}><Icon name="play" filled /> Run experiment</button>
      </div>
      {res && (
        <div className="lab-out" aria-live="polite">
          <p><b>{res.solved ? 'Solution found (0 conflicts)' : `Stopped with ${countConflicts(res.final)} conflicts`}</b></p>
          <p className="mono">Initial: [{res.start.map((r) => r + 1).join(', ')}] — {countConflicts(res.start)} conflicts<br />Final: [{res.final.map((r) => r + 1).join(', ')}] — {countConflicts(res.final)} conflicts</p>
          <Stats items={[['Iterations', res.it], ['Queen moves', res.moves], ['Restarts', res.restarts], ['Final conflicts', countConflicts(res.final)]]} />
          <ConflictChart history={res.history.length > 1 ? res.history : [res.history[0], res.history[0]]} />
        </div>
      )}
    </>
  );
}

function Stats({ items }) {
  return <dl className="lab-stats">{items.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;
}

export default function Lab({ topic }) {
  const id = EXPS[topic] ? topic : 'map';
  const x = EXPS[id];
  return (
    <div className="page lab">
      <header className="page-head">
        <span className="eyebrow"><Icon name="flask" size={14} /> Lab Mode</span>
        <h1>Practical record</h1>
        <p>The academic write-up for each experiment, with a live run you can use for your results section. The games remain the main experience.</p>
      </header>
      <div className="row lab-top">
        <div className="seg" role="tablist" aria-label="Experiment">
          {Object.entries(EXPS).map(([k, v], i) => <button key={k} type="button" role="tab" aria-selected={id === k} onClick={() => navigate(`/lab/${k}`)}>Exp {i + 1} · {v.tab}</button>)}
        </div>
        <span className="spacer" />
        <button type="button" className="btn btn-sm" onClick={() => window.print()}><Icon name="clipboard" /> Print / save as PDF</button>
      </div>
      <article className="card lab-sheet" key={id}>
        <h2>{x.title}</h2>
        <section><h3>Problem statement</h3><p>{x.problem}</p></section>
        <section><h3>Aim</h3><p>{x.aim}</p></section>
        <section><h3>Algorithm</h3><pre className="code" tabIndex={0}>{x.algorithm}</pre></section>
        <section><h3>Steps</h3><ol>{x.steps.map((s) => <li key={s}>{s}</li>)}</ol></section>
        <div className="grid grid-2">
          <section><h3>Input</h3><p>{x.input}</p></section>
          <section><h3>Output</h3><p>{x.output}</p></section>
        </div>
        <section><h3>Complexity</h3><ul>{x.complexity.map((c) => <li key={c}>{c}</li>)}</ul></section>
        <section className="lab-result"><h3>Result</h3>
          {id === 'map' && <MapRun />}{id === 'crypt' && <CryptRun />}{id === 'queens' && <QueensRun />}
        </section>
      </article>
    </div>
  );
}
