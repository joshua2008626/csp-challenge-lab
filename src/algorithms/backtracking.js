/**
 * Generic recursive backtracking search for any CSP (see cspUtils.js).
 *
 * The search is written as a generator that yields *events*. The UI never fakes
 * anything: it replays exactly the events the real algorithm produced.
 *
 * Event types
 *   SELECT_VARIABLE  – the algorithm picked the next unassigned variable
 *   TRY_VALUE        – it is about to test a value from the variable's domain
 *   CHECK_CONSTRAINT – one constraint was evaluated (ok: true | false)
 *   CONFLICT         – the value violates a constraint (or empties a neighbour's domain) and is rejected
 *   ASSIGN           – the value passed every check and is committed
 *   PRUNE            – (forward checking) values removed from an unassigned neighbour's domain
 *   BACKTRACK        – the assignment is undone, returning to the previous decision
 *   DEAD_END         – a variable has no value left in its domain
 *   SOLUTION_FOUND   – every variable is assigned consistently
 *   FAILURE          – the whole search space was exhausted (no solution)
 *
 * Every event carries a snapshot { assignment, stats } (and `domains` when forward checking is on),
 * so stepping *backwards* is just reading an earlier event.
 *
 * Options
 *   order           'static' (given order) | 'mrv' (Minimum Remaining Values: fewest legal values first)
 *   forwardChecking  prune neighbours' domains after each assignment; an emptied domain is an early conflict
 *   maxEvents        safety cap used by recordSearch
 */

export const EVT = {
  SELECT_VARIABLE: 'SELECT_VARIABLE',
  TRY_VALUE: 'TRY_VALUE',
  CHECK_CONSTRAINT: 'CHECK_CONSTRAINT',
  CONFLICT: 'CONFLICT',
  ASSIGN: 'ASSIGN',
  PRUNE: 'PRUNE',
  BACKTRACK: 'BACKTRACK',
  DEAD_END: 'DEAD_END',
  SOLUTION_FOUND: 'SOLUTION_FOUND',
  FAILURE: 'FAILURE',
};

export function* backtrackingSearch(csp, opts = {}) {
  const order = opts.order || 'static';
  const fc = !!opts.forwardChecking;
  const assignment = {};
  const domains = {};
  csp.variables.forEach((v) => (domains[v] = [...csp.domains[v]]));
  const stats = { checks: 0, backtracks: 0, assignments: 0, prunes: 0, depth: 0, maxDepth: 0 };

  const snap = (extra) => ({
    ...extra,
    assignment: { ...assignment },
    stats: { ...stats },
    ...(fc ? { domains: Object.fromEntries(Object.entries(domains).map(([k, v]) => [k, [...v]])) } : {}),
  });

  const legalValues = (variable) =>
    domains[variable].filter((val) => {
      assignment[variable] = val;
      const ok = (csp.constraintsByVar[variable] || []).every((c) => c.check(assignment));
      delete assignment[variable];
      return ok;
    });

  function pickVariable() {
    const unassigned = csp.variables.filter((v) => assignment[v] === undefined);
    if (unassigned.length === 0) return null;
    if (order === 'static') return { variable: unassigned[0], remaining: null };
    let best = null;
    let bestCount = Infinity;
    for (const v of unassigned) {
      const n = legalValues(v).length;
      if (n < bestCount) {
        bestCount = n;
        best = v;
      }
    }
    return { variable: best, remaining: bestCount };
  }

  /**
   * Forward checking after assigning `variable`. Returns { pruned: [{variable, values}], wipeout }.
   * Mutates `domains`; the caller restores them from `pruned` when the assignment is undone.
   */
  function forwardCheck(variable) {
    const pruned = [];
    const touching = csp.constraintsByVar[variable] || [];
    const neighbours = new Set();
    touching.forEach((c) => c.scope.forEach((v) => v !== variable && assignment[v] === undefined && neighbours.add(v)));
    for (const y of neighbours) {
      const relevant = (csp.constraintsByVar[y] || []).filter((c) => c.scope.includes(variable));
      const removed = [];
      for (const val of domains[y]) {
        assignment[y] = val;
        const ok = relevant.every((c) => c.check(assignment));
        delete assignment[y];
        if (!ok) removed.push(val);
      }
      if (removed.length) {
        domains[y] = domains[y].filter((v) => !removed.includes(v));
        pruned.push({ variable: y, values: removed });
        stats.prunes += removed.length;
      }
      if (domains[y].length === 0) return { pruned, wipeout: y };
    }
    return { pruned, wipeout: null };
  }

  const restore = (pruned) => {
    pruned.forEach(({ variable, values }) => {
      domains[variable] = csp.domains[variable].filter((v) => domains[variable].includes(v) || values.includes(v));
    });
  };

  function* recurse() {
    const pick = pickVariable();
    if (pick === null) {
      yield snap({ type: EVT.SOLUTION_FOUND });
      return true;
    }
    const { variable } = pick;
    stats.depth += 1;
    stats.maxDepth = Math.max(stats.maxDepth, stats.depth);
    const candidates = [...domains[variable]];
    yield snap({
      type: EVT.SELECT_VARIABLE,
      variable,
      remaining: pick.remaining,
      domain: candidates,
    });

    for (const value of candidates) {
      yield snap({ type: EVT.TRY_VALUE, variable, value });
      assignment[variable] = value;

      let violated = null;
      for (const c of csp.constraintsByVar[variable] || []) {
        stats.checks += 1;
        const ok = c.check(assignment);
        yield snap({
          type: EVT.CHECK_CONSTRAINT,
          variable,
          value,
          constraint: c,
          ok,
          detail: c.describe ? c.describe(assignment, ok) : '',
        });
        if (!ok) {
          violated = c;
          break;
        }
      }

      if (violated) {
        yield snap({
          type: EVT.CONFLICT,
          variable,
          value,
          constraint: violated,
          detail: violated.describe ? violated.describe(assignment, false) : '',
        });
        delete assignment[variable];
        continue;
      }

      let pruned = [];
      if (fc) {
        const res = forwardCheck(variable);
        pruned = res.pruned;
        if (pruned.length) yield snap({ type: EVT.PRUNE, variable, value, pruned: pruned.map((p) => ({ ...p })) });
        if (res.wipeout) {
          yield snap({
            type: EVT.CONFLICT,
            variable,
            value,
            wipeout: res.wipeout,
            constraint: null,
            detail: `Forward checking: ${variable}=${value} would leave ${res.wipeout} with no legal value`,
          });
          restore(pruned);
          delete assignment[variable];
          continue;
        }
      }

      stats.assignments += 1;
      yield snap({ type: EVT.ASSIGN, variable, value });
      const solved = yield* recurse();
      if (solved) return true;

      restore(pruned);
      delete assignment[variable];
      stats.backtracks += 1;
      yield snap({ type: EVT.BACKTRACK, variable, value });
    }

    yield snap({ type: EVT.DEAD_END, variable });
    stats.depth -= 1;
    return false;
  }

  const solved = yield* recurse();
  if (!solved) yield snap({ type: EVT.FAILURE });
  return solved;
}

/** Run the generator to completion and return every event (capped for safety). */
export function recordSearch(csp, opts = {}) {
  const cap = opts.maxEvents || 400000;
  const events = [];
  const gen = backtrackingSearch(csp, opts);
  let truncated = false;
  for (let r = gen.next(); !r.done; r = gen.next()) {
    events.push(r.value);
    if (events.length >= cap) {
      truncated = true;
      break;
    }
  }
  const last = events[events.length - 1];
  return {
    events,
    truncated,
    solved: !!last && last.type === EVT.SOLUTION_FOUND,
    solution: last && last.type === EVT.SOLUTION_FOUND ? last.assignment : null,
  };
}
