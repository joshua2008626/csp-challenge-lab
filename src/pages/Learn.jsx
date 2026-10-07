import { useEffect, useRef } from 'react';
import Icon from '../components/Icon.jsx';
import { ColoringLab, LocalDemo, PropagationDemo, SolverDemo, ThreePartsDemo } from '../components/LearnDemos.jsx';
import { navigate } from '../hooks/useRoute.js';

export const TOPICS = [
  { id: 'what', title: 'What is a CSP?', short: 'A puzzle made of things to decide, choices for each, and rules the choices must obey.', example: 'CSP = ⟨ Variables, Domains, Constraints ⟩',
    points: ['Map colouring, Sudoku, timetables and N-Queens all have the same shape.', 'The goal is a value for every variable that breaks no rule.'], tryIt: 'Switch between the three puzzles. The parts have different names, but the structure is identical.', demo: <ThreePartsDemo /> },
  { id: 'variables', title: 'Variables', short: 'Something whose value we need to decide.', example: 'Color(A) = ?',
    points: ['In map colouring, each region is a variable.', 'A variable starts empty and ends with one value.'], tryIt: 'Click the nodes: each click gives the variable a value.', demo: <ColoringLab focus="variables" /> },
  { id: 'domains', title: 'Domains', short: 'The possible values a variable may take.', example: '{ Red, Green, Blue }',
    points: ['Every variable has a domain; they can differ from variable to variable.', 'Smaller domains mean a smaller search — that is why solvers shrink them.'], tryIt: 'Remove a colour from the domain and watch the number of possibilities change.', demo: <ColoringLab focus="domains" /> },
  { id: 'constraints', title: 'Constraints', short: 'A rule that must be satisfied.', example: 'Color(A) ≠ Color(B)',
    points: ['A constraint talks about one or more variables.', 'A constraint is only checked once its variables have values.'], tryIt: 'Colour two neighbours the same and see which constraint breaks.', demo: <ColoringLab focus="constraints" /> },
  { id: 'assignment', title: 'Assignment', short: 'Giving values to variables. It may be partial.', example: '{ A = Red, B = Green }',
    points: ['A partial assignment gives values to only some variables.', 'Search algorithms grow assignments one variable at a time.'], tryIt: 'Colour just one or two nodes — that is a partial assignment.', demo: <ColoringLab focus="assignment" /> },
  { id: 'consistent', title: 'Consistent assignment', short: 'An assignment that breaks no constraint.', example: 'A = Red, B = Red  ✗  (A ≠ B is broken)',
    points: ['Consistency only looks at the variables that already have values.', 'Backtracking keeps every partial assignment consistent.'], tryIt: 'Create a conflict, then fix it — watch “Consistent?” flip.', demo: <ColoringLab focus="consistent" /> },
  { id: 'complete', title: 'Complete assignment', short: 'An assignment where every variable has a value.', example: 'A, B, C, D all assigned',
    points: ['Complete does not mean correct — a complete assignment can still break rules.', 'Local search always works with complete assignments.'], tryIt: 'Colour every node in a way that is complete but not consistent.', demo: <ColoringLab focus="complete" /> },
  { id: 'solution', title: 'Solution', short: 'A complete assignment that is also consistent.', example: 'complete  AND  consistent',
    points: ['Both properties are needed.', 'Some CSPs have one solution, some many, some none.'], tryIt: 'Find a colouring where “Solution?” says yes.', demo: <ColoringLab focus="solution" /> },
  { id: 'backtracking', title: 'Backtracking', short: 'Try a value; if it breaks a rule, undo it and try another.', example: 'assign → check → conflict? → backtrack',
    points: ['It builds a solution one variable at a time.', 'A dead end sends it back to the previous decision.', 'It is complete: if a solution exists, it finds it.'], tryIt: 'Step through this real run and watch for the BACKTRACK step.', demo: <SolverDemo fc={false} /> },
  { id: 'propagation', title: 'Constraint propagation', short: 'Use the rules to remove impossible values before (or during) search.', example: 'A = Red ⇒ B ≠ Red ⇒ B = Green ⇒ C = Red …',
    points: ['When a domain shrinks to one value, that value can be removed from the neighbours.', 'The effect can cascade through the whole problem.'], tryIt: 'Choose a colour for the first node — the chain solves itself.', demo: <PropagationDemo /> },
  { id: 'forward-checking', title: 'Forward checking', short: 'After each assignment, remove clashing values from the neighbours\' domains.', example: 'A = Red ⇒ remove Red from D(C), D(D)',
    points: ['If a neighbour\'s domain becomes empty, backtrack immediately.', 'It finds dead ends earlier than plain backtracking.'], tryIt: 'Compare with the plain run: the dots under the nodes are the live domains.', demo: <SolverDemo fc /> },
  { id: 'local-search', title: 'Local search', short: 'Start with a full (wrong) assignment and repair it step by step.', example: 'state → better neighbouring state → …',
    points: ['No empty start and no undoing: it improves one complete state.', 'It can get stuck, so it is incomplete — but it is very fast on large problems.'], tryIt: 'Watch the conflict count fall as queens move.', demo: <LocalDemo detail={false} /> },
  { id: 'min-conflicts', title: 'Min-Conflicts', short: 'Pick a conflicted variable and give it the value with the fewest conflicts.', example: 'argmin over values v of conflicts(var, v)',
    points: ['1. Pick a conflicted variable. 2. Try every value. 3. Count conflicts. 4. Choose the minimum. 5. Move. 6. Repeat.', 'Random tie-breaks and restarts help it escape plateaus.'], tryIt: 'Step to an “Evaluate” step and read the candidate list.', demo: <LocalDemo detail /> },
];

export default function Learn({ topic }) {
  const idx = Math.max(0, TOPICS.findIndex((t) => t.id === topic));
  const t = TOPICS[idx];
  const head = useRef(null);
  useEffect(() => { head.current && head.current.focus({ preventScroll: true }); }, [t.id]);
  const go = (i) => navigate(`/learn/${TOPICS[i].id}`);
  return (
    <div className="page learn">
      <header className="page-head">
        <span className="eyebrow"><Icon name="book" size={14} /> Learn mode</span>
        <h1>CSP from absolute basics</h1>
        <p>Thirteen short ideas. Every one has something you can click, change or step through.</p>
      </header>
      <div className="learn-layout">
        <nav className="learn-nav card" aria-label="Topics">
          <ol>
            {TOPICS.map((x, i) => (
              <li key={x.id}>
                <button type="button" className="learn-link" aria-current={i === idx ? 'page' : undefined} onClick={() => go(i)}>
                  <span className="learn-num">{i + 1}</span><span>{x.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <article className="learn-body card" aria-labelledby="topic-title">
          <span className="eyebrow">Topic {idx + 1} of {TOPICS.length}</span>
          <h2 id="topic-title" ref={head} tabIndex={-1} style={{ outline: 'none' }}>{t.title}</h2>
          <p className="learn-def">“{t.short}”</p>
          <div className="learn-example mono">{t.example}</div>
          <ul className="learn-points">{t.points.map((p) => <li key={p}>{p}</li>)}</ul>
          <div className="callout callout-info"><Icon name="sparkles" /><span><b>Try it:</b> {t.tryIt}</span></div>
          <div className="learn-demo" key={t.id}>{t.demo}</div>
          <div className="row learn-foot">
            <button type="button" className="btn" disabled={idx === 0} onClick={() => go(idx - 1)}><Icon name="arrow-right" style={{ transform: 'rotate(180deg)' }} /> Previous</button>
            <span className="spacer" />
            {idx < TOPICS.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={() => go(idx + 1)}>Next: {TOPICS[idx + 1].title} <Icon name="arrow-right" /></button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => navigate('/challenges')}>Start the challenges <Icon name="arrow-right" /></button>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
