import { conflictedColumns, conflictsAt, countConflicts } from './nQueens.js';
import { makeRng } from './cspUtils.js';

/**
 * Min-Conflicts local search for N-Queens.
 *
 * Unlike backtracking, local search starts from a COMPLETE (but probably wrong) state and
 * repairs it. Each iteration:
 *   1. pick a conflicted variable (a queen that is under attack)
 *   2. evaluate every value in its domain (every row in that column)
 *   3. count the conflicts each value would cause
 *   4. choose a value with the minimum number of conflicts (ties broken randomly,
 *      and the current value is allowed — that is how the search can stall)
 *   5. move the queen
 *   6. repeat until conflicts = 0 or the iteration budget runs out
 *
 * The generator yields one event per phase so the UI can animate the real computation:
 *   INIT, PICK_VARIABLE, EVALUATE, MOVE, SOLUTION_FOUND, GIVE_UP
 */

export const LS_EVT = {
  INIT: 'INIT',
  RESTART: 'RESTART',
  PICK_VARIABLE: 'PICK_VARIABLE',
  EVALUATE: 'EVALUATE',
  MOVE: 'MOVE',
  SOLUTION_FOUND: 'SOLUTION_FOUND',
  GIVE_UP: 'GIVE_UP',
};

export function* minConflicts(initial, opts = {}) {
  const maxIterations = opts.maxIterations ?? 300;
  // Pure min-conflicts can stall on a plateau / local minimum. If the best conflict count has not
  // improved for `stallLimit` iterations we do a classic random restart (and show it as an event).
  const stallLimit = opts.stallLimit ?? 40;
  const rng = opts.rng || makeRng(opts.seed ?? 7);
  const n = initial.length;
  const queens = [...initial];
  const history = [countConflicts(queens)];
  let iteration = 0;
  let moves = 0;
  let restarts = 0;
  let bestSeen = history[0];
  let sinceImprove = 0;

  const snap = (extra) => ({
    ...extra,
    iteration,
    moves,
    restarts,
    queens: [...queens],
    conflicts: countConflicts(queens),
    history: [...history],
  });

  yield snap({ type: LS_EVT.INIT });

  while (iteration < maxIterations) {
    if (countConflicts(queens) === 0) {
      yield snap({ type: LS_EVT.SOLUTION_FOUND });
      return true;
    }
    iteration += 1;

    if (sinceImprove >= stallLimit) {
      for (let c = 0; c < n; c++) queens[c] = Math.floor(rng() * n);
      restarts += 1;
      sinceImprove = 0;
      bestSeen = Infinity;
      history.push(countConflicts(queens));
      yield snap({ type: LS_EVT.RESTART });
      continue;
    }

    // 1. pick a conflicted variable at random
    const conflicted = conflictedColumns(queens);
    const col = conflicted[Math.floor(rng() * conflicted.length)];
    yield snap({ type: LS_EVT.PICK_VARIABLE, column: col, conflictedColumns: conflicted });

    // 2-3. evaluate every candidate value
    const candidates = [];
    for (let row = 0; row < n; row++) candidates.push({ row, conflicts: conflictsAt(queens, col, row) });
    const min = Math.min(...candidates.map((c) => c.conflicts));
    const best = candidates.filter((c) => c.conflicts === min);

    // 4. choose a minimum-conflict value (random tie-break)
    // prefer actually moving over staying put when values tie (helps leave plateaus)
    const movers = best.filter((b) => b.row !== queens[col]);
    const pool = movers.length ? movers : best;
    const chosen = pool[Math.floor(rng() * pool.length)];
    yield snap({
      type: LS_EVT.EVALUATE,
      column: col,
      candidates,
      min,
      tiedRows: best.map((b) => b.row),
      chosenRow: chosen.row,
      fromRow: queens[col],
      currentConflicts: conflictsAt(queens, col, queens[col]),
    });

    // 5. move
    const from = queens[col];
    queens[col] = chosen.row;
    if (from !== chosen.row) moves += 1;
    const now = countConflicts(queens);
    history.push(now);
    if (now < bestSeen) {
      bestSeen = now;
      sinceImprove = 0;
    } else sinceImprove += 1;
    yield snap({ type: LS_EVT.MOVE, column: col, fromRow: from, toRow: chosen.row, stayed: from === chosen.row });
  }

  if (countConflicts(queens) === 0) {
    yield snap({ type: LS_EVT.SOLUTION_FOUND });
    return true;
  }
  yield snap({ type: LS_EVT.GIVE_UP });
  return false;
}

export function recordMinConflicts(initial, opts = {}) {
  const events = [];
  const gen = minConflicts(initial, opts);
  for (let r = gen.next(); !r.done; r = gen.next()) events.push(r.value);
  const last = events[events.length - 1];
  return { events, solved: last.type === LS_EVT.SOLUTION_FOUND, final: last.queens };
}

/**
 * Best single-move suggestion for hints: the (column,row) change that lowers total conflicts most.
 */
export function bestMove(queens) {
  const base = countConflicts(queens);
  let best = null;
  for (const col of conflictedColumns(queens)) {
    for (let row = 0; row < queens.length; row++) {
      if (row === queens[col]) continue;
      const next = [...queens];
      next[col] = row;
      const c = countConflicts(next);
      if (!best || c < best.conflicts) best = { col, row, conflicts: c, improvement: base - c };
    }
  }
  return best;
}
