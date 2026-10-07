/**
 * Generic CSP abstraction shared by every challenge.
 *
 *   CSP
 *   ├── variables   : string[]
 *   ├── domains     : { [variable]: value[] }
 *   └── constraints : [{ id, scope: string[], check(assignment) -> boolean, describe(assignment) -> string }]
 *
 * A constraint's `check` receives a (possibly partial) assignment and must return
 * true when the constraint is NOT violated by what is assigned so far. Constraints
 * whose variables are not all assigned yet are treated as satisfied (they cannot
 * be falsified yet), which makes the same check usable for both partial-assignment
 * search (backtracking) and complete-state evaluation (local search).
 */

export function createCSP({ name, variables, domains, constraints }) {
  const byVar = {};
  variables.forEach((v) => (byVar[v] = []));
  constraints.forEach((c) => c.scope.forEach((v) => byVar[v] && byVar[v].push(c)));
  return { name, variables, domains, constraints, constraintsByVar: byVar };
}

export function isAssigned(assignment, v) {
  return assignment[v] !== undefined && assignment[v] !== null;
}

/** Constraints touching `variable` that are violated by `assignment`. */
export function violatedConstraints(csp, assignment, variable) {
  const list = variable ? csp.constraintsByVar[variable] || [] : csp.constraints;
  return list.filter((c) => !c.check(assignment));
}

export function isConsistent(csp, assignment) {
  return csp.constraints.every((c) => c.check(assignment));
}

export function isComplete(csp, assignment) {
  return csp.variables.every((v) => isAssigned(assignment, v));
}

export function isSolution(csp, assignment) {
  return isComplete(csp, assignment) && isConsistent(csp, assignment);
}

/** Deterministic PRNG (mulberry32) so solver runs are reproducible. */
export function makeRng(seed = 1) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
