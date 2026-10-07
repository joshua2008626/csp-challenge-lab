import { createCSP } from './cspUtils.js';

export const MAP_COLORS = [
  { id: 'red', name: 'Red', hex: '#ef4444', symbol: '●', key: 'R' },
  { id: 'green', name: 'Green', hex: '#22c55e', symbol: '▲', key: 'G' },
  { id: 'blue', name: 'Blue', hex: '#3b82f6', symbol: '■', key: 'B' },
  { id: 'yellow', name: 'Yellow', hex: '#eab308', symbol: '◆', key: 'Y' },
];

export const colorById = (id) => MAP_COLORS.find((c) => c.id === id);

/** Build the map-coloring CSP: one variable per region, ≠ constraint per border. */
export function buildMapCSP(map, colors = MAP_COLORS.map((c) => c.id)) {
  const name = (id) => map.regions.find((r) => r.id === id)?.name || id;
  const variables = map.regions.map((r) => r.id);
  const domains = {};
  variables.forEach((v) => (domains[v] = [...colors]));
  const constraints = map.edges.map(([a, b]) => ({
    id: `${a}-${b}`,
    scope: [a, b],
    check: (asg) => asg[a] === undefined || asg[b] === undefined || asg[a] !== asg[b],
    describe: (asg, ok) =>
      asg[a] === undefined || asg[b] === undefined
        ? `${name(a)} ≠ ${name(b)}`
        : ok
        ? `${name(a)} (${colorById(asg[a])?.name}) ≠ ${name(b)} (${colorById(asg[b])?.name}) ✓`
        : `${name(a)} and ${name(b)} are neighbours but both are ${colorById(asg[a])?.name}`,
  }));
  return createCSP({ name: `Map: ${map.name}`, variables, domains, constraints });
}

/** All currently conflicting borders for a (possibly partial) coloring. */
export function findConflicts(map, coloring) {
  return map.edges.filter(([a, b]) => coloring[a] && coloring[b] && coloring[a] === coloring[b]);
}

/** Colors still legal for a region given its neighbours' colors. */
export function legalColors(map, coloring, regionId, colors = MAP_COLORS.map((c) => c.id)) {
  const neighbours = map.edges
    .filter(([a, b]) => a === regionId || b === regionId)
    .map(([a, b]) => (a === regionId ? b : a));
  const used = new Set(neighbours.map((n) => coloring[n]).filter(Boolean));
  return colors.filter((c) => !used.has(c));
}

export function neighboursOf(map, regionId) {
  return map.edges.filter(([a, b]) => a === regionId || b === regionId).map(([a, b]) => (a === regionId ? b : a));
}

export function isMapSolved(map, coloring) {
  return map.regions.every((r) => coloring[r.id]) && findConflicts(map, coloring).length === 0;
}
