import { columnAnalysis, columnCount } from '../algorithms/cryptArithmetic.js';

/**
 * The addition, laid out column by column (units on the right) with a visible carry row.
 *   assignment : { letter: digit }
 *   activeCol  : column index (0 = units) to highlight
 *   tentative  : { letter, digit }  (value being tried by the solver)
 *   badLetters : Set of letters involved in a problem
 */
export default function CryptoBoard({ puzzle, assignment, activeCol = null, selected = null, tentative = null, badLetters = new Set(), onSelect, interactive = true }) {
  const W = columnCount(puzzle);
  const analysis = columnAnalysis(puzzle, tentative ? { ...assignment, [tentative.letter]: tentative.digit } : assignment);
  const cols = Array.from({ length: W }, (_, i) => W - 1 - i); // left → right, as column indexes

  const Cell = ({ ch, k }) => {
    if (!ch) return <div className="cb-cell cb-empty" />;
    const isTent = tentative && tentative.letter === ch;
    const d = isTent ? tentative.digit : assignment[ch];
    const cls = ['cb-cell', 'cb-letter', selected === ch ? 'cb-selected' : '', badLetters.has(ch) ? 'cb-bad' : '', isTent ? 'cb-tent' : '', d !== undefined ? 'cb-set' : '', activeCol === k ? 'cb-col' : ''].filter(Boolean).join(' ');
    return (
      <button type="button" className={cls} disabled={!interactive} onClick={() => onSelect && onSelect(ch)}
        aria-label={`Letter ${ch}: ${d === undefined ? 'no digit yet' : `digit ${d}`}${badLetters.has(ch) ? ', has a problem' : ''}`} aria-pressed={selected === ch}>
        <span className="cb-ch">{ch}</span>
        <span className="cb-dg">{d === undefined ? '?' : d}</span>
        {badLetters.has(ch) && <span className="cb-warn" aria-hidden="true">!</span>}
      </button>
    );
  };

  return (
    <div className="cb" style={{ '--w': W }} role="group" aria-label={`${puzzle.addends.join(' plus ')} equals ${puzzle.result}`}>
      <div className="cb-row cb-carry-row" aria-hidden="true">
        <div className="cb-cell cb-op" />
        {cols.map((k) => {
          const c = analysis[k];
          const carry = c && c.carryIn !== null && k > 0 ? c.carryIn : null;
          return <div key={k} className={`cb-cell cb-carry ${activeCol === k ? 'cb-col' : ''} ${carry ? 'cb-carry-on' : ''}`}>{k > 0 && carry !== null ? <><small>carry</small><b>{carry}</b></> : null}</div>;
        })}
      </div>
      {puzzle.addends.map((w, ai) => (
        <div className="cb-row" key={w + ai}>
          <div className="cb-cell cb-op">{ai === puzzle.addends.length - 1 ? '+' : ''}</div>
          {cols.map((k) => <Cell key={k} ch={w[w.length - 1 - k]} k={k} />)}
        </div>
      ))}
      <div className="cb-rule" />
      <div className="cb-row">
        <div className="cb-cell cb-op">=</div>
        {cols.map((k) => <Cell key={k} ch={puzzle.result[puzzle.result.length - 1 - k]} k={k} />)}
      </div>
    </div>
  );
}
