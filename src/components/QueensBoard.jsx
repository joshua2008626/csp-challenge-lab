import { useMemo } from 'react';
import { attackingPairs, conflictedColumns, conflictsAt } from '../algorithms/nQueens.js';

/**
 * N-Queens board. The queen in column c is variable Q_c, its row is the value.
 * Click any square to move that column's queen there.
 *
 *  showNumbers : every square shows "conflicts if this column's queen stood here"
 *  activeCol   : (Min-Conflicts) only that column's candidate squares are annotated
 *  chosenRow   : the minimum-conflict row picked by the algorithm
 */
export default function QueensBoard({
  n,
  queens,
  interactive = true,
  showNumbers = false,
  activeCol = null,
  chosenRow = null,
  tiedRows = [],
  fromRow = null,
  hint = null, // { col, row }
  onSquare,
}) {
  const pairs = useMemo(() => attackingPairs(queens), [queens]);
  const conflictedCols = useMemo(() => new Set(conflictedColumns(queens)), [queens]);

  const numbers = useMemo(() => {
    if (!showNumbers && activeCol === null) return null;
    const cols = activeCol !== null ? [activeCol] : Array.from({ length: n }, (_, c) => c);
    const map = {};
    cols.forEach((c) => {
      for (let r = 0; r < n; r++) map[`${c}-${r}`] = conflictsAt(queens, c, r);
    });
    return map;
  }, [showNumbers, activeCol, n, queens]);

  const cell = 100 / n;
  const size = Math.max(14, Math.min(34, 220 / n));

  return (
    <div className="queens-wrap" style={{ '--n': n, '--qsize': `${size}px` }}>
      <div className="queens-cols" aria-hidden="true">
        {Array.from({ length: n }, (_, c) => (
          <span key={c} className={conflictedCols.has(c) ? 'qcol qcol-bad' : 'qcol'}>
            Q{c + 1}
          </span>
        ))}
      </div>
      <div className="queens-board" role="grid" aria-label={`${n} by ${n} chessboard`}>
        {Array.from({ length: n * n }, (_, i) => {
          const row = Math.floor(i / n);
          const col = i % n;
          const dark = (row + col) % 2 === 1;
          const has = queens[col] === row;
          const num = numbers ? numbers[`${col}-${row}`] : undefined;
          const isChosen = activeCol === col && chosenRow === row;
          const isTied = activeCol === col && tiedRows.includes(row);
          const isFrom = activeCol === col && fromRow === row;
          const isHint = hint && hint.col === col && hint.row === row;
          const cls = [
            'qsq',
            dark ? 'qsq-dark' : 'qsq-light',
            interactive ? 'qsq-live' : '',
            activeCol === col ? 'qsq-activecol' : '',
            isChosen ? 'qsq-chosen' : '',
            isTied && !isChosen ? 'qsq-tied' : '',
            isFrom ? 'qsq-from' : '',
            isHint ? 'qsq-hint' : '',
            num === 0 ? 'qsq-zero' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={i}
              type="button"
              role="gridcell"
              className={cls}
              disabled={!interactive}
              onClick={() => onSquare && onSquare(col, row)}
              aria-label={`Column ${col + 1}, row ${row + 1}${has ? ', queen here' : ''}${num !== undefined ? `, ${num} conflicts if placed here` : ''}`}
              tabIndex={interactive ? 0 : -1}
            >
              {num !== undefined && <span className="qnum">{num}</span>}
            </button>
          );
        })}

        {/* attack lines */}
        <svg className="queens-lines" viewBox={`0 0 ${n} ${n}`} preserveAspectRatio="none" aria-hidden="true">
          {pairs.map(({ a, b, kind }) => (
            <line
              key={`${a}-${b}`}
              x1={a + 0.5}
              y1={queens[a] + 0.5}
              x2={b + 0.5}
              y2={queens[b] + 0.5}
              className={`attack-line attack-${kind}`}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* queens (absolutely positioned so they glide between rows) */}
        {queens.map((row, col) => {
          if (row === null || row === undefined) return null;
          const bad = conflictedCols.has(col);
          return (
            <div
              key={col}
              className={`queen ${bad ? 'queen-bad' : 'queen-ok'} ${activeCol === col ? 'queen-active' : ''}`}
              style={{ left: `${col * cell}%`, top: `${row * cell}%`, width: `${cell}%`, height: `${cell}%` }}
              aria-hidden="true"
            >
              <span className="queen-glyph">♛</span>
              {bad && <span className="queen-warn">!</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
