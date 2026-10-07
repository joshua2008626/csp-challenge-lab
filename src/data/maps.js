import { makeRng } from '../algorithms/cspUtils.js';

/**
 * Procedurally generated fictional maps (no copyrighted assets).
 *
 * Each map is a Voronoi diagram of seeded random sites. Because adjacency is derived
 * from the actual geometry (two regions are neighbours when they share a border of
 * real length), what you SEE is exactly what the CSP constraints say — a region
 * touching another only at a single corner is NOT a neighbour.
 */

export const MAP_W = 600;
export const MAP_H = 400;

const NAMES = [
  'Aldoria', 'Brevan', 'Caldris', 'Dunmar', 'Eskara', 'Falken', 'Gorvia', 'Halden',
  'Ilmara', 'Jorsk', 'Kelvane', 'Lunari', 'Morvath', 'Norwick', 'Ostara', 'Pellor',
  'Quillan', 'Rhovia', 'Sylvane', 'Tarsis', 'Umbria', 'Valtor', 'Wyndham', 'Xeris',
  'Yarrow', 'Zephyra', 'Arkenia', 'Belmora',
];

/** Sutherland–Hodgman clip of a tagged polygon against the half-plane a*x + b*y <= c. */
function clip(poly, a, b, c, tag) {
  const out = [];
  const inside = (p) => a * p.x + b * p.y <= c + 1e-9;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const pin = inside(p);
    const qin = inside(q);
    const inter = () => {
      const dp = a * p.x + b * p.y - c;
      const dq = a * q.x + b * q.y - c;
      const t = dp / (dp - dq);
      return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
    };
    if (pin && qin) out.push(p);
    else if (pin && !qin) {
      out.push(p);
      out.push({ ...inter(), tag });
    } else if (!pin && qin) {
      out.push({ ...inter(), tag: p.tag });
    }
  }
  return out;
}

function polygonArea(poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    s += p.x * q.y - q.x * p.y;
  }
  return s / 2;
}

function centroid(poly) {
  let cx = 0;
  let cy = 0;
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const f = p.x * q.y - q.x * p.y;
    a += f;
    cx += (p.x + q.x) * f;
    cy += (p.y + q.y) * f;
  }
  a /= 2;
  return { x: cx / (6 * a), y: cy / (6 * a) };
}

export function generateMap({ id, name, seed, count, colorLimit = 4 }) {
  const rng = makeRng(seed);
  // jittered grid → fairly even regions
  const cols = Math.ceil(Math.sqrt((count * MAP_W) / MAP_H));
  const rows = Math.ceil(count / cols);
  const cw = MAP_W / cols;
  const ch = MAP_H / rows;
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ r, c });
  // choose `count` of the cells
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  const sites = cells.slice(0, count).map(({ r, c }) => ({
    x: (c + 0.2 + rng() * 0.6) * cw,
    y: (r + 0.2 + rng() * 0.6) * ch,
  }));

  const names = [...NAMES];
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }

  const regions = sites.map((s, i) => {
    let poly = [
      { x: 0, y: 0, tag: 'box' },
      { x: MAP_W, y: 0, tag: 'box' },
      { x: MAP_W, y: MAP_H, tag: 'box' },
      { x: 0, y: MAP_H, tag: 'box' },
    ];
    sites.forEach((o, j) => {
      if (j === i) return;
      const a = o.x - s.x;
      const b = o.y - s.y;
      const c = (o.x * o.x + o.y * o.y - s.x * s.x - s.y * s.y) / 2;
      poly = clip(poly, a, b, c, j);
    });
    return { i, site: s, poly };
  });

  const edgeSet = new Map();
  regions.forEach((reg) => {
    for (let k = 0; k < reg.poly.length; k++) {
      const p = reg.poly[k];
      const q = reg.poly[(k + 1) % reg.poly.length];
      if (p.tag === 'box' || p.tag === undefined) continue;
      const len = Math.hypot(q.x - p.x, q.y - p.y);
      if (len < 9) continue;
      const key = reg.i < p.tag ? `${reg.i}-${p.tag}` : `${p.tag}-${reg.i}`;
      edgeSet.set(key, true);
    }
  });

  const rid = (i) => `R${i + 1}`;
  const outRegions = regions.map((reg) => {
    const cen = centroid(reg.poly);
    return {
      id: rid(reg.i),
      name: names[reg.i],
      path: reg.poly.map((p, k) => `${k === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z',
      cx: cen.x,
      cy: cen.y,
      area: Math.abs(polygonArea(reg.poly)),
    };
  });
  const edges = [...edgeSet.keys()].map((k) => {
    const [a, b] = k.split('-').map(Number);
    return [rid(a), rid(b)];
  });
  // Visual connection lines are drawn between region centres.
  return { id, name, seed, colorLimit, regions: outRegions, edges };
}

export const MAP_LEVELS = [
  { level: 1, tier: 'Beginner', title: 'Four Kingdoms', seed: 11, count: 4, colorLimit: 4, par: 90, blurb: 'Warm up: four regions, four colours.' },
  { level: 2, tier: 'Beginner', title: 'The Six Provinces', seed: 23, count: 6, colorLimit: 4, par: 120, blurb: 'A few more borders to keep track of.' },
  { level: 3, tier: 'Intermediate', title: 'Nine Duchies', seed: 31, count: 9, colorLimit: 4, par: 180, blurb: 'Decisions now ripple across the map.' },
  { level: 4, tier: 'Advanced', title: 'The Fractured Coast', seed: 8, count: 14, colorLimit: 3, par: 270, blurb: 'Only three colours now — greedy choices can trap you.' },
  { level: 5, tier: 'Expert', title: 'Challenge: The Grand Realm', seed: 61, count: 18, colorLimit: 3, par: 420, blurb: 'Eighteen regions, three colours. Backtracking becomes essential.' },
];

const cache = {};
export function getMap(level) {
  if (!cache[level]) {
    const def = MAP_LEVELS.find((l) => l.level === level);
    cache[level] = { ...generateMap({ id: `map-${level}`, name: def.title, seed: def.seed, count: def.count, colorLimit: def.colorLimit }), level, def };
  }
  return cache[level];
}
