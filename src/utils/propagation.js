/**
 * Unit propagation for ≠ constraints: whenever a variable's domain shrinks to a single value,
 * remove that value from every neighbour (repeat until nothing changes). This is the simplest
 * form of constraint propagation.
 * Returns { domains, steps:[{ from, color, to, forced }], wipeout }
 */
export function propagate(domains, edges) {
  const d = Object.fromEntries(Object.entries(domains).map(([k, v]) => [k, [...v]]));
  const nbrs = {};
  Object.keys(d).forEach((k) => (nbrs[k] = []));
  edges.forEach(([a, b]) => { nbrs[a].push(b); nbrs[b].push(a); });
  const steps = [];
  const done = new Set();
  const queue = Object.keys(d).filter((k) => d[k].length === 1);
  let wipeout = null;
  while (queue.length && !wipeout) {
    const x = queue.shift();
    if (done.has(x) || d[x].length !== 1) continue;
    done.add(x);
    const c = d[x][0];
    for (const y of nbrs[x]) {
      if (d[y].includes(c)) {
        d[y] = d[y].filter((v) => v !== c);
        steps.push({ from: x, color: c, to: y, forced: d[y].length === 1 ? d[y][0] : null });
        if (d[y].length === 0) { wipeout = y; break; }
        if (d[y].length === 1) queue.push(y);
      }
    }
  }
  return { domains: d, steps, wipeout };
}
