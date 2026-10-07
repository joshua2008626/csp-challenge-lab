import { buildMapCSP } from '../algorithms/mapColoring.js';
import { recordSearch } from '../algorithms/backtracking.js';

/**
 * A six-variable demo CSP used by the hero animation, "How CSP works" and the Learn demos.
 * The edge set was chosen (by search) so that plain backtracking in the given order makes
 * exactly one real backtrack — the animation shows genuine search, not a script.
 */
export const DEMO_COLORS = ['red', 'green', 'blue'];
export const DEMO_NODES = [
  { id: 'A', x: 45, y: 95 }, { id: 'D', x: 115, y: 42 }, { id: 'C', x: 115, y: 158 },
  { id: 'F', x: 195, y: 95 }, { id: 'B', x: 50, y: 172 }, { id: 'E', x: 280, y: 95 },
];
export const DEMO_EDGES = [['A', 'C'], ['A', 'D'], ['B', 'C'], ['C', 'D'], ['C', 'F'], ['D', 'F'], ['E', 'F']];
export const DEMO_MAP = {
  name: 'Demo',
  regions: ['A', 'B', 'C', 'D', 'E', 'F'].map((id) => ({ id, name: id })),
  edges: DEMO_EDGES,
};

let cache = null;
export function demoRun() {
  if (!cache) {
    const csp = buildMapCSP(DEMO_MAP, DEMO_COLORS);
    cache = { csp, plain: recordSearch(csp, { order: 'static' }), fc: recordSearch(csp, { order: 'static', forwardChecking: true }) };
  }
  return cache;
}

/** A small 4-node graph for the "assignment / consistency / solution" explorers. */
export const TRI_NODES = [{ id: 'A', x: 60, y: 100 }, { id: 'B', x: 150, y: 35 }, { id: 'C', x: 150, y: 165 }, { id: 'D', x: 255, y: 100 }];
export const TRI_EDGES = [['A', 'B'], ['A', 'C'], ['B', 'C'], ['C', 'D']];

/** A 2-colour chain for the propagation demo: choices cascade along the path. */
export const CHAIN_NODES = [30, 90, 150, 210, 270].map((x, i) => ({ id: 'ABCDE'[i], x: x + 5, y: i % 2 ? 130 : 70 }));
export const CHAIN_EDGES = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'E']];
