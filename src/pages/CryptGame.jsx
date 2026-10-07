import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameHeader from '../components/GameHeader.jsx';
import CryptoBoard from '../components/CryptoBoard.jsx';
import ScorePanel from '../components/ScorePanel.jsx';
import HintSystem from '../components/HintSystem.jsx';
import ExplanationPanel from '../components/ExplanationPanel.jsx';
import AlgorithmVisualizer from '../components/AlgorithmVisualizer.jsx';
import SolverControls from '../components/SolverControls.jsx';
import CSPModelCard from '../components/CSPModelCard.jsx';
import CompleteModal from '../components/CompleteModal.jsx';
import Icon from '../components/Icon.jsx';
import { EVT, recordSearch } from '../algorithms/backtracking.js';
import { buildCryptCSP, columnAnalysis, columnCount, columnOrder, countCryptSolutions, cryptProblems, isCryptSolved, leadingLetters } from '../algorithms/cryptArithmetic.js';
import { CRYPT_PUZZLES, getPuzzle } from '../data/puzzles.js';
import { useProgress } from '../hooks/useProgress.jsx';
import { useSolverPlayer } from '../hooks/useSolverPlayer.js';
import { useTimer } from '../hooks/useTimer.js';
import { navigate } from '../hooks/useRoute.js';
import { computeScore, formatTime } from '../utils/scoring.js';
import { cryptHints, legalDigits } from '../utils/hints.js';
import { cryptEventMessage, cryptPlayMessage, mapStatus } from '../utils/explain.js';

const EMPTY = [];
const KEY_EVENTS = new Set([EVT.SELECT_VARIABLE, EVT.ASSIGN, EVT.CONFLICT, EVT.BACKTRACK, EVT.DEAD_END, EVT.SOLUTION_FOUND, EVT.FAILURE, EVT.PRUNE]);
const isKey = (e) => KEY_EVENTS.has(e.type);
const MODES = { play: { icon: 'gamepad', label: 'Play' }, ai: { icon: 'cpu', label: 'Watch AI solve' } };
const LEARNED = ['Variable assignment', 'All-different constraints', 'Carry constraints', 'Backtracking'];
const COL_NAMES = ['Units', 'Tens', 'Hundreds', 'Thousands', 'Ten-thousands', 'Hundred-thousands'];
const zero = { moves: 0, mistakes: 0, good: 0, conflictEvents: 0 };

const letterColumn = (puzzle, letter) => {
  let best = 99;
  [...puzzle.addends, puzzle.result].forEach((w) => { const i = w.lastIndexOf(letter); if (i !== -1) best = Math.min(best, w.length - 1 - i); });
  return best === 99 ? 0 : best;
};

function ColumnReasoning({ puzzle, asg, col }) {
  if (col === null || col === undefined) return null;
  const a = columnAnalysis(puzzle, asg)[col];
  const names = puzzle.addends.map((w) => w[w.length - 1 - col] || '0');
  const rn = puzzle.result[puzzle.result.length - 1 - col] || '0';
  return (
    <section className="card colreason" aria-label="Column reasoning" aria-live="polite">
      <h3 className="card-title"><Icon name="graph" /> {COL_NAMES[col] || `Column ${col + 1}`} column<span className="spacer" />{a && a.ready && <span className={`badge ${a.ok ? 'badge-good' : 'badge-bad'}`}>{a.ok ? 'Consistent' : 'Violated'}</span>}</h3>
      <div className="eq mono">{names.join(' + ')}{col > 0 ? ' + carry' : ''} = {rn} + 10 × carry</div>
      {a && a.ready ? (
        <div className="eq eq-num mono">{a.digits.join(' + ')}{col > 0 ? ` + ${a.carryIn}` : ''} = {a.sum} → ends in {a.sum % 10} {a.ok ? '=' : '≠'} {rn}({a.resultDigit}) · <b>carry {a.carryOut}</b></div>
      ) : (
        <p className="muted">Assign every letter in this column{col > 0 ? ' (and the columns to its right)' : ''} to see the arithmetic.</p>
      )}
    </section>
  );
}

function DomainTable({ puzzle, letters, e, csp }) {
  const used = new Set(Object.values(e.assignment));
  return (
    <table className="domain-table" aria-label="Variables and domains">
      <thead><tr><th>Var</th><th>Value</th><th>Domain</th></tr></thead>
      <tbody>
        {letters.map((l) => {
          const v = e.assignment[l];
          const dom = e.domains ? e.domains[l] : csp.domains[l].filter((d) => !used.has(d) || d === v);
          return (
            <tr key={l} className={e.variable === l ? 'dt-current' : ''}>
              <th scope="row">{l}</th>
              <td className="mono">{v === undefined ? '?' : v}</td>
              <td className="dt-dom">{v !== undefined ? <span className="muted">fixed</span> : dom.map((d) => <i key={d} className="dt-chip">{d}</i>)}{v === undefined && dom.length === 0 && '∅'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function CryptGame({ level }) {
  const puzzle = useMemo(() => getPuzzle(level), [level]);
  const letters = useMemo(() => columnOrder(puzzle), [puzzle]);
  const csp = useMemo(() => buildCryptCSP(puzzle), [puzzle]);
  const lead = useMemo(() => leadingLetters(puzzle), [puzzle]);
  const solution = useMemo(() => countCryptSolutions(puzzle, 1).solutions[0], [puzzle]);
  const { progress, recordCompletion, recordAiWatched } = useProgress();

  const [mode, setMode] = useState('play');
  const [asg, setAsg] = useState({});
  const [sel, setSel] = useState(letters[0]);
  const [focusCol, setFocusCol] = useState(null);
  const [stats, setStats] = useState(zero);
  const [hint, setHint] = useState({ used: 0, revealed: [] });
  const [msg, setMsg] = useState(null);
  const [log, setLog] = useState([]);
  const [done, setDone] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [fc, setFc] = useState(true);
  const timer = useTimer();
  const moveN = useRef(0);
  const logId = useRef(0);
  const watched = useRef(false);
  const pushLog = (tone, text) => setLog((l) => [...l.slice(-60), { id: ++logId.current, tone, text }]);

  const problems = useMemo(() => cryptProblems(puzzle, asg), [puzzle, asg]);
  const badLetters = useMemo(() => new Set(problems.flatMap((p) => p.letters)), [problems]);
  const usedBy = useMemo(() => { const m = {}; Object.entries(asg).forEach(([l, d]) => (m[d] = [...(m[d] || []), l])); return m; }, [asg]);

  const nextLetter = (from, a) => {
    const i = letters.indexOf(from);
    for (let k = 1; k <= letters.length; k++) { const l = letters[(i + k) % letters.length]; if (a[l] === undefined) return l; }
    return from;
  };

  const assign = useCallback((digit) => {
    if (done || mode !== 'play' || !sel) return;
    timer.start();
    if (asg[sel] === digit) return;
    const next = { ...asg, [sel]: digit };
    const probs = cryptProblems(puzzle, next);
    const bad = probs.some((p) => p.letters.includes(sel));
    const s = { moves: stats.moves + 1, mistakes: stats.mistakes + (bad ? 1 : 0), good: stats.good + (bad ? 0 : 1), conflictEvents: stats.conflictEvents + (bad ? 1 : 0) };
    setStats(s);
    setAsg(next);
    setFocusCol(null);
    setHint((h) => ({ ...h, revealed: [] }));
    setMsg(cryptPlayMessage(puzzle, { type: 'assign', letter: sel, digit, n: ++moveN.current }, probs, next));
    pushLog(bad ? 'bad' : 'good', `${sel} = ${digit}${bad ? ' (problem)' : ''}`);
    if (isCryptSolved(puzzle, next)) {
      const seconds = timer.read();
      timer.stop();
      const sc = computeScore({ level, seconds, par: puzzle.par, mistakes: s.mistakes, hints: hint.used, goodMoves: s.good });
      const result = { challenge: 'crypt', level, score: sc.score, accuracy: sc.accuracy, seconds: Math.round(seconds), hints: hint.used, mistakes: s.mistakes, conflicts: s.conflictEvents, par: puzzle.par, xp: sc.xp };
      setDone({ result, outcome: recordCompletion(result) });
      setShowModal(true);
      setMsg(cryptPlayMessage(puzzle, { type: 'solved', n: ++moveN.current }, [], next));
    } else if (!bad) setSel(nextLetter(sel, next));
  }, [done, mode, sel, asg, stats, puzzle, level, hint.used, timer, recordCompletion]);

  const clearLetter = useCallback(() => {
    if (done || mode !== 'play' || !sel || asg[sel] === undefined) return;
    const next = { ...asg };
    delete next[sel];
    setAsg(next);
    setHint((h) => ({ ...h, revealed: [] }));
    setMsg(cryptPlayMessage(puzzle, { type: 'clear', letter: sel, n: ++moveN.current }, [], next));
    pushLog('info', `${sel} cleared`);
  }, [done, mode, sel, asg, puzzle]);

  const reset = useCallback(() => {
    setAsg({}); setSel(letters[0]); setFocusCol(null); setStats(zero); setHint({ used: 0, revealed: [] }); setMsg(null); setLog([]); setDone(null); setShowModal(false); timer.reset();
  }, [timer, letters]);

  const requestHint = () => {
    if (done || hint.revealed.length >= 3) return;
    const list = cryptHints(puzzle, csp, asg, solution);
    if (!list.length) return;
    const h = list[Math.min(hint.revealed.length, list.length - 1)];
    setHint((s) => ({ used: s.used + 1, revealed: [...s.revealed, h] }));
    if (h.letter) setSel(h.letter);
    timer.start();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (mode !== 'play' || showModal || e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(e.target.tagName) && e.key === ' ') return;
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
      if (/^[0-9]$/.test(e.key)) { assign(Number(e.key)); e.preventDefault(); }
      else if (e.key === 'Backspace' || e.key === 'Delete') clearLetter();
      else if (/^[a-zA-Z]$/.test(e.key) && letters.includes(e.key.toUpperCase())) setSel(e.key.toUpperCase());
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const i = letters.indexOf(sel); setSel(letters[(i + (e.key === 'ArrowRight' ? 1 : letters.length - 1)) % letters.length]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, showModal, assign, clearLetter, letters, sel]);

  /* ---------- AI ---------- */
  const rec = useMemo(() => (mode === 'ai' ? recordSearch(csp, { order: 'static', forwardChecking: fc, maxEvents: 150000 }) : null), [mode, csp, fc]);
  const player = useSolverPlayer({ events: rec ? rec.events : EMPTY, isKey, defaultDetail: 'key', autoPlay: mode === 'ai' });
  const e = mode === 'ai' ? player.current : null;

  useEffect(() => {
    if (mode === 'ai' && e && e.type === EVT.SOLUTION_FOUND && player.atEnd && !watched.current) { watched.current = true; recordAiWatched('crypt'); }
  }, [mode, e, player.atEnd, recordAiWatched]);

  const ai = useMemo(() => {
    if (!e) return null;
    let a = e.assignment; let tentative = null;
    if ((e.type === EVT.TRY_VALUE || e.type === EVT.CHECK_CONSTRAINT || e.type === EVT.CONFLICT) && e.variable) {
      a = { ...e.assignment }; delete a[e.variable];
      tentative = { letter: e.variable, digit: e.value };
    }
    const col = e.constraint && e.constraint.kind === 'COLUMN' ? e.constraint.column : e.variable ? letterColumn(puzzle, e.variable) : null;
    const bad = new Set(e.type === EVT.CONFLICT && e.constraint ? e.constraint.scope.filter((l) => e.assignment[l] !== undefined || l === e.variable) : []);
    return { a, tentative, col, bad };
  }, [e, puzzle]);
  const aiMsg = e ? cryptEventMessage(puzzle, e) : null;
  const [statusText, statusTone] = mapStatus(e);
  const carries = e ? columnAnalysis(puzzle, e.assignment).map((c) => (c.carryOut === null ? '·' : c.carryOut)).join(' ') : '';

  /* ---------- derived ---------- */
  const playCol = focusCol !== null ? focusCol : sel ? letterColumn(puzzle, sel) : null;
  const live = computeScore({ level, seconds: timer.seconds, par: puzzle.par, mistakes: stats.mistakes, hints: hint.used, goodMoves: stats.good });
  const analysis = useMemo(() => columnAnalysis(puzzle, asg), [puzzle, asg]);
  const completed = Object.fromEntries(CRYPT_PUZZLES.map((p) => [p.level, !!progress.best[`crypt-${p.level}`]]));
  const best = progress.best[`crypt-${level}`];
  const lastHint = hint.revealed[hint.revealed.length - 1];
  const assignedCount = Object.keys(asg).length;
  const switchMode = (m) => { if (m === mode) return; if (m === 'ai') timer.stop(); setMode(m); };
  const legal = useMemo(() => (sel ? legalDigits(csp, asg, sel) : []), [csp, asg, sel]);

  return (
    <div className="page game-page">
      <GameHeader icon="hash" title="Crypt-Arithmetic" tagline={`${puzzle.title} · ${puzzle.blurb}`} tier={puzzle.tier} level={level} levels={CRYPT_PUZZLES}
        onLevel={(l) => navigate(`/play/crypt/${l}`)} completed={completed} mode={mode} onMode={switchMode} modeLabels={MODES} />
      <div className="game-layout">
        <div className="game-main">
          <section className="card board-card" aria-label="Puzzle">
            <div className="board-top">
              <div className="row">
                <span className="badge"><Icon name="layers" size={12} /> {letters.length} letters · {columnCount(puzzle)} columns</span>
                {best && <span className="badge badge-good"><Icon name="trophy" size={12} /> Best {best.score}</span>}
              </div>
              <span className="muted rules-note">Different letters → different digits · leading letters ≠ 0</span>
            </div>
            {mode === 'play' ? (
              <CryptoBoard puzzle={puzzle} assignment={asg} activeCol={playCol} selected={sel} badLetters={badLetters} onSelect={(l) => { setSel(l); setFocusCol(null); }} interactive={!done} />
            ) : ai ? (
              <CryptoBoard puzzle={puzzle} assignment={ai.a} activeCol={ai.col} tentative={ai.tentative} badLetters={ai.bad} interactive={false} />
            ) : null}

            {mode === 'play' && (
              <>
                <div className="col-steps" role="group" aria-label="Focus a column">
                  {analysis.map((c) => (
                    <button key={c.index} type="button" className={`col-step ${playCol === c.index ? 'on' : ''}`} onClick={() => setFocusCol(c.index)} aria-pressed={playCol === c.index}>
                      {c.ready ? (c.ok ? <Icon name="check" size={12} strokeWidth={3} /> : <Icon name="x" size={12} strokeWidth={3} />) : <span aria-hidden="true">{c.index + 1}</span>}
                      {COL_NAMES[c.index] || `Col ${c.index + 1}`}
                    </button>
                  ))}
                </div>
                <div className="vars" role="group" aria-label="Variables">
                  {letters.map((l) => (
                    <button key={l} type="button" disabled={!!done} className={`var-tile ${sel === l ? 'on' : ''} ${badLetters.has(l) ? 'bad' : ''} ${asg[l] !== undefined ? 'set' : ''}`} onClick={() => { setSel(l); setFocusCol(null); }} aria-pressed={sel === l}>
                      <b>{l}</b> = [{asg[l] === undefined ? '?' : asg[l]}]
                      {lead.has(l) && <small title="Leading letter: cannot be 0">≠0</small>}
                    </button>
                  ))}
                </div>
                <div className="keypad" role="group" aria-label={`Digit keypad for ${sel}`}>
                  {Array.from({ length: 10 }, (_, d) => {
                    const owners = (usedBy[d] || []).filter((l) => l !== sel);
                    const blocked = d === 0 && lead.has(sel);
                    return (
                      <button key={d} type="button" className={`key ${asg[sel] === d ? 'on' : ''} ${owners.length || blocked ? 'used' : ''}`} disabled={!!done} onClick={() => assign(d)}
                        aria-label={`${d}${owners.length ? `, already used by ${owners.join(' and ')}` : ''}${blocked ? ', not allowed for a leading letter' : ''}`}>
                        {d}{owners.length > 0 && <small>{owners.join('')}</small>}
                        {blocked && <small>≠0</small>}
                      </button>
                    );
                  })}
                  <button type="button" className="key key-clear" disabled={!!done || !sel || asg[sel] === undefined} onClick={clearLetter} aria-label={`Clear ${sel}`}><Icon name="undo" size={16} /></button>
                </div>
                <p className="muted tool-note">Letter <b>{sel}</b> can legally be: {legal.length ? legal.join(', ') : 'nothing (a clash)'}. Type a digit on the keyboard to assign it.</p>
              </>
            )}

            {mode === 'play' && problems.length > 0 && (
              <div className="callout callout-bad" role="alert"><Icon name="alert" /><span>{problems[0].message}{problems.length > 1 ? ` (+${problems.length - 1} more)` : ''}</span></div>
            )}
            {mode === 'play' && done && !showModal && (
              <div className="callout callout-good"><Icon name="check-circle" /><span>Solved with score <b>{done.result.score}</b>. <button type="button" className="linklike" onClick={() => setShowModal(true)}>View summary</button> · <button type="button" className="linklike" onClick={reset}>Play again</button></span></div>
            )}
          </section>

          {mode === 'play' ? (
            <>
              <ColumnReasoning puzzle={puzzle} asg={asg} col={playCol} />
              <ScorePanel items={[
                { key: 'moves', label: 'Moves', icon: 'hash', value: stats.moves },
                { key: 'mist', label: 'Mistakes', icon: 'x-circle', value: stats.mistakes, tone: stats.mistakes ? 'bad' : '' },
                { key: 'set', label: 'Letters set', icon: 'check-circle', value: `${assignedCount}/${letters.length}` },
                { key: 'time', label: 'Time', icon: 'clock', value: formatTime(done ? done.result.seconds : timer.seconds) },
                { key: 'hint', label: 'Hints', icon: 'bulb', value: hint.used },
                { key: 'score', label: 'Score', icon: 'star', value: done ? done.result.score : live.score, tone: 'good' },
              ]} />
              <div className="row actions">
                <button type="button" className="btn" onClick={reset}><Icon name="rotate" /> Reset puzzle</button>
                <button type="button" className="btn btn-ghost" onClick={() => switchMode('ai')}><Icon name="cpu" /> Watch AI solve</button>
              </div>
            </>
          ) : (
            <>
              <SolverControls player={player}>
                <div className="row solver-opts"><label className="check"><input type="checkbox" checked={fc} onChange={(ev) => setFc(ev.target.checked)} /> Forward checking (prune domains after each assignment)</label></div>
              </SolverControls>
              {ai && <ColumnReasoning puzzle={puzzle} asg={ai.a} col={ai.col} />}
              <div className="row actions"><button type="button" className="btn" onClick={() => switchMode('play')}><Icon name="gamepad" /> Back to playing</button></div>
            </>
          )}
        </div>

        <div className="game-side">
          {mode === 'play' ? (
            <ExplanationPanel title="Explanation" message={msg} log={log} empty={{ title: 'Pick a letter, then a digit', body: 'Each letter is a variable with the domain 0–9. Constraints are checked as you play and explained here.' }} />
          ) : (
            <>
              <AlgorithmVisualizer algorithm={fc ? 'BACKTRACKING + FC' : 'BACKTRACKING SEARCH'} step={player.index} total={player.total} status={statusText} tone={statusTone}
                metrics={e ? [
                  { label: 'Current variable', value: e.variable || '—' },
                  { label: 'Current value', value: e.value !== undefined ? e.value : '—' },
                  { label: 'Assigned', value: `${Object.keys(e.assignment).length}/${letters.length}` },
                  { label: 'Search depth', value: e.stats.depth },
                  { label: 'Backtracks', value: e.stats.backtracks, tone: e.stats.backtracks ? 'warn' : '' },
                  { label: 'Constraint checks', value: e.stats.checks },
                  { label: 'Carries (units →)', value: carries },
                ] : []}
                extra={e ? <DomainTable puzzle={puzzle} letters={letters} e={e} csp={csp} /> : null} />
              <ExplanationPanel title="Why?" message={aiMsg} empty={{ title: 'Press play', body: 'The solver explains each step as it runs.' }} />
              {e && e.type === EVT.SOLUTION_FOUND && <div className="callout callout-good"><Icon name="check-circle" /><span>Real solution found after {e.stats.backtracks} backtracks and {e.stats.checks} checks: {puzzle.addends.map((w) => [...w].map((c) => e.assignment[c]).join('')).join(' + ')} = {[...puzzle.result].map((c) => e.assignment[c]).join('')}.</span></div>}
            </>
          )}
          {mode === 'play' && <HintSystem revealed={hint.revealed.map((h) => h.text)} onRequest={requestHint} disabled={!!done} disabledReason={done ? 'Puzzle solved' : undefined} />}
          <CSPModelCard csp={csp} domainLabel="Digits 0–9 (leading letters 1–9)" constraintLabel="All letters differ · every column's carry works out · the sum is right."
            sampleConstraints={[csp.constraints[0]?.describe({}, true), ...csp.constraints.filter((c) => c.kind === 'COLUMN').slice(0, 2).map((c) => `Column ${c.column + 1}: low ${c.column + 1} digit(s) of the sum match`)].filter(Boolean)} />
        </div>
      </div>

      {showModal && done && (
        <CompleteModal title={`${puzzle.title} — Level ${level}`} result={done.result} outcome={done.outcome} learned={LEARNED}
          onAgain={reset} onClose={() => setShowModal(false)} onNext={() => navigate(level < 5 ? `/play/crypt/${level + 1}` : '/challenges')} nextLabel={level < 5 ? 'Next challenge' : 'All challenges'} />
      )}
    </div>
  );
}
