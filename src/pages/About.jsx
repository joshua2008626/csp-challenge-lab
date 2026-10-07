import Icon from '../components/Icon.jsx';
import { navigate } from '../hooks/useRoute.js';

const USES = [
  { icon: 'clock', name: 'Scheduling', text: 'Assign jobs to machines and time slots so no resource is double-booked.' },
  { icon: 'clipboard', name: 'Timetabling', text: 'Place classes, rooms and teachers so that nobody is in two places at once.' },
  { icon: 'layers', name: 'Resource allocation', text: 'Share limited people, vehicles or bandwidth among competing tasks.' },
  { icon: 'flag', name: 'Planning', text: 'Choose actions and times for a plan whose steps must respect ordering rules.' },
  { icon: 'map', name: 'Map coloring', text: 'Frequency assignment in radio networks is the same problem as colouring a map.' },
  { icon: 'lock', name: 'Cryptography puzzles', text: 'Cryptarithms and other constraint puzzles, Sudoku and logic grids.' },
  { icon: 'sliders', name: 'Configuration', text: 'Pick compatible options for a product, computer or software package.' },
  { icon: 'cpu', name: 'Robotics', text: 'Motion and task planning with geometric and timing constraints.' },
];
const METHODS = [
  { icon: 'undo', name: 'Backtracking', text: 'Depth-first search over partial assignments. Assign a variable, check the constraints, and undo the choice when it leads to a dead end. It is complete and uses very little memory.', tags: ['Complete', 'O(dⁿ) worst case'] },
  { icon: 'scissors', name: 'Constraint propagation', text: 'Use constraints to shrink domains. Forward checking prunes neighbours after each assignment; arc consistency (AC-3) goes further. Heuristics like MRV choose the most constrained variable first.', tags: ['Prunes the search', 'Pairs with backtracking'] },
  { icon: 'shuffle', name: 'Local search', text: 'Start from a complete assignment and repair it. Min-Conflicts moves a conflicted variable to the value with the fewest violations. Extremely fast on big problems, but incomplete and prone to plateaus.', tags: ['Incomplete', 'Scales well'] },
];

export default function About() {
  return (
    <div className="page about">
      <header className="page-head">
        <span className="eyebrow"><Icon name="info" size={14} /> About</span>
        <h1>Why constraint satisfaction matters</h1>
        <p>A huge share of practical AI problems can be written as “choose values so that no rule is broken”. That is a CSP.</p>
      </header>

      <section className="grid grid-2 about-intro">
        <article className="card"><h3>What is a CSP?</h3><p>A Constraint Satisfaction Problem has <b>variables</b> that need values, a <b>domain</b> of allowed values for each, and <b>constraints</b> restricting which combinations are allowed. A <b>solution</b> assigns every variable a value without breaking a constraint.</p><code className="mono">CSP = ⟨ X, D, C ⟩</code></article>
        <article className="card"><h3>Why it matters in AI</h3><p>Because the structure is explicit, one general solver works on many problems. Solvers can look <em>inside</em> the problem (which rule failed? which domain is empty?) instead of treating states as black boxes, which makes CSP search far more informed than blind search.</p></article>
      </section>

      <section className="section">
        <div className="section-head"><div><h2>Where CSPs are used</h2></div></div>
        <div className="grid grid-4">
          {USES.map((u) => <article className="card use-card" key={u.name}><span className="use-icon"><Icon name={u.icon} size={20} /></span><h4>{u.name}</h4><p>{u.text}</p></article>)}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><div><h2>Three ways to solve one</h2><p>This app implements all three families.</p></div></div>
        <div className="grid grid-3">
          {METHODS.map((m) => (
            <article className="card method-card" key={m.name}>
              <h3 className="card-title"><Icon name={m.icon} /> {m.name}</h3>
              <p>{m.text}</p>
              <div className="row">{m.tags.map((t) => <span className="badge" key={t}>{t}</span>)}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="section card about-built">
        <h3>About this project</h3>
        <p>CSP Challenge Lab was built for the <b>AI Course-II / AIML practical lab at Rajalakshmi Engineering College</b>, covering Map-Coloring, Crypt-Arithmetic puzzles and Local Search for CSP. Every solver runs in your browser and emits the step events that the visualisations replay, so what you watch is the algorithm itself.</p>
        <div className="row"><button type="button" className="btn btn-primary" onClick={() => navigate('/lab')}><Icon name="flask" /> Open Lab Mode</button><button type="button" className="btn" onClick={() => navigate('/learn')}><Icon name="book" /> Learn the basics</button></div>
      </section>
    </div>
  );
}
