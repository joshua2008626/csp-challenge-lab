# CSP Challenge Lab — *Think. Constrain. Solve.*

An interactive learning game for **Constraint Satisfaction Problems (CSP)**, built for the AI Course-II / AIML practical lab at Rajalakshmi Engineering College. You play each puzzle yourself, then watch a **real** solver do the same job while an explanation panel says why it makes each decision.

> Every animation replays events emitted by the actual algorithm. There are no scripted "AI solved it" messages.

## Features

- **Landing page** with a live backtracking run on a small constraint graph, plus an interactive "How CSP works" pipeline (Variables → Domains → Constraints → Search → Solution).
- **Learn mode**: 13 topics (variables, domains, constraints, assignment, consistency, completeness, solution, backtracking, constraint propagation, forward checking, local search, Min-Conflicts), each with a plain-language definition and an interactive or step-through demo.
- **Challenge 1 – Map Coloring** (5 levels, 4 → 18 regions, 4 → 3 colours). Immediate conflict detection (colour + dashed outline + ⚠ icon + text), constraint-graph overlay, keyboard colour shortcuts.
- **Challenge 2 – Crypt-Arithmetic** (5 puzzles, from `TO + GO = OUT` to `DONALD + GERALD = ROBERT`). Column layout with a visible carry row, column-by-column reasoning (`D + E = Y + 10 × carry`), digit keypad, mistake detection.
- **Challenge 3 – Local Search / N-Queens** (4 → 12 queens). Click-to-move queens, attack lines, optional per-square conflict counts, conflicts-vs-move chart.
- **AI solvers**: backtracking (given order or MRV, optional forward checking) and Min-Conflicts (with random restart on stall). Play / pause / step / **previous step** / scrub / 0.5×–Turbo, and "key steps" vs "every check" detail.
- **Explanation engine**: every move and every solver event produces a message with a *what*, a *why* and the constraints involved.
- **Game system**: XP, scores, accuracy, time, progressive 3-level hints (small score cost), 4 player tiers, 9 achievements, localStorage persistence.
- **Progress dashboard**, **Lab Mode** (problem statement, aim, algorithm, steps, input, output, complexity and a live "Run experiment" result for each lab task), **About** page.
- Dark/light theme, responsive (sidebar → top bar + tab bar), keyboard accessible, visible focus, non-colour-only error cues, `prefers-reduced-motion` respected.

## Tech stack

React 18 · Vite 5 · plain CSS (design tokens) · no runtime dependencies beyond React. Icons, charts, router and animations are small in-house implementations.

## Install, run, build

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
npm test           # algorithm unit tests (Node's built-in test runner, no extra deps)
```

The build uses relative asset paths and a hash router, so `dist/` works from any static host or sub-folder.

## Project structure

```
src/
  algorithms/   cspUtils.js · backtracking.js · mapColoring.js · cryptArithmetic.js · nQueens.js · minConflicts.js
  components/   GameHeader · MapBoard · CryptoBoard · QueensBoard · ColorPicker · ExplanationPanel · AlgorithmVisualizer
                SolverControls · ScorePanel · HintSystem · ProgressBar · ChallengeCard · AchievementCard · CompleteModal · …
  pages/        Home · Learn · Challenges · Play → MapGame / CryptGame / QueensGame · Progress · Lab · About
  data/         maps.js · puzzles.js · queensLevels.js · achievements.js · demoGraph.js
  hooks/        useProgress · useSolverPlayer · useTimer · useTheme · useRoute
  utils/        explain.js · hints.js · scoring.js · storage.js · propagation.js
  styles/       tokens.css · base.css · layout.css · components.css · game.css · pages.css
tests/          algorithms.test.js
```

## How the algorithms work

**One CSP abstraction** (`cspUtils.js`): `{ variables, domains, constraints }`, where every constraint has `scope`, `check(assignment)` and `describe(assignment)`. Map colouring, crypt-arithmetic and N-Queens all build this same object.

**Backtracking** (`backtracking.js`) is a generator that yields events: `SELECT_VARIABLE`, `TRY_VALUE`, `CHECK_CONSTRAINT`, `CONFLICT`, `ASSIGN`, `PRUNE`, `BACKTRACK`, `DEAD_END`, `SOLUTION_FOUND`, `FAILURE`. Each event carries a snapshot of the assignment and statistics (checks, backtracks, depth). Options: **MRV** variable ordering and **forward checking** (prune neighbours' domains; an emptied domain is an early conflict).

**Map colouring**: one variable per region, one `≠` constraint per border. Region adjacency is derived from the real geometry of procedurally generated Voronoi maps, so what you see is what the constraints say.

**Crypt-arithmetic**: variables are the distinct letters (ordered units column first); constraints are pairwise all-different, one *carry constraint per column* (the low *k+1* digits of the addends must match the result modulo 10^(k+1)) and the final equation. Column constraints fire as soon as their letters are assigned, which prunes the search heavily.

**Min-Conflicts** (`minConflicts.js`): start from a complete random board; repeatedly pick a conflicted queen, count the conflicts of every row in its column, move it to a minimum-conflict row (random tie-break), and stop at 0 conflicts. If the best conflict count stalls for 40 iterations it makes a random restart (shown as an explicit event). It is incomplete by nature, and the app says so.

## How the visualisation works

A solver is run to completion into an **event list**. `useSolverPlayer` replays that list by index, so *next*, *previous*, *scrub* and speed control are just index changes. The boards, the algorithm panel (step, variable, value, depth, backtracks, checks) and the explanation panel are all pure functions of the current event. The same event list also feeds the conflicts-vs-iteration chart.

## AI Lab Topics Covered

| Topic | Where |
|---|---|
| Map Coloring | Challenge 1, Lab experiment 1 |
| Crypt-Arithmetic | Challenge 2, Lab experiment 2 |
| Local Search | Challenge 3, Lab experiment 3 |
| Backtracking | Map + Crypt solvers, Learn #9 |
| Constraint Satisfaction | shared CSP model, Learn #1–8 |
| Min-Conflicts | N-Queens solver, Learn #13 |
| Forward checking / MRV / propagation | solver options, Learn #10–11 |

## Scoring

`base = 500 + 100 × level`, plus up to 300 for beating the par time, +100 for a clean run (no mistakes or hints), minus 25 per mistake (max 250) and 40 per hint (max 200); never below 100. Accuracy = good moves / all moves. XP = score / 8.

## Future improvements

AC-3 arc consistency and a degree heuristic; Sudoku and timetabling modules; user-drawn maps; saved/shareable custom puzzles; sound; per-player cloud sync.
