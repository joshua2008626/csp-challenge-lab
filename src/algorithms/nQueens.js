import { createCSP } from './cspUtils.js';

/**
 * N-Queens as a CSP.
 *   Variables : one per column  Q0..Q(n-1)   (the queen in that column)
 *   Domains   : row 0..n-1
 *   Constraints: for every pair of columns, queens must not share a row or a diagonal
 *
 * A *state* for local search is a complete assignment: queens[col] = row.
 */

export function buildQueensCSP(n) {
  const variables = Array.from({ length: n }, (_, i) => `Q${i}`);
  const domains = {};
  variables.forEach((v) => (domains[v] = Array.from({ length: n }, (_, r) => r)));
  const constraints = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = `Q${i}`;
      const b = `Q${j}`;
      constraints.push({
        id: `${a}-${b}`,
        scope: [a, b],
        check: (asg) =>
          asg[a] === undefined ||
          asg[b] === undefined ||
          (asg[a] !== asg[b] && Math.abs(asg[a] - asg[b]) !== Math.abs(i - j)),
        describe: (asg, ok) =>
          asg[a] === undefined || asg[b] === undefined
            ? `${a} and ${b} must not attack`
            : ok
            ? `Queens in columns ${i + 1} and ${j + 1} are safe ✓`
            : `Queens in columns ${i + 1} and ${j + 1} attack each other`,
      });
    }
  }
  return createCSP({ name: `${n}-Queens`, variables, domains, constraints });
}

export const queenVar = (col) => `Q${col}`;

/** Do queens in column a (row ra) and column b (row rb) attack each other? */
export function attacks(a, ra, b, rb) {
  return ra === rb || Math.abs(ra - rb) === Math.abs(a - b);
}

/** Every attacking pair in a complete state. [{a,b,kind}] kind = row | diagonal */
export function attackingPairs(queens) {
  const pairs = [];
  for (let a = 0; a < queens.length; a++) {
    for (let b = a + 1; b < queens.length; b++) {
      if (queens[a] === null || queens[b] === null || queens[a] === undefined || queens[b] === undefined) continue;
      if (queens[a] === queens[b]) pairs.push({ a, b, kind: 'row' });
      else if (Math.abs(queens[a] - queens[b]) === Math.abs(a - b)) pairs.push({ a, b, kind: 'diagonal' });
    }
  }
  return pairs;
}

export const countConflicts = (queens) => attackingPairs(queens).length;

/** Number of other queens attacking the queen in `col` if it stood on `row`. */
export function conflictsAt(queens, col, row) {
  let n = 0;
  for (let c = 0; c < queens.length; c++) {
    if (c === col) continue;
    if (queens[c] === null || queens[c] === undefined) continue;
    if (attacks(col, row, c, queens[c])) n += 1;
  }
  return n;
}

/** Columns whose queen is attacked by at least one other queen. */
export function conflictedColumns(queens) {
  const set = new Set();
  attackingPairs(queens).forEach(({ a, b }) => {
    set.add(a);
    set.add(b);
  });
  return [...set].sort((x, y) => x - y);
}

export function isQueensSolved(queens) {
  return queens.every((r) => r !== null && r !== undefined) && countConflicts(queens) === 0;
}

/** Plain random starting state (one queen per column, random row). */
export function randomState(n, rng = Math.random) {
  return Array.from({ length: n }, () => Math.floor(rng() * n));
}

/**
 * Plain recursive backtracking for N-Queens (column by column), instrumented with work counters
 * but WITHOUT recording events. Used by the "Backtracking vs Local Search" comparison, so the
 * numbers shown to the player are real measurements, not constants.
 */
export function solveQueensBacktracking(n) {
  const queens = [];
  let assignments = 0;
  let backtracks = 0;
  let checks = 0;
  const safe = (col, row) => {
    for (let c = 0; c < col; c++) {
      checks += 1;
      if (attacks(col, row, c, queens[c])) return false;
    }
    return true;
  };
  const rec = (col) => {
    if (col === n) return true;
    for (let row = 0; row < n; row++) {
      if (safe(col, row)) {
        queens[col] = row;
        assignments += 1;
        if (rec(col + 1)) return true;
        queens.length = col;
        backtracks += 1;
      }
    }
    return false;
  };
  const solved = rec(0);
  return { solved, queens: solved ? [...queens] : null, assignments, backtracks, checks };
}
