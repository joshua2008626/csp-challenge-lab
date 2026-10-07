import { EVT } from '../algorithms/backtracking.js';
import { LS_EVT } from '../algorithms/minConflicts.js';
import { colorById, neighboursOf } from '../algorithms/mapColoring.js';
import { columnAnalysis } from '../algorithms/cryptArithmetic.js';

/**
 * Explanation engine. Every message is built from the REAL event / game state that just happened.
 * Message = { key, tone, title, body, why, constraints:[{left,op,right,status}], badge }
 */

const rname = (map, id) => map.regions.find((r) => r.id === id)?.name || id;
const cname = (id) => colorById(id)?.name || id;
const sw = (id) => colorById(id)?.hex;

/* ------------------------------ Map Coloring: player ------------------------------ */

export function mapPlayMessage(map, ev, colorIds) {
  if (!ev) return null;
  const { type, region, color, coloring, conflicts } = ev;
  const key = `${type}-${region}-${color}-${ev.n}`;
  if (type === 'solved') {
    return { key, tone: 'good', title: 'Map complete — every border is satisfied!', body: `All ${map.regions.length} regions have a colour and no two neighbours match. That is a solution to the CSP.`, why: 'A solution is a complete assignment that is also consistent.', badge: 'Solved' };
  }
  if (type === 'erase') {
    return { key, tone: 'info', title: `You cleared ${rname(map, region)}`, body: 'The variable is unassigned again, so its domain is open and its constraints are not checked.', why: 'Partial assignments only need to be consistent for the variables that have values.' };
  }
  const nbrs = neighboursOf(map, region);
  const rows = nbrs.map((n) => ({
    left: { label: rname(map, region), swatch: sw(color) },
    op: '≠',
    opLabel: 'must differ from',
    right: { label: rname(map, n), swatch: coloring[n] ? sw(coloring[n]) : undefined, value: coloring[n] ? '' : 'no colour' },
    status: !coloring[n] ? 'pending' : coloring[n] === color ? 'bad' : 'ok',
  }));
  const bad = conflicts.filter(([a, b]) => a === region || b === region);
  if (bad.length) {
    const others = bad.map(([a, b]) => rname(map, a === region ? b : a));
    return {
      key, tone: 'bad', badge: 'Conflict',
      title: 'Conflict detected!',
      body: `${rname(map, region)} and ${others.join(' and ')} ${others.length > 1 ? 'are' : 'is'} adjacent, so they cannot both be ${cname(color)}.`,
      why: `Each border is a constraint Color(A) ≠ Color(B). ${cname(color)} on ${rname(map, region)} violates ${bad.length} of them.`,
      constraints: rows,
    };
  }
  const left = colorIds.filter((c) => !nbrs.some((n) => coloring[n] === c));
  return {
    key, tone: 'good',
    title: `You assigned ${cname(color)} to ${rname(map, region)}`,
    body: `No neighbour uses ${cname(color)}, so every constraint on ${rname(map, region)} is satisfied so far.`,
    why: `${rname(map, region)} touches ${nbrs.length} region${nbrs.length === 1 ? '' : 's'}; ${nbrs.filter((n) => coloring[n]).length} already coloured. Colours still legal here: ${left.map(cname).join(', ') || 'none'}.`,
    constraints: rows,
  };
}

/* ------------------------------ Backtracking events (map) ------------------------------ */

export function mapEventMessage(map, e, ordering = 'static') {
  if (!e) return null;
  const n = rname(map, e.variable);
  const key = `${e.type}-${e.variable}-${e.value}-${e.stats?.checks}-${e.stats?.backtracks}`;
  switch (e.type) {
    case EVT.SELECT_VARIABLE:
      return { key, tone: 'think', title: `Select ${n}`, body: e.remaining != null ? `${n} has the fewest legal colours left (${e.remaining}), so it is the most constrained region.` : `${n} is the next unassigned region in the list.`, why: e.remaining != null ? 'Minimum Remaining Values (MRV): deciding the most constrained variable first exposes dead ends early.' : 'Static ordering simply follows the order of the variables.', constraints: [{ text: `Domain of ${n}: ${(e.domain || []).map(cname).join(', ')}`, status: 'pending' }] };
    case EVT.TRY_VALUE:
      return { key, tone: 'think', title: `Try ${cname(e.value)} for ${n}`, body: 'Take the next untried value from the domain and test it against the constraints.', why: 'Backtracking assigns one variable at a time and only keeps values that stay consistent.' };
    case EVT.CHECK_CONSTRAINT:
      return { key, tone: e.ok ? 'good' : 'bad', title: e.ok ? 'Check constraint ✓' : 'Check constraint ✗', body: e.detail, why: 'The algorithm checks every border that touches the region it just coloured.', constraints: [{ text: e.detail, status: e.ok ? 'ok' : 'bad' }] };
    case EVT.CONFLICT:
      return { key, tone: 'bad', badge: 'Conflict', title: 'CONFLICT', body: e.wipeout ? `Forward checking: ${cname(e.value)} on ${n} would leave ${rname(map, e.wipeout)} with no colour at all.` : e.detail, why: 'This value breaks a constraint, so it is rejected and the next value is tried.', constraints: e.constraint ? [{ text: e.detail, status: 'bad' }] : [] };
    case EVT.ASSIGN:
      return { key, tone: 'good', title: `Assign ${n} = ${cname(e.value)}`, body: 'This value satisfies all currently known constraints.', why: 'The assignment is consistent so far, so the search goes one level deeper.' };
    case EVT.PRUNE:
      return { key, tone: 'info', title: 'Forward checking prunes neighbours', body: e.pruned.map((p) => `${rname(map, p.variable)} loses ${p.values.map(cname).join(', ')}`).join(' · '), why: 'Colours that would clash with the new assignment are removed from the neighbours\' domains in advance.' };
    case EVT.BACKTRACK:
      return { key, tone: 'warn', badge: 'Backtrack', title: `BACKTRACK: undo ${n} = ${cname(e.value)}`, body: 'The current assignment violates a constraint further down the search, so the algorithm returns to the previous decision.', why: 'Backtracking = undo the last choice and try its next value.' };
    case EVT.DEAD_END:
      return { key, tone: 'bad', title: `Dead end at ${n}`, body: `Every colour in the domain of ${n} was rejected.`, why: 'With no legal value left, the previous variable has to change.' };
    case EVT.SOLUTION_FOUND:
      return { key, tone: 'good', badge: 'Solved', title: 'Solution found!', body: `All regions are coloured with no conflicting border. Backtracks: ${e.stats.backtracks}, constraint checks: ${e.stats.checks}.`, why: 'A complete, consistent assignment is a solution.' };
    case EVT.FAILURE:
      return { key, tone: 'bad', title: 'No solution exists', body: 'The whole search space was exhausted.', why: 'Every branch ended in a conflict.' };
    default:
      return null;
  }
}

export function mapStatus(e) {
  switch (e?.type) {
    case EVT.SELECT_VARIABLE: return ['Selecting next variable…', 'think'];
    case EVT.TRY_VALUE: return ['Trying assignment…', 'think'];
    case EVT.CHECK_CONSTRAINT: return [e.ok ? 'Constraint satisfied' : 'Constraint violated', e.ok ? 'good' : 'bad'];
    case EVT.CONFLICT: return ['Conflict — value rejected', 'bad'];
    case EVT.ASSIGN: return ['Assignment accepted', 'good'];
    case EVT.PRUNE: return ['Pruning neighbour domains', 'info'];
    case EVT.BACKTRACK: return ['Backtracking…', 'warn'];
    case EVT.DEAD_END: return ['Dead end', 'bad'];
    case EVT.SOLUTION_FOUND: return ['Solved', 'good'];
    case EVT.FAILURE: return ['No solution', 'bad'];
    default: return ['Ready', 'info'];
  }
}

/* ------------------------------ Crypt-arithmetic ------------------------------ */

export function cryptEventMessage(puzzle, e) {
  if (!e) return null;
  const key = `${e.type}-${e.variable}-${e.value}-${e.stats?.checks}-${e.stats?.backtracks}`;
  const L = e.variable;
  switch (e.type) {
    case EVT.SELECT_VARIABLE:
      return { key, tone: 'think', title: `Select letter ${L}`, body: `Letters are decided column by column from the units column, so ${L} is next.`, why: 'Deciding low columns first lets the carry constraints fire as early as possible.', constraints: [{ text: `Domain of ${L}: ${(e.domain || []).join(', ')}`, status: 'pending' }] };
    case EVT.TRY_VALUE:
      return { key, tone: 'think', title: `Trying ${L} = ${e.value}`, body: 'Checking whether this assignment violates any constraints…', why: 'Each digit in the domain is tested in turn.' };
    case EVT.CHECK_CONSTRAINT:
      return { key, tone: e.ok ? 'good' : 'bad', title: e.ok ? 'Constraint satisfied' : 'Constraint violated', body: e.detail, why: e.constraint?.kind === 'ALL_DIFFERENT' ? 'All-different: every letter needs its own digit.' : e.constraint?.kind === 'COLUMN' ? 'Carry constraint: the low digits of the sum must match the result.' : 'The full equation must hold.', constraints: [{ text: e.detail, status: e.ok ? 'ok' : 'bad' }] };
    case EVT.CONFLICT:
      return { key, tone: 'bad', badge: 'Rejected', title: `${L} = ${e.value} rejected`, body: e.detail ? `Assignment rejected. ${e.detail}` : 'Assignment rejected.', why: 'The value breaks a constraint, so the next digit is tried.' };
    case EVT.ASSIGN:
      return { key, tone: 'good', title: `Assign ${L} = ${e.value}`, body: 'This digit is consistent with every constraint that can be checked so far.', why: 'The search moves on to the next letter.' };
    case EVT.PRUNE:
      return { key, tone: 'info', title: 'Forward checking prunes domains', body: e.pruned.map((p) => `${p.variable} loses ${p.values.join(', ')}`).join(' · '), why: 'Digits that clash with the new assignment are removed from other letters\' domains.' };
    case EVT.BACKTRACK:
      return { key, tone: 'warn', badge: 'Backtrack', title: `Backtracking: undo ${L} = ${e.value}`, body: 'Backtracking to the previous variable and trying its next value.', why: 'Every digit for a later letter failed, so this choice must change.' };
    case EVT.DEAD_END:
      return { key, tone: 'bad', title: `No digit left for ${L}`, body: 'All digits were rejected.', why: 'Return to the previous letter.' };
    case EVT.SOLUTION_FOUND:
      return { key, tone: 'good', badge: 'Solved', title: 'Solution found!', body: `${puzzle.addends.join(' + ')} = ${puzzle.result} is satisfied. Backtracks: ${e.stats.backtracks}.`, why: 'Complete and consistent.' };
    case EVT.FAILURE:
      return { key, tone: 'bad', title: 'No solution', body: 'Search space exhausted.' };
    default: return null;
  }
}

export function cryptPlayMessage(puzzle, ev, problems, asg) {
  if (!ev) return null;
  const key = `${ev.type}-${ev.letter}-${ev.digit}-${ev.n}`;
  if (ev.type === 'solved') return { key, tone: 'good', badge: 'Solved', title: 'Puzzle solved!', body: 'Every column adds up, no digit is reused and no leading letter is 0.', why: 'All constraints hold for a complete assignment.' };
  if (ev.type === 'clear') return { key, tone: 'info', title: `${ev.letter} is unassigned again`, body: 'The letter is back to a variable with a full domain.' };
  const mine = problems.filter((p) => p.letters.includes(ev.letter));
  if (mine.length) {
    const p = mine[0];
    const why = p.type === 'DUPLICATE' ? 'All-different constraint: no two letters may share a digit.' : p.type === 'LEADING_ZERO' ? 'Leading letters of a word cannot be 0.' : 'Carry constraint: digits in a column plus the incoming carry must end in the result digit.';
    return { key, tone: 'bad', badge: 'Mistake', title: `${ev.letter} = ${ev.digit} causes a problem`, body: p.message, why };
  }
  const col = columnAnalysis(puzzle, asg).find((c) => c.ready && c.ok);
  return { key, tone: 'good', title: `${ev.letter} = ${ev.digit}`, body: 'No constraint is violated by this digit so far.', why: col ? `Column ${col.index + 1} is now fully determined and checks out (carry ${col.carryOut}).` : 'Keep going: columns are checked as soon as all their letters have digits.' };
}

/* ------------------------------ N-Queens ------------------------------ */

export function queensPlayMessage(ev) {
  if (!ev) return null;
  const key = `${ev.type}-${ev.col}-${ev.row}-${ev.n}`;
  if (ev.type === 'solved') return { key, tone: 'good', badge: 'Solved', title: 'Zero conflicts!', body: 'No two queens share a row, column or diagonal.', why: 'All pairwise constraints are satisfied: a solution.' };
  const delta = ev.after - ev.before;
  const common = { key, why: 'Local search judges a state by its number of violated constraints (attacking pairs) and tries to push it to 0.' };
  if (delta < 0) return { ...common, tone: 'good', title: `Moved Q${ev.col + 1} to row ${ev.row + 1}`, body: `Conflicts dropped from ${ev.before} to ${ev.after}. This position produces fewer conflicts than where the queen was.` };
  if (delta === 0) return { ...common, tone: 'info', title: `Moved Q${ev.col + 1} to row ${ev.row + 1}`, body: `Conflicts stay at ${ev.after}: a sideways move on a plateau. Sometimes needed, but it does not make progress by itself.` };
  return { ...common, tone: 'bad', badge: 'Worse', title: `Moved Q${ev.col + 1} to row ${ev.row + 1}`, body: `Conflicts rose from ${ev.before} to ${ev.after}. Check the numbers on the squares: pick one with a smaller value.` };
}

export function minConflictsMessage(e) {
  if (!e) return null;
  const key = `${e.type}-${e.iteration}-${e.column}-${e.queens.join('')}`;
  switch (e.type) {
    case LS_EVT.INIT:
      return { key, tone: 'info', title: 'Start from a complete (wrong) state', body: `Every queen is already placed, and the board has ${e.conflicts} attacking pair${e.conflicts === 1 ? '' : 's'}.`, why: 'Local search does not build a solution from an empty board. It starts with a full assignment and repairs it.' };
    case LS_EVT.PICK_VARIABLE:
      return { key, tone: 'think', title: `Pick conflicted variable Q${e.column + 1}`, body: `Queens in columns ${e.conflictedColumns.map((c) => c + 1).join(', ')} are under attack. One of them is chosen at random.`, why: 'Min-Conflicts only repairs variables that actually take part in a conflict.' };
    case LS_EVT.EVALUATE: {
      const rows = e.tiedRows.map((r) => r + 1).join(', ');
      return { key, tone: 'think', title: `Evaluate every row for Q${e.column + 1}`, body: `Conflicts if the queen stood on each row are shown on the board. The minimum is ${e.min} (row${e.tiedRows.length > 1 ? 's' : ''} ${rows}); row ${e.chosenRow + 1} is chosen${e.tiedRows.length > 1 ? ' (ties broken at random)' : ''}.`, why: 'This position produces fewer conflicts than the alternatives.' };
    }
    case LS_EVT.MOVE:
      return { key, tone: e.stayed ? 'info' : 'good', title: e.stayed ? `Q${e.column + 1} stays on row ${e.toRow + 1}` : `Move Q${e.column + 1}: row ${e.fromRow + 1} → row ${e.toRow + 1}`, body: `Total conflicts are now ${e.conflicts}.`, why: 'Repeat: pick another conflicted queen until the conflicts reach 0.' };
    case LS_EVT.RESTART:
      return { key, tone: 'warn', badge: 'Restart', title: 'Stuck — random restart', body: 'The search stopped improving (a local minimum or plateau), so it jumps to a new random state.', why: 'Local search can get trapped; random restarts are the standard escape.' };
    case LS_EVT.SOLUTION_FOUND:
      return { key, tone: 'good', badge: 'Solved', title: 'Zero conflicts reached!', body: `Solved after ${e.iteration} iteration${e.iteration === 1 ? '' : 's'} and ${e.moves} move${e.moves === 1 ? '' : 's'}${e.restarts ? `, with ${e.restarts} restart${e.restarts === 1 ? '' : 's'}` : ''}.`, why: 'A state with no violated constraints is a solution.' };
    case LS_EVT.GIVE_UP:
      return { key, tone: 'bad', title: 'Iteration budget used up', body: `Still ${e.conflicts} conflicts. Min-Conflicts is incomplete: it can fail even when a solution exists.`, why: 'Unlike backtracking, local search gives no guarantee.' };
    default: return null;
  }
}

export function lsStatus(e) {
  switch (e?.type) {
    case LS_EVT.INIT: return ['Initial random state', 'info'];
    case LS_EVT.PICK_VARIABLE: return ['Selecting conflicted queen…', 'think'];
    case LS_EVT.EVALUATE: return ['Counting conflicts per row…', 'think'];
    case LS_EVT.MOVE: return ['Queen moved', 'good'];
    case LS_EVT.RESTART: return ['Random restart', 'warn'];
    case LS_EVT.SOLUTION_FOUND: return ['Solved: 0 conflicts', 'good'];
    case LS_EVT.GIVE_UP: return ['Gave up', 'bad'];
    default: return ['Ready', 'info'];
  }
}
