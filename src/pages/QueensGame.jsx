import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import GameHeader from '../components/GameHeader.jsx';
import QueensBoard from '../components/QueensBoard.jsx';
import ScorePanel from '../components/ScorePanel.jsx';
import HintSystem from '../components/HintSystem.jsx';
import ExplanationPanel from '../components/ExplanationPanel.jsx';
import AlgorithmVisualizer from '../components/AlgorithmVisualizer.jsx';
import SolverControls from '../components/SolverControls.jsx';
import CSPModelCard from '../components/CSPModelCard.jsx';
import CompleteModal from '../components/CompleteModal.jsx';
import ConflictChart from '../components/ConflictChart.jsx';
import SearchComparison from '../components/SearchComparison.jsx';
import Icon from '../components/Icon.jsx';
import { LS_EVT, recordMinConflicts } from '../algorithms/minConflicts.js';
import { attackingPairs, buildQueensCSP, countConflicts, isQueensSolved } from '../algorithms/nQueens.js';
import { QUEENS_LEVELS, getQueensLevel, startingBoard } from '../data/queensLevels.js';
import { useProgress } from '../hooks/useProgress.jsx';
import { useSolverPlayer } from '../hooks/useSolverPlayer.js';
import { useTimer } from '../hooks/useTimer.js';
import { navigate } from '../hooks/useRoute.js';
import { computeScore, formatTime } from '../utils/scoring.js';
import { queensHints } from '../utils/hints.js';
import { lsStatus, minConflictsMessage, queensPlayMessage } from '../utils/explain.js';

const EMPTY = [];
const isKey = (e) => e.type !== LS_EVT.PICK_VARIABLE;
const MODES = { play: { icon: 'gamepad', label: 'Play' }, ai: { icon: 'cpu', label: 'Watch Min-Conflicts' } };
const LEARNED = ['State representation', 'Heuristics', 'Conflict counting', 'Min-Conflicts', 'Local optimization'];
const zero = { moves: 0, mistakes: 0, good: 0 };

export default function QueensGame({ level }) {
  const def = getQueensLevel(level);
  const n = def.n;
  const csp = useMemo(() => buildQueensCSP(n), [n]);
  const { progress, recordCompletion, recordAiWatched } = useProgress();

  const [mode, setMode] = useState('play');
  const [shuffle, setShuffle] = useState(0);
  const start = useMemo(() => startingBoard(n, def.seed, shuffle), [n, def.seed, shuffle]);
  const [queens, setQueens] = useState(start);
  const [trace, setTrace] = useState([countConflicts(start)]);
  const [stats, setStats] = useState(zero);
  const [hint, setHint] = useState({ used: 0, revealed: [] });
  const [msg, setMsg] = useState(null);
  const [log, setLog] = useState([]);
  const [done, setDone] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showNumbers, setShowNumbers] = useState(level >= 4);
  const timer = useTimer();
  const moveN = useRef(0);
  const logId = useRef(0);
  const watched = useRef(false);
  const pushLog = (tone, text) => setLog((l) => [...l.slice(-60), { id: ++logId.current, tone, text }]);

  const resetTo = useCallback((board) => {
    setQueens(board); setTrace([countConflicts(board)]); setStats(zero); setHint({ used: 0, revealed: [] }); setMsg(null); setLog([]); setDone(null); setShowModal(false); timer.reset();
  }, [timer]);

  // a new board (shuffle) restarts the game on it
  const firstShuffle = useRef(true);
  useEffect(() => {
    if (firstShuffle.current) { firstShuffle.current = false; return; }
    resetTo(start);
  }, [start]); // eslint-disable-line react-hooks/exhaustive-deps

  const conflicts = countConflicts(queens);
  const pairs = useMemo(() => attackingPairs(queens), [queens]);

  const onSquare = (col, row) => {
    if (done || mode !== 'play' || queens[col] === row) return;
    timer.start();
    const before = conflicts;
    const next = [...queens];
    next[col] = row;
    const after = countConflicts(next);
    const worse = after > before;
    const s = { moves: stats.moves + 1, mistakes: stats.mistakes + (worse ? 1 : 0), good: stats.good + (worse ? 0 : 1) };
    setStats(s);
    setQueens(next);
    setTrace((t) => [...t, after]);
    setHint((h) => ({ ...h, revealed: [] }));
    setMsg(queensPlayMessage({ type: 'move', col, row, before, after, n: ++moveN.current }));
    pushLog(worse ? 'bad' : after < before ? 'good' : 'info', `Q${col + 1} → row ${row + 1}: ${before} → ${after}`);
    if (isQueensSolved(next)) {
      const seconds = timer.read();
      timer.stop();
      const sc = computeScore({ level, seconds, par: def.par, mistakes: s.mistakes, hints: hint.used, goodMoves: s.good });
      const result = { challenge: 'queens', level, score: sc.score, accuracy: sc.accuracy, seconds: Math.round(seconds), hints: hint.used, mistakes: s.mistakes, conflicts: s.mistakes, par: def.par, xp: sc.xp };
      setDone({ result, outcome: recordCompletion(result) });
      setShowModal(true);
      setMsg(queensPlayMessage({ type: 'solved', n: ++moveN.current }));
    }
  };

  const requestHint = () => {
    if (done || hint.revealed.length >= 3) return;
    const list = queensHints(queens);
    if (!list.length) return;
    const h = list[Math.min(hint.revealed.length, list.length - 1)];
    setHint((s) => ({ used: s.used + 1, revealed: [...s.revealed, h] }));
    timer.start();
  };

  /* ---------- Min-Conflicts (real run from the same starting board) ---------- */
  const rec = useMemo(() => recordMinConflicts(start, { seed: 7 + shuffle, maxIterations: 300, stallLimit: 40 }), [start, shuffle]);
  const player = useSolverPlayer({ events: mode === 'ai' ? rec.events : EMPTY, isKey, defaultDetail: 'full', autoPlay: mode === 'ai' });
  const e = mode === 'ai' ? player.current : null;
  const finalEvt = rec.events[rec.events.length - 1];
  const lsStats = { iterations: finalEvt.iteration, moves: finalEvt.moves, restarts: finalEvt.restarts };

  useEffect(() => {
    if (mode === 'ai' && e && e.type === LS_EVT.SOLUTION_FOUND && player.atEnd && !watched.current) { watched.current = true; recordAiWatched('queens'); }
  }, [mode, e, player.atEnd, recordAiWatched]);

  const cand = e && (e.type === LS_EVT.EVALUATE ? e : e.type === LS_EVT.MOVE && player.previous && player.previous.type === LS_EVT.EVALUATE ? player.previous : null);
  const aiMsg = e ? minConflictsMessage(e) : null;
  const [statusText, statusTone] = lsStatus(e);

  /* ---------- derived ---------- */
  const live = computeScore({ level, seconds: timer.seconds, par: def.par, mistakes: stats.mistakes, hints: hint.used, goodMoves: stats.good });
  const completed = Object.fromEntries(QUEENS_LEVELS.map((l) => [l.level, !!progress.best[`queens-${l.level}`]]));
  const best = progress.best[`queens-${level}`];
  const lastHint = hint.revealed[hint.revealed.length - 1];
  const hintCell = lastHint && lastHint.col !== undefined && lastHint.row !== undefined ? { col: lastHint.col, row: lastHint.row } : null;
  const switchMode = (m) => { if (m === mode) return; if (m === 'ai') timer.stop(); setMode(m); };
  const qLabel = (v) => `Q${Number(v.slice(1)) + 1}`;

  return (
    <div className="page game-page">
      <GameHeader icon="crown" title="Local Search" tagline={`${def.title} · ${def.blurb}`} tier={def.tier} level={level} levels={QUEENS_LEVELS}
        onLevel={(l) => navigate(`/play/queens/${l}`)} completed={completed} mode={mode} onMode={switchMode} modeLabels={MODES} />
      <div className="game-layout">
        <div className="game-main">
          <section className="card board-card" aria-label="Chessboard">
            <div className="board-top">
              <div className="row">
                <span className="badge"><Icon name="layers" size={12} /> {n} queens · {csp.constraints.length} constraints</span>
                <span className={`badge ${(mode === 'ai' && e ? e.conflicts : conflicts) === 0 ? 'badge-good' : 'badge-bad'}`}><Icon name="swords" size={12} /> {mode === 'ai' && e ? e.conflicts : conflicts} attacking pair{(mode === 'ai' && e ? e.conflicts : conflicts) === 1 ? '' : 's'}</span>
                {best && <span className="badge badge-good"><Icon name="trophy" size={12} /> Best {best.score}</span>}
              </div>
              {mode === 'play' && <label className="check"><input type="checkbox" checked={showNumbers} onChange={(ev) => setShowNumbers(ev.target.checked)} /> Show conflict numbers</label>}
            </div>
            {mode === 'play' ? (
              <QueensBoard n={n} queens={queens} interactive={!done} showNumbers={showNumbers} hint={hintCell} onSquare={onSquare} />
            ) : e ? (
              <QueensBoard n={n} queens={e.queens} interactive={false}
                activeCol={e.column !== undefined ? e.column : null}
                chosenRow={e.type === LS_EVT.EVALUATE ? e.chosenRow : e.type === LS_EVT.MOVE ? e.toRow : null}
                tiedRows={e.type === LS_EVT.EVALUATE ? e.tiedRows : []}
                fromRow={e.type === LS_EVT.EVALUATE ? e.fromRow : null} />
            ) : null}
            {mode === 'play' && pairs.length > 0 && pairs.length <= 8 && (
              <div className="callout callout-bad"><Icon name="alert" /><span><b>Attacking:</b> {pairs.map((p) => `Q${p.a + 1}↔Q${p.b + 1} (${p.kind})`).join(', ')}</span></div>
            )}
            {mode === 'play' && pairs.length > 8 && <div className="callout callout-bad"><Icon name="alert" /><span><b>{pairs.length}</b> attacking pairs. Click a square to move that column's queen there.</span></div>}
            {mode === 'play' && done && !showModal && (
              <div className="callout callout-good"><Icon name="check-circle" /><span>Zero conflicts, score <b>{done.result.score}</b>. <button type="button" className="linklike" onClick={() => setShowModal(true)}>View summary</button></span></div>
            )}
          </section>

          {mode === 'play' ? (
            <>
              <ScorePanel items={[
                { key: 'moves', label: 'Moves', icon: 'hash', value: stats.moves },
                { key: 'mist', label: 'Worse moves', icon: 'x-circle', value: stats.mistakes, tone: stats.mistakes ? 'bad' : '' },
                { key: 'conf', label: 'Conflicts', icon: 'alert', value: conflicts, tone: conflicts ? 'bad' : 'good' },
                { key: 'time', label: 'Time', icon: 'clock', value: formatTime(done ? done.result.seconds : timer.seconds) },
                { key: 'hint', label: 'Hints', icon: 'bulb', value: hint.used },
                { key: 'score', label: 'Score', icon: 'star', value: done ? done.result.score : live.score, tone: 'good' },
              ]} />
              <section className="card"><ConflictChart history={trace.length > 1 ? trace : [trace[0], trace[0]]} upTo={trace.length - 1} title="Your conflicts vs move" /></section>
              <div className="row actions">
                <button type="button" className="btn" onClick={() => resetTo(start)}><Icon name="rotate" /> Reset board</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShuffle((s) => s + 1)}><Icon name="shuffle" /> New random board</button>
                <button type="button" className="btn btn-ghost" onClick={() => switchMode('ai')}><Icon name="cpu" /> Watch Min-Conflicts</button>
              </div>
            </>
          ) : (
            <>
              <SolverControls player={player} />
              {e && <section className="card"><ConflictChart history={finalEvt.history} upTo={e.history.length - 1} /></section>}
              <div className="row actions">
                <button type="button" className="btn" onClick={() => switchMode('play')}><Icon name="gamepad" /> Back to playing</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShuffle((s) => s + 1)}><Icon name="shuffle" /> Try another random start</button>
              </div>
            </>
          )}
          <SearchComparison n={n} start={start} lsStats={lsStats} />
        </div>

        <div className="game-side">
          {mode === 'play' ? (
            <ExplanationPanel title="Explanation" message={msg} log={log} empty={{ title: 'Move a queen', body: 'The board is a complete state. Click a square to move that column\'s queen, and aim for 0 attacking pairs.' }} />
          ) : (
            <>
              <AlgorithmVisualizer algorithm="MIN-CONFLICTS" step={player.index} total={player.total} status={statusText} tone={statusTone}
                metrics={e ? [
                  { label: 'Iteration', value: e.iteration },
                  { label: 'Current conflicts', value: e.conflicts, tone: e.conflicts ? 'warn' : 'good' },
                  { label: 'Selected variable', value: e.column !== undefined ? `Q${e.column + 1}` : '—' },
                  { label: 'Queen moves', value: e.moves },
                  { label: 'Restarts', value: e.restarts, tone: e.restarts ? 'warn' : '' },
                  { label: 'Best so far', value: Math.min(...e.history) },
                ] : []}
                extra={cand ? (
                  <div className="cands" aria-label="Candidate positions">
                    <div className="cands-title">Candidate positions for Q{cand.column + 1}</div>
                    <ul>
                      {cand.candidates.map((c) => (
                        <li key={c.row} className={`${c.row === cand.chosenRow ? 'chosen' : ''} ${c.row === cand.fromRow ? 'from' : ''}`}>
                          <span>Row {c.row + 1}</span><span className="cands-bar"><i style={{ width: `${Math.min(100, (c.conflicts / Math.max(1, n - 1)) * 100)}%` }} /></span><b>{c.conflicts} conflict{c.conflicts === 1 ? '' : 's'}</b>
                          {c.row === cand.chosenRow && <em>selected</em>}{c.row === cand.fromRow && c.row !== cand.chosenRow && <em>current</em>}
                        </li>
                      ))}
                    </ul>
                    <p className="muted">Reason: minimum conflicts = {cand.min}</p>
                  </div>
                ) : null} />
              <ExplanationPanel title="Why?" message={aiMsg} empty={{ title: 'Press play', body: 'Min-Conflicts explains each decision as it runs.' }} />
              {e && e.type === LS_EVT.SOLUTION_FOUND && <div className="callout callout-good"><Icon name="check-circle" /><span>Min-Conflicts reached 0 conflicts in {e.iteration} iterations ({e.moves} moves).</span></div>}
            </>
          )}
          {mode === 'play' && <HintSystem revealed={hint.revealed.map((h) => h.text)} onRequest={requestHint} disabled={!!done} disabledReason={done ? 'Board solved' : undefined} />}
          <CSPModelCard csp={csp} variableLabel={qLabel} domainLabel={`Rows 1–${n} (the row of the queen in that column)`} constraintLabel="No two queens share a row or a diagonal (columns are fixed by the variables)."
            sampleConstraints={['Q1 ≠ Q2 (row)', '|Q1 − Q2| ≠ 1 (diagonal)', '|Q1 − Q3| ≠ 2 (diagonal)']} />
        </div>
      </div>

      {showModal && done && (
        <CompleteModal title={`${def.title} — Level ${level}`} result={done.result} outcome={done.outcome} learned={LEARNED}
          onAgain={() => resetTo(start)} onClose={() => setShowModal(false)} onNext={() => navigate(level < 5 ? `/play/queens/${level + 1}` : '/challenges')} nextLabel={level < 5 ? 'Next challenge' : 'All challenges'} />
      )}
    </div>
  );
}
