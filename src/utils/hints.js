import { columnOrder, cryptProblems, leadingLetters } from '../algorithms/cryptArithmetic.js';
import { recordSearch } from '../algorithms/backtracking.js';
import { buildMapCSP, colorById, findConflicts, legalColors, neighboursOf } from '../algorithms/mapColoring.js';
import { bestMove } from '../algorithms/minConflicts.js';
import { conflictedColumns, conflictsAt, countConflicts } from '../algorithms/nQueens.js';

/**
 * Hint generators. Every hint is computed from the real CSP state (domains, neighbours,
 * a real solution found by the solver) — nothing is hard-coded.
 * Each returns three hints, from gentle to explicit: [{ text, region?/letter?/col?, row?, color? }]
 */

const regionName = (map, id) => map.regions.find((r) => r.id === id)?.name || id;
const list = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} or ${xs[xs.length - 1]}`);

export function mapHints(map, coloring, colorIds) {
  const name = (id) => regionName(map, id);
  const conflicts = findConflicts(map, coloring);
  if (conflicts.length) {
    const [a, b] = conflicts[0];
    const cname = colorById(coloring[a])?.name;
    return [
      { text: 'Two neighbouring regions share a colour. Look for the ⚠ markers on the map.' },
      { text: `${name(a)} and ${name(b)} touch, but both are ${cname}. One of them has to change.`, region: a },
      { text: `Erase ${name(b)} (or recolour it) and pick a colour that none of its neighbours use.`, region: b },
    ];
  }
  const unassigned = map.regions.filter((r) => !coloring[r.id]);
  if (!unassigned.length) return [];

  const legal = Object.fromEntries(unassigned.map((r) => [r.id, legalColors(map, coloring, r.id, colorIds)]));
  const target = [...unassigned].sort(
    (x, y) => legal[x.id].length - legal[y.id].length || neighboursOf(map, y.id).length - neighboursOf(map, x.id).length
  )[0];

  // Can the current partial colouring still be completed? (Real search with pre-assigned values.)
  const csp = buildMapCSP(map, colorIds);
  const domains = {};
  map.regions.forEach((r) => (domains[r.id] = coloring[r.id] ? [coloring[r.id]] : [...colorIds]));
  const restricted = { ...csp, domains };
  const res = recordSearch(restricted, { order: 'mrv', forwardChecking: true, maxEvents: 60000 });

  if (!res.solved) {
    const worst = [...unassigned].sort((x, y) => legal[x.id].length - legal[y.id].length)[0];
    const nbrs = neighboursOf(map, worst.id).filter((n) => coloring[n]).map(name);
    return [
      { text: 'Your colouring is valid so far, but it has run into a dead end: no complete solution extends it.' },
      { text: `${name(worst.id)} has ${legal[worst.id].length === 0 ? 'no legal colour' : `only ${legal[worst.id].length} legal colour`} left.`, region: worst.id },
      { text: `Undo one of its neighbours (${nbrs.join(', ') || 'nearby regions'}) and choose a different colour — that is what backtracking does.`, region: worst.id },
    ];
  }
  const value = res.solution[target.id];
  const k = legal[target.id].length;
  return [
    { text: 'Start where the fewest options are left: the region whose neighbours already use the most colours.' },
    { text: `${name(target.id)} has ${k} legal colour${k === 1 ? '' : 's'} left: ${list(legal[target.id].map((c) => colorById(c).name))}.`, region: target.id },
    { text: `Try ${colorById(value).name} for ${name(target.id)}. It leads to a complete solution.`, region: target.id, color: value },
  ];
}

/** Digits a letter may take without immediately violating any constraint (a real domain). */
export function legalDigits(csp, asg, letter) {
  const out = [];
  for (const d of csp.domains[letter]) {
    const test = { ...asg, [letter]: d };
    if ((csp.constraintsByVar[letter] || []).every((c) => c.check(test))) out.push(d);
  }
  return out;
}

export function cryptHints(puzzle, csp, asg, solution) {
  const letters = columnOrder(puzzle);
  const wrong = letters.find((l) => asg[l] !== undefined && asg[l] !== solution[l]);
  if (wrong) {
    const problems = cryptProblems(puzzle, asg);
    return [
      { text: problems.length ? `Something already placed is off — read the problem under the puzzle.` : 'Everything placed so far looks legal, but one digit cannot be part of the answer.' },
      { text: `Re-check ${wrong}. It is currently ${asg[wrong]}, and that cannot lead to a solution.`, letter: wrong },
      { text: `${wrong} should be ${solution[wrong]}.`, letter: wrong, digit: solution[wrong] },
    ];
  }
  const unassigned = letters.filter((l) => asg[l] === undefined);
  if (!unassigned.length) return [];
  const legal = Object.fromEntries(unassigned.map((l) => [l, legalDigits(csp, asg, l)]));
  const target = [...unassigned].sort((a, b) => legal[a].length - legal[b].length || letters.indexOf(a) - letters.indexOf(b))[0];
  const words = [...puzzle.addends, puzzle.result];
  const col = Math.min(...words.map((w) => { const i = w.indexOf(target); return i === -1 ? 99 : w.length - 1 - i; }));
  const colNames = ['units', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands'];
  const names = puzzle.addends.map((w) => w[w.length - 1 - col] || '0');
  const rn = puzzle.result[puzzle.result.length - 1 - col] || '0';
  const lead = leadingLetters(puzzle);
  return [
    { text: `Work from the right. In the ${colNames[col] || `column ${col + 1}`} column: ${names.join(' + ')}${col ? ' + carry' : ''} = ${rn} + 10 × carry.`, letter: target },
    { text: `${target} ${lead.has(target) ? '(a leading letter, so never 0) ' : ''}can only be ${legal[target].length === 1 ? 'a single digit' : 'one of'}: ${legal[target].join(', ')}.`, letter: target },
    { text: `Try ${target} = ${solution[target]}.`, letter: target, digit: solution[target] },
  ];
}

export function queensHints(queens) {
  const total = countConflicts(queens);
  if (total === 0) return [];
  const cols = conflictedColumns(queens);
  const worst = [...cols].sort((a, b) => conflictsAt(queens, b, queens[b]) - conflictsAt(queens, a, queens[a]))[0];
  const attackers = conflictsAt(queens, worst, queens[worst]);
  const move = bestMove(queens);
  // Min-conflicts row for the most attacked queen
  let minRow = 0;
  let minVal = Infinity;
  for (let r = 0; r < queens.length; r++) {
    const c = conflictsAt(queens, worst, r);
    if (c < minVal) { minVal = c; minRow = r; }
  }
  const hints = [
    { text: `${total} pair${total === 1 ? '' : 's'} of queens attack each other. Focus on a queen that is under attack — look for the red ones.` },
    { text: `The queen in column ${worst + 1} is attacked ${attackers} time${attackers === 1 ? '' : 's'}. In that column, row ${minRow + 1} has the fewest conflicts (${minVal}).`, col: worst },
  ];
  if (move && move.improvement > 0) {
    hints.push({ text: `Move the queen in column ${move.col + 1} to row ${move.row + 1}: total conflicts drop from ${total} to ${move.conflicts}.`, col: move.col, row: move.row });
  } else {
    hints.push({ text: `No single move lowers the total — you are in a local minimum. Try a sideways move to row ${minRow + 1} in column ${worst + 1}, or shuffle to restart.`, col: worst, row: minRow });
  }
  return hints;
}
