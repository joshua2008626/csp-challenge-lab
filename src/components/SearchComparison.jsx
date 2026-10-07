import { useMemo } from 'react';
import QueensBoard from './QueensBoard.jsx';
import { solveQueensBacktracking, countConflicts } from '../algorithms/nQueens.js';
import Icon from './Icon.jsx';

/**
 * Backtracking vs Local Search, side by side. The boards show what each method works with
 * (a PARTIAL assignment that grows vs a COMPLETE assignment that is repaired) and the numbers
 * are measured by really running both algorithms on this board size.
 */
export default function SearchComparison({ n, start, lsStats }) {
  const bt = useMemo(() => solveQueensBacktracking(n), [n]);
  const partial = useMemo(() => (bt.queens ? bt.queens.map((r, i) => (i < Math.ceil(n / 2) ? r : null)) : Array(n).fill(null)), [bt, n]);
  return (
    <section className="card compare" aria-label="Backtracking versus local search">
      <h3 className="card-title"><Icon name="swords" /> Backtracking vs Local Search</h3>
      <div className="compare-grid">
        <div className="compare-col">
          <div className="compare-name">Backtracking</div>
          <div className="compare-board"><QueensBoard n={n} queens={partial} interactive={false} /></div>
          <p><b>Builds</b> a solution queen by queen from an empty board. Partial states are always consistent; dead ends are undone.</p>
          <dl className="compare-stats">
            <div><dt>Queens placed</dt><dd>{bt.assignments}</dd></div>
            <div><dt>Backtracks</dt><dd>{bt.backtracks}</dd></div>
            <div><dt>Checks</dt><dd>{bt.checks}</dd></div>
          </dl>
          <span className="badge badge-good">Complete · guarantees an answer</span>
        </div>
        <div className="compare-col">
          <div className="compare-name">Local search (Min-Conflicts)</div>
          <div className="compare-board"><QueensBoard n={n} queens={start} interactive={false} /></div>
          <p><b>Repairs</b> a full board that starts wrong ({countConflicts(start)} conflicts). Each step moves one queen to reduce conflicts.</p>
          <dl className="compare-stats">
            <div><dt>Iterations</dt><dd>{lsStats ? lsStats.iterations : '–'}</dd></div>
            <div><dt>Queen moves</dt><dd>{lsStats ? lsStats.moves : '–'}</dd></div>
            <div><dt>Restarts</dt><dd>{lsStats ? lsStats.restarts : '–'}</dd></div>
          </dl>
          <span className="badge badge-warn">Incomplete · very fast on big boards</span>
        </div>
      </div>
    </section>
  );
}
