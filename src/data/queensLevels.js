import { makeRng } from '../algorithms/cspUtils.js';
import { countConflicts, randomState } from '../algorithms/nQueens.js';

/** Local-search levels: the CSP really gets bigger (n variables, n values, n(n-1)/2 constraints). */
export const QUEENS_LEVELS = [
  { level: 1, tier: 'Beginner', title: 'Four Queens', n: 4, seed: 3, par: 60, blurb: 'Only two solutions exist — can you find one?' },
  { level: 2, tier: 'Beginner', title: 'Six Queens', n: 6, seed: 5, par: 100, blurb: 'A bigger board with more attacking pairs.' },
  { level: 3, tier: 'Intermediate', title: 'Eight Queens', n: 8, seed: 9, par: 180, blurb: 'The classic puzzle: 92 solutions in a space of 16.7 million boards.' },
  { level: 4, tier: 'Advanced', title: 'Ten Queens', n: 10, seed: 4, par: 300, blurb: 'Switch on the conflict numbers and play like Min-Conflicts.' },
  { level: 5, tier: 'Expert', title: 'Twelve Queens', n: 12, seed: 2, par: 420, blurb: 'Twelve variables, 66 constraints. Think in heuristics.' },
];

export const getQueensLevel = (level) => QUEENS_LEVELS.find((l) => l.level === level) || QUEENS_LEVELS[0];

/**
 * Deterministic unsolved starting board for a level. `shuffle` > 0 gives a different board.
 * A start state is a COMPLETE assignment (one queen per column) that violates constraints —
 * exactly what local search expects.
 */
export function startingBoard(n, seed, shuffle = 0) {
  const rng = makeRng(seed * 1000 + shuffle * 7919 + 1);
  const minConflicts = n <= 4 ? 2 : Math.ceil(n / 2);
  for (let tries = 0; tries < 500; tries++) {
    const s = randomState(n, rng);
    if (countConflicts(s) >= minConflicts) return s;
  }
  return randomState(n, rng);
}
