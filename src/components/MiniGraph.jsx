import { colorById } from '../algorithms/mapColoring.js';

/**
 * Small constraint-graph drawing used by the hero, the Learn demos and "How CSP works".
 * Nodes are variables, edges are ≠ constraints. All visual state comes from props.
 *
 *   assignment : { nodeId: colorId }
 *   domains    : { nodeId: colorId[] }  (optional, drawn as dots under the node)
 *   tentative  : { node, color }        (value being tried, drawn striped)
 *   conflicts  : [[a,b]]                (edges drawn red with ≠ ✗)
 */
export default function MiniGraph({
  nodes, edges, assignment = {}, domains = null, current = null, tentative = null,
  conflicts = [], backtrack = null, showEdges = true, showLabels = true, onNodeClick,
  width = 320, height = 200, label = 'Constraint graph', dim = false,
}) {
  const by = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const bad = new Set(conflicts.map(([a, b]) => `${a}-${b}`));
  return (
    <svg className={`minigraph ${dim ? 'minigraph-dim' : ''}`} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={label}>
      {showEdges && edges.map(([a, b]) => {
        const isBad = bad.has(`${a}-${b}`) || bad.has(`${b}-${a}`);
        const A = by[a], B = by[b];
        return (
          <g key={`${a}-${b}`}>
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} className={`mg-edge ${isBad ? 'mg-edge-bad' : ''}`} />
            {isBad && <text x={(A.x + B.x) / 2} y={(A.y + B.y) / 2} className="mg-edge-x" textAnchor="middle" dominantBaseline="central">≠ ✗</text>}
          </g>
        );
      })}
      {nodes.map((n) => {
        const col = assignment[n.id] ? colorById(assignment[n.id]) : null;
        const tent = tentative && tentative.node === n.id ? colorById(tentative.color) : null;
        const fill = tent ? tent.hex : col ? col.hex : 'var(--map-empty)';
        const dom = domains && !col ? domains[n.id] : null;
        const cls = ['mg-node', current === n.id ? 'mg-current' : '', backtrack === n.id ? 'mg-back' : '', tent ? 'mg-tent' : '', onNodeClick ? 'mg-live' : ''].filter(Boolean).join(' ');
        const activate = () => onNodeClick && onNodeClick(n.id);
        return (
          <g key={n.id} className={cls} role={onNodeClick ? 'button' : 'img'} tabIndex={onNodeClick ? 0 : -1}
            aria-label={`${n.label || n.id}: ${col ? col.name : 'no colour'}`}
            onClick={activate} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } }}>
            <circle cx={n.x} cy={n.y} r="19" fill={fill} className="mg-circle" />
            {(col || tent) && <text x={n.x} y={n.y + 1} className="mg-symbol" textAnchor="middle" dominantBaseline="central">{(tent || col).symbol}</text>}
            {showLabels && <text x={n.x} y={n.y - 27} className="mg-label" textAnchor="middle">{n.label || n.id}</text>}
            {dom && (
              <g transform={`translate(${n.x - ((dom.length - 1) * 11) / 2}, ${n.y + 31})`}>
                {dom.map((c, i) => <circle key={c} cx={i * 11} cy="0" r="4" fill={colorById(c).hex} stroke="rgba(0,0,0,.45)" strokeWidth=".8" />)}
                {dom.length === 0 && <text className="region-wipe" y="3" textAnchor="middle">∅</text>}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
