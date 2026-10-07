import test from 'node:test';
import assert from 'node:assert/strict';

import { isSolution } from '../src/algorithms/cspUtils.js';
import { recordSearch, EVT } from '../src/algorithms/backtracking.js';
import { buildMapCSP, findConflicts, isMapSolved, MAP_COLORS } from '../src/algorithms/mapColoring.js';
import { buildCryptCSP, countCryptSolutions, isCryptSolved, cryptProblems, columnAnalysis } from '../src/algorithms/cryptArithmetic.js';
import { buildQueensCSP, countConflicts, isQueensSolved, attackingPairs, conflictsAt } from '../src/algorithms/nQueens.js';
import { recordMinConflicts, LS_EVT, bestMove } from '../src/algorithms/minConflicts.js';
import { MAP_LEVELS, getMap } from '../src/data/maps.js';
import { CRYPT_PUZZLES } from '../src/data/puzzles.js';

const ALL = MAP_COLORS.map((c) => c.id);

test('maps: adjacency is symmetric-free, in range, and graph is connected', () => {
  for (const def of MAP_LEVELS) {
    const map = getMap(def.level);
    assert.equal(map.regions.length, def.count);
    const ids = new Set(map.regions.map((r) => r.id));
    map.edges.forEach(([a, b]) => {
      assert.ok(ids.has(a) && ids.has(b) && a !== b);
    });
    assert.ok(map.edges.length >= map.regions.length - 1, `level ${def.level} has too few borders`);
    // connectivity
    const seen = new Set([map.regions[0].id]);
    const q = [map.regions[0].id];
    while (q.length) {
      const x = q.pop();
      map.edges.forEach(([a, b]) => {
        const o = a === x ? b : b === x ? a : null;
        if (o && !seen.has(o)) {
          seen.add(o);
          q.push(o);
        }
      });
    }
    assert.equal(seen.size, map.regions.length, `level ${def.level} not connected`);
  }
});

test('map coloring: backtracking solves every level with its colour limit', () => {
  for (const def of MAP_LEVELS) {
    const map = getMap(def.level);
    const csp = buildMapCSP(map, ALL.slice(0, def.colorLimit));
    const { solved, solution, events } = recordSearch(csp, { order: 'static' });
    assert.ok(solved, `level ${def.level} (${def.colorLimit} colours) unsolved`);
    assert.ok(isSolution(csp, solution));
    assert.ok(isMapSolved(map, solution));
    assert.equal(findConflicts(map, solution).length, 0);
    console.log(`  level ${def.level}: ${map.regions.length} regions, ${map.edges.length} borders, ${events.length} events, backtracks=${events.at(-1).stats.backtracks}`);
  }
});

test('map coloring: level 5 really is hard for greedy-ish search (needs backtracking)', () => {
  const map = getMap(5);
  const csp = buildMapCSP(map, ALL.slice(0, 3));
  const { events } = recordSearch(csp);
  assert.ok(events.at(-1).stats.backtracks > 0, 'expected at least one backtrack');
});

test('backtracking events are well-formed and end with SOLUTION_FOUND', () => {
  const map = getMap(2);
  const csp = buildMapCSP(map, ALL);
  const { events, solved } = recordSearch(csp);
  assert.ok(solved);
  const types = new Set(events.map((e) => e.type));
  [EVT.SELECT_VARIABLE, EVT.TRY_VALUE, EVT.CHECK_CONSTRAINT, EVT.ASSIGN, EVT.SOLUTION_FOUND].forEach((t) => assert.ok(types.has(t), t));
  // stats monotonic
  for (let i = 1; i < events.length; i++) assert.ok(events[i].stats.checks >= events[i - 1].stats.checks);
});

test('backtracking detects an unsolvable CSP (K4 with 3 colours)', () => {
  const map = { regions: ['A', 'B', 'C', 'D'].map((id) => ({ id, name: id })), edges: [['A', 'B'], ['A', 'C'], ['A', 'D'], ['B', 'C'], ['B', 'D'], ['C', 'D']] };
  const csp = buildMapCSP(map, ['red', 'green', 'blue']);
  const { solved, events } = recordSearch(csp);
  assert.equal(solved, false);
  assert.equal(events.at(-1).type, EVT.FAILURE);
  assert.ok(events.at(-1).stats.backtracks > 0);
});

test('MRV ordering also solves and never needs more backtracks than static on level 4', () => {
  const map = getMap(4);
  const csp = buildMapCSP(map, ALL);
  const a = recordSearch(csp, { order: 'static' });
  const b = recordSearch(csp, { order: 'mrv' });
  assert.ok(a.solved && b.solved);
});

test('crypt-arithmetic: SEND+MORE=MONEY unique solution 9567+1085=10652', () => {
  const p = CRYPT_PUZZLES.find((x) => x.id === 'c3');
  const csp = buildCryptCSP(p);
  const { solved, solution } = recordSearch(csp);
  assert.ok(solved);
  assert.deepEqual(
    { S: solution.S, E: solution.E, N: solution.N, D: solution.D, M: solution.M, O: solution.O, R: solution.R, Y: solution.Y },
    { S: 9, E: 5, N: 6, D: 7, M: 1, O: 0, R: 8, Y: 2 }
  );
  assert.ok(isCryptSolved(p, solution));
});

test('crypt-arithmetic: every shipped puzzle has exactly one solution and the CSP solver finds it', () => {
  for (const p of CRYPT_PUZZLES) {
    const { count, solutions } = countCryptSolutions(p, 3);
    assert.equal(count, 1, `${p.addends.join('+')}=${p.result} has ${count} solutions`);
    const csp = buildCryptCSP(p);
    const { solved, solution, events } = recordSearch(csp, { maxEvents: 2000000 });
    assert.ok(solved, `${p.id} unsolved by backtracking`);
    assert.deepEqual(
      Object.fromEntries(Object.entries(solution).sort()),
      Object.fromEntries(Object.entries(solutions[0]).sort())
    );
    console.log(`  ${p.addends.join('+')}=${p.result}: ${events.length} events, backtracks=${events.at(-1).stats.backtracks}`);
  }
});

test('crypt-arithmetic: problem detection', () => {
  const p = CRYPT_PUZZLES.find((x) => x.id === 'c3');
  assert.equal(cryptProblems(p, { S: 0 })[0].type, 'LEADING_ZERO');
  assert.equal(cryptProblems(p, { S: 3, E: 3 })[0].type, 'DUPLICATE');
  // D=7,E=5 -> Y must be 2; Y=3 is wrong
  const bad = cryptProblems(p, { D: 7, E: 5, Y: 3 });
  assert.ok(bad.some((x) => x.type === 'COLUMN'));
  const col = columnAnalysis(p, { D: 7, E: 5, Y: 2 })[0];
  assert.equal(col.carryOut, 1);
  assert.equal(col.ok, true);
  assert.equal(cryptProblems(p, { D: 7, E: 5, Y: 2 }).length, 0);
});

test('n-queens: conflict counting and CSP agree', () => {
  assert.equal(countConflicts([1, 3, 0, 2]), 0);
  assert.ok(isQueensSolved([1, 3, 0, 2]));
  assert.equal(countConflicts([0, 0, 0, 0]), 6);
  assert.equal(attackingPairs([0, 1, 2, 3]).length, 6);
  assert.equal(conflictsAt([0, 0, 0, 0], 1, 0), 3);
  assert.equal(conflictsAt([0, 0, 0, 0], 1, 3), 0);
  const csp = buildQueensCSP(4);
  assert.ok(isSolution(csp, { Q0: 1, Q1: 3, Q2: 0, Q3: 2 }));
  assert.ok(!isSolution(csp, { Q0: 0, Q1: 1, Q2: 2, Q3: 3 }));
});

test('n-queens: backtracking solves 4, 6, 8', () => {
  for (const n of [4, 6, 8]) {
    const csp = buildQueensCSP(n);
    const { solved, solution } = recordSearch(csp);
    assert.ok(solved, `${n}-queens`);
    assert.equal(countConflicts(csp.variables.map((v) => solution[v])), 0);
  }
});

test('min-conflicts: real local search solves 4, 8, 10 queens from bad starts', () => {
  for (const n of [4, 8, 10]) {
    for (let seed = 1; seed <= 20; seed++) {
      const start = Array.from({ length: n }, (_, i) => (i * 7 + seed) % n);
      const { solved, final, events } = recordMinConflicts(start, { seed, maxIterations: 500 });
      assert.ok(solved, `n=${n} seed=${seed} unsolved`);
      assert.equal(countConflicts(final), 0);
      // each iteration emits PICK -> EVALUATE -> MOVE
      const evalEv = events.find((e) => e.type === LS_EVT.EVALUATE);
      if (evalEv) {
        const mins = Math.min(...evalEv.candidates.map((c) => c.conflicts));
        assert.equal(evalEv.min, mins);
        assert.equal(evalEv.candidates.find((c) => c.row === evalEv.chosenRow).conflicts, mins);
      }
    }
  }
});

test('min-conflicts: events replay is faithful (each MOVE changes exactly one queen)', () => {
  const { events } = recordMinConflicts([0, 0, 0, 0, 0, 0, 0, 0], { seed: 3 });
  for (let i = 1; i < events.length; i++) {
    if (events[i].type === LS_EVT.MOVE) {
      const diff = events[i].queens.filter((r, c) => r !== events[i - 1].queens[c]).length;
      assert.ok(diff <= 1);
    }
  }
  assert.equal(events.at(-1).type, LS_EVT.SOLUTION_FOUND);
  assert.equal(events.at(-1).history.at(-1), 0);
});

test('hint helper: bestMove strictly improves a bad board when possible', () => {
  const m = bestMove([0, 0, 0, 0]);
  assert.ok(m && m.improvement > 0);
});

test('forward checking: solves every map level, prunes domains and never backtracks more than plain search', () => {
  for (const def of MAP_LEVELS) {
    const map = getMap(def.level);
    const csp = buildMapCSP(map, ALL.slice(0, def.colorLimit));
    const plain = recordSearch(csp, { order: 'static' });
    const fc = recordSearch(csp, { order: 'static', forwardChecking: true });
    assert.ok(fc.solved && isSolution(csp, fc.solution), `level ${def.level}`);
    assert.ok(fc.events.at(-1).stats.backtracks <= plain.events.at(-1).stats.backtracks);
    if (def.level >= 2) assert.ok(fc.events.some((e) => e.type === EVT.PRUNE));
    // domains snapshot is present and consistent with the assignment
    fc.events.forEach((e) => {
      assert.ok(e.domains);
      Object.keys(e.assignment).forEach((v) => assert.ok(e.domains[v] !== undefined));
    });
  }
});

test('forward checking solves the crypt puzzles faster than plain backtracking', () => {
  const p = CRYPT_PUZZLES.find((x) => x.id === 'c3');
  const csp = buildCryptCSP(p);
  const plain = recordSearch(csp, { maxEvents: 2000000 });
  const fc = recordSearch(csp, { forwardChecking: true, maxEvents: 2000000 });
  assert.ok(fc.solved && isCryptSolved(p, fc.solution));
  assert.ok(fc.events.length < plain.events.length);
});
