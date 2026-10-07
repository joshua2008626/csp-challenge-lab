import { MAP_H, MAP_W } from '../data/maps.js';
import { colorById } from '../algorithms/mapColoring.js';

/**
 * SVG map. Everything drawn comes from real state:
 *  - region fill        : the current assignment
 *  - red dashed outline : regions that violate a ≠ constraint (plus ⚠ icon and a link between the pair)
 *  - pulsing ring       : the solver's current variable
 *  - striped fill       : the value the solver is only *trying* (not yet committed)
 *  - dots under a name  : the region's remaining domain (colours still legal)
 */
export default function MapBoard({
  map,
  coloring,
  conflicts = [],
  selected = null,
  currentVar = null,
  tentative = null, // { region, color, bad }
  backtrackFrom = null,
  hintRegion = null,
  hintColor = null,
  domains = null, // { regionId: colorId[] }
  showGraph = false,
  interactive = true,
  onRegionClick,
}) {
  const conflictSet = new Set();
  conflicts.forEach(([a, b]) => {
    conflictSet.add(a);
    conflictSet.add(b);
  });
  const center = Object.fromEntries(map.regions.map((r) => [r.id, r]));

  const activate = (id) => interactive && onRegionClick && onRegionClick(id);

  return (
    <div className="map-wrap">
      <svg
        className="map-svg"
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        role="group"
        aria-label={`${map.name} map with ${map.regions.length} regions`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="stripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="transparent" />
            <rect width="4" height="8" fill="rgba(255,255,255,0.35)" />
          </pattern>
        </defs>

        {map.regions.map((r) => {
          const col = coloring[r.id] ? colorById(coloring[r.id]) : null;
          const isTent = tentative && tentative.region === r.id;
          const tentCol = isTent ? colorById(tentative.color) : null;
          const inConflict = conflictSet.has(r.id);
          const isSel = selected === r.id;
          const isCur = currentVar === r.id;
          const isBack = backtrackFrom === r.id;
          const isHint = hintRegion === r.id;
          const fill = isTent ? tentCol.hex : col ? col.hex : 'var(--map-empty)';
          const label = `${r.name}: ${col ? col.name : 'no colour'}${inConflict ? ', in conflict with a neighbour' : ''}`;
          const cls = [
            'region',
            interactive ? 'region-live' : '',
            inConflict ? 'region-conflict' : '',
            isSel ? 'region-selected' : '',
            isCur ? 'region-current' : '',
            isBack ? 'region-back' : '',
            isHint ? 'region-hint' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const dom = domains && !coloring[r.id] ? domains[r.id] : null;
          return (
            <g
              key={r.id}
              className={cls}
              role={interactive ? 'button' : 'img'}
              tabIndex={interactive ? 0 : -1}
              aria-label={label}
              onClick={() => activate(r.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  activate(r.id);
                }
              }}
            >
              <path d={r.path} className="region-shape" fill={fill} />
              {isTent && <path d={r.path} fill="url(#stripe)" className="region-tent" />}
              {isTent && tentative.bad && <path d={r.path} className="region-tent-bad" fill="none" />}
              {isHint && hintColor && <path d={r.path} fill={colorById(hintColor).hex} className="region-hintfill" />}
              {inConflict && <path d={r.path} className="region-conflict-outline" fill="none" />}
              <text x={r.cx} y={r.cy - (dom ? 4 : 0)} className="region-label" textAnchor="middle" dominantBaseline="middle">
                {r.name}
              </text>
              {(col || isTent) && (
                <text x={r.cx} y={r.cy + 15} className="region-symbol" textAnchor="middle" dominantBaseline="middle">
                  {(isTent ? tentCol : col).symbol}
                </text>
              )}
              {dom && (
                <g className="region-domain" transform={`translate(${r.cx - (dom.length * 11) / 2 + 5.5}, ${r.cy + 13})`}>
                  {dom.map((cid, i) => (
                    <circle key={cid} cx={i * 11} cy={0} r={4} fill={colorById(cid).hex} stroke="rgba(0,0,0,0.45)" strokeWidth="0.8" />
                  ))}
                  {dom.length === 0 && <text className="region-wipe" y="3" textAnchor="middle">∅</text>}
                </g>
              )}
              {inConflict && (
                <g className="region-warn" transform={`translate(${r.cx + 18}, ${r.cy - 20})`} aria-hidden="true">
                  <circle r="9" />
                  <text textAnchor="middle" dominantBaseline="central" y="0.5">!</text>
                </g>
              )}
              <title>{label}</title>
            </g>
          );
        })}

        {/* constraint graph overlay */}
        {showGraph && (
          <g className="graph-overlay" pointerEvents="none">
            {map.edges.map(([a, b]) => (
              <line key={`${a}-${b}`} x1={center[a].cx} y1={center[a].cy} x2={center[b].cx} y2={center[b].cy} className="graph-edge" />
            ))}
            {map.regions.map((r) => (
              <circle key={r.id} cx={r.cx} cy={r.cy} r="4.5" className="graph-node" />
            ))}
          </g>
        )}

        {/* visual connection between conflicting neighbours */}
        <g pointerEvents="none">
          {conflicts.map(([a, b]) => (
            <g key={`c-${a}-${b}`} className="conflict-link">
              <line x1={center[a].cx} y1={center[a].cy} x2={center[b].cx} y2={center[b].cy} />
              <text x={(center[a].cx + center[b].cx) / 2} y={(center[a].cy + center[b].cy) / 2} textAnchor="middle" dominantBaseline="central">
                ≠ ✗
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
