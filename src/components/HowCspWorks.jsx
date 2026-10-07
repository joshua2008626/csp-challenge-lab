import { useEffect, useMemo, useState } from 'react';
import MiniGraph from './MiniGraph.jsx';
import Icon from './Icon.jsx';
import { EVT } from '../algorithms/backtracking.js';
import { colorById, findConflicts } from '../algorithms/mapColoring.js';
import { DEMO_COLORS, DEMO_EDGES, DEMO_MAP, DEMO_NODES, demoRun } from '../data/demoGraph.js';
import { mapEventMessage } from '../utils/explain.js';

const STEPS = [
  { id: 'variables', title: 'Variables', blurb: 'Decide what must be decided. Each node is a variable whose value is still unknown.', code: 'X = { A, B, C, D, E, F }' },
  { id: 'domains', title: 'Domains', blurb: 'List the values each variable may take. The dots under every node are its domain.', code: 'D(A) = D(B) = … = { Red, Green, Blue }' },
  { id: 'constraints', title: 'Constraints', blurb: 'Write the rules. Every line says two neighbours must take different values.', code: 'A ≠ C, A ≠ D, B ≠ C, C ≠ D, C ≠ F, D ≠ F, E ≠ F' },
  { id: 'search', title: 'Search', blurb: 'Try values one variable at a time. When a value breaks a rule, undo it (backtrack) and try the next one.', code: 'assign → check → (conflict? backtrack)' },
  { id: 'solution', title: 'Solution', blurb: 'Every variable has a value and no constraint is broken. Done.', code: 'all 7 constraints satisfied ✓' },
];
const KEY = new Set([EVT.ASSIGN, EVT.CONFLICT, EVT.BACKTRACK, EVT.SOLUTION_FOUND, EVT.SELECT_VARIABLE]);

export default function HowCspWorks() {
  const run = useMemo(() => demoRun().plain, []);
  const keyIdx = useMemo(() => run.events.map((e, i) => (KEY.has(e.type) ? i : -1)).filter((i) => i >= 0), [run]);
  const [step, setStep] = useState(0);
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(true);
  const lastK = keyIdx.length - 1;

  useEffect(() => { if (step === 3) { setK(0); setPlaying(true); } }, [step]);
  useEffect(() => {
    if (step !== 3 || !playing) return undefined;
    const id = setInterval(() => setK((x) => { if (x >= lastK) { setPlaying(false); return x; } return x + 1; }), 650);
    return () => clearInterval(id);
  }, [step, playing, lastK]);

  const e = run.events[keyIdx[k]];
  const final = run.events[run.events.length - 1];
  let assignment = {}, domains = null, showEdges = false, tentative = null, conflicts = [];
  if (step === 1) domains = Object.fromEntries(DEMO_NODES.map((n) => [n.id, DEMO_COLORS]));
  if (step >= 2) showEdges = true;
  if (step === 3) { assignment = e.assignment; if (e.type === EVT.CONFLICT) conflicts = findConflicts(DEMO_MAP, e.assignment); }
  if (step === 4) assignment = final.assignment;
  const msg = step === 3 ? mapEventMessage(DEMO_MAP, e) : null;
  const s = STEPS[step];

  return (
    <div className="how card">
      <ol className="how-steps" aria-label="CSP pipeline">
        {STEPS.map((x, i) => (
          <li key={x.id}>
            <button type="button" className="how-step" aria-pressed={step === i} aria-label={`Step ${i + 1}: ${x.title}`} onClick={() => setStep(i)}>
              <span className="how-num">{i + 1}</span><span>{x.title.toUpperCase()}</span>
            </button>
            {i < STEPS.length - 1 && <Icon name="arrow-down" className="how-arrow" size={16} />}
          </li>
        ))}
      </ol>
      <div className="how-stage">
        <div className="how-graph">
          <MiniGraph nodes={DEMO_NODES} edges={DEMO_EDGES} assignment={assignment} domains={domains} showEdges={showEdges} conflicts={conflicts}
            current={step === 3 ? e.variable || null : null} backtrack={step === 3 && e.type === EVT.BACKTRACK ? e.variable : null} width={320} height={210} label={`How CSP works: ${s.title}`} />
        </div>
        <div className="how-text" aria-live="polite">
          <span className="eyebrow">Step {step + 1} of 5</span>
          <h3>{s.title}</h3>
          <p>{s.blurb}</p>
          <code className="how-code">{s.code}</code>
          {step === 3 && msg && (
            <div className={`how-msg tone-${msg.tone}`}><b>{msg.title}</b><span>{msg.body}</span></div>
          )}
          {step === 3 && (
            <div className="row">
              <button type="button" className="btn btn-sm" onClick={() => { if (!playing && k >= lastK) setK(0); setPlaying((p) => !p); }}><Icon name={playing ? 'pause' : 'play'} filled /> {playing ? 'Pause' : k >= lastK ? 'Replay' : 'Play'}</button>
              <span className="muted tabular">key step {k + 1} / {keyIdx.length}</span>
            </div>
          )}
          {step === 4 && <p className="how-final">{DEMO_NODES.map((n) => `${n.id}=${colorById(final.assignment[n.id]).name}`).join(', ')}</p>}
        </div>
      </div>
      <div className="row how-nav">
        <button type="button" className="btn btn-sm" disabled={step === 0} onClick={() => setStep((x) => x - 1)}>Back</button>
        <span className="spacer" />
        <button type="button" className="btn btn-sm btn-primary" disabled={step === 4} onClick={() => setStep((x) => x + 1)}>Next <Icon name="arrow-right" /></button>
      </div>
    </div>
  );
}
