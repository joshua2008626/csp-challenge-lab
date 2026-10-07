import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameHeader from '../components/GameHeader.jsx';
import MapBoard from '../components/MapBoard.jsx';
import ColorPicker from '../components/ColorPicker.jsx';
import ScorePanel from '../components/ScorePanel.jsx';
import HintSystem from '../components/HintSystem.jsx';
import ExplanationPanel from '../components/ExplanationPanel.jsx';
import AlgorithmVisualizer from '../components/AlgorithmVisualizer.jsx';
import SolverControls from '../components/SolverControls.jsx';
import CSPModelCard from '../components/CSPModelCard.jsx';
import CompleteModal from '../components/CompleteModal.jsx';
import Icon from '../components/Icon.jsx';
import { EVT, recordSearch } from '../algorithms/backtracking.js';
import { MAP_COLORS, buildMapCSP, colorById, findConflicts, isMapSolved } from '../algorithms/mapColoring.js';
import { MAP_LEVELS, getMap } from '../data/maps.js';
import { useProgress } from '../hooks/useProgress.jsx';
import { useSolverPlayer } from '../hooks/useSolverPlayer.js';
import { useTimer } from '../hooks/useTimer.js';
import { navigate } from '../hooks/useRoute.js';
import { computeScore, formatTime } from '../utils/scoring.js';
import { mapHints } from '../utils/hints.js';
import { mapEventMessage, mapPlayMessage, mapStatus } from '../utils/explain.js';

const EMPTY = [];
const KEY_EVENTS = new Set([EVT.SELECT_VARIABLE, EVT.ASSIGN, EVT.CONFLICT, EVT.BACKTRACK, EVT.DEAD_END, EVT.SOLUTION_FOUND, EVT.FAILURE, EVT.PRUNE]);
const isKey = (e) => KEY_EVENTS.has(e.type);
const MODES = { play: { icon: 'gamepad', label: 'Play' }, ai: { icon: 'cpu', label: 'Watch AI solve' } };
const LEARNED = ['Variables', 'Domains', 'Constraints', 'Backtracking', 'Constraint checking'];
const zero = { moves: 0, mistakes: 0, good: 0, conflictEvents: 0 };

export default function MapGame({ level }) {
  const def = MAP_LEVELS.find((l) => l.level === level);
  const map = useMemo(() => getMap(level), [level]);
  const colors = useMemo(() => MAP_COLORS.slice(0, map.colorLimit), [map]);
  const colorIds = useMemo(() => colors.map((c) => c.id), [colors]);
  const csp = useMemo(() => buildMapCSP(map, colorIds), [map, colorIds]);
  const { progress, recordCompletion, recordAiWatched } = useProgress();

  const [mode, setMode] = useState('play');
  const [tool, setTool] = useState(colorIds[0]);
  const [coloring, setColoring] = useState({});
  const [stats, setStats] = useState(zero);
  const [hint, setHint] = useState({ used: 0, revealed: [] });
  const [msg, setMsg] = useState(null);
  const [log, setLog] = useState([]);
  const [done, setDone] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [order, setOrder] = useState('static');
  const [fc, setFc] = useState(false);
  const timer = useTimer();
  const moveN = useRef(0);
  const logId = useRef(0);
  const watched = useRef(false);

  const pushLog = (tone, text) => setLog((l) => [...l.slice(-60), { id: ++logId.current, tone, text }]);

  /* ---------- play mode ---------- */
  const finish = useCallback((finalColoring, s, hintsUsed) => {
    const seconds = timer.read();
    timer.stop();
    const sc = computeScore({ level, seconds, par: def.par, mistakes: s.mistakes, hints: hintsUsed, goodMoves: s.good });
    const result = { challenge: 'map', level, score: sc.score, accuracy: sc.accuracy, seconds: Math.round(seconds), hints: hintsUsed, mistakes: s.mistakes, conflicts: s.conflictEvents, par: def.par, xp: sc.xp };
    const outcome = recordCompletion(result);
    setDone({ result, outcome });
    setShowModal(true);
    setMsg(mapPlayMessage(map, { type: 'solved', n: ++moveN.current }, colorIds));
  }, [timer, level, def, recordCompletion, map, colorIds]);

  const onRegion = (id) => {
    if (done || mode !== 'play') return;
    timer.start();
    const name = map.regions.find((r) => r.id === id).name;
    if (tool === 'erase') {
      if (!coloring[id]) { setMsg({ key: `e-${id}-${++moveN.current}`, tone: 'info', title: `${name} is already empty`, body: 'Pick a colour and click a region to assign it.' }); return; }
      const next = { ...coloring };
      delete next[id];
      setColoring(next);
      setStats((s) => ({ ...s, moves: s.moves + 1 }));
      setHint((h) => ({ ...h, revealed: [] }));
      setMsg(mapPlayMessage(map, { type: 'erase', region: id, n: ++moveN.current }, colorIds));
      pushLog('info', `Cleared ${name}`);
      return;
    }
    if (coloring[id] === tool) return;
    const next = { ...coloring, [id]: tool };
    const conflicts = findConflicts(map, next);
    const bad = conflicts.some(([a, b]) => a === id || b === id);
    const s = { moves: stats.moves + 1, mistakes: stats.mistakes + (bad ? 1 : 0), good: stats.good + (bad ? 0 : 1), conflictEvents: stats.conflictEvents + (bad ? 1 : 0) };
    setStats(s);
    setColoring(next);
    setHint((h) => ({ ...h, revealed: [] }));
    setMsg(mapPlayMessage(map, { type: 'assign', region: id, color: tool, coloring: next, conflicts, n: ++moveN.current }, colorIds));
    pushLog(bad ? 'bad' : 'good', `${name} → ${colorById(tool).name}${bad ? ' (conflict)' : ''}`);
    if (isMapSolved(map, next)) finish(next, s, hint.used);
  };

  const reset = useCallback(() => {
    setColoring({}); setStats(zero); setHint({ used: 0, revealed: [] }); setMsg(null); setLog([]); setDone(null); setShowModal(false); timer.reset();
  }, [timer]);

  const requestHint = () => {
    if (done || hint.revealed.length >= 3) return;
    const list = mapHints(map, coloring, colorIds);
    if (!list.length) return;
    const h = list[Math.min(hint.revealed.length, list.length - 1)];
    setHint((s) => ({ used: s.used + 1, revealed: [...s.revealed, h] }));
    timer.start();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (mode !== 'play' || showModal || e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= colorIds.length) setTool(colorIds[n - 1]);
      else if (e.key === '0' || e.key === 'Backspace') setTool('erase');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, showModal, colorIds]);

  /* ---------- AI mode ---------- */
  const rec = useMemo(() => (mode === 'ai' ? recordSearch(csp, { order, forwardChecking: fc, maxEvents: 200000 }) : null), [mode, csp, order, fc]);
  const player = useSolverPlayer({ events: rec ? rec.events : EMPTY, isKey, defaultDetail: level >= 4 ? 'key' : 'full', autoPlay: mode === 'ai' });
  const e = mode === 'ai' ? player.current : null;

  useEffect(() => {
    if (mode === 'ai' && e && e.type === EVT.SOLUTION_FOUND && player.atEnd && !watched.current) {
      watched.current = true;
      recordAiWatched('map');
    }
  }, [mode, e, player.atEnd, recordAiWatched]);

  const ai = useMemo(() => {
    if (!e) return null;
    let col = e.assignment;
    let tentative = null;
    let conflicts = [];
    if ((e.type === EVT.TRY_VALUE || e.type === EVT.CHECK_CONSTRAINT) && e.variable) {
      col = { ...e.assignment };
      delete col[e.variable];
      tentative = { region: e.variable, color: e.value, bad: e.type === EVT.CHECK_CONSTRAINT && !e.ok };
    } else if (e.type === EVT.CONFLICT) {
      conflicts = findConflicts(map, e.assignment);
      if (!conflicts.length) { col = { ...e.assignment }; delete col[e.variable]; tentative = { region: e.variable, color: e.value, bad: true }; }
    }
    return { coloring: col, tentative, conflicts, domains: e.domains || null, backtrackFrom: e.type === EVT.BACKTRACK ? e.variable : null };
  }, [e, map]);

  const aiMsg = e ? mapEventMessage(map, e, order) : null;
  const [statusText, statusTone] = mapStatus(e);
  const rname = (id) => map.regions.find((r) => r.id === id)?.name || id;

  /* ---------- derived ---------- */
  const conflicts = useMemo(() => findConflicts(map, coloring), [map, coloring]);
  const counts = useMemo(() => {
    const c = {};
    Object.values(coloring).forEach((v) => (c[v] = (c[v] || 0) + 1));
    return c;
  }, [coloring]);
  const live = computeScore({ level, seconds: timer.seconds, par: def.par, mistakes: stats.mistakes, hints: hint.used, goodMoves: stats.good });
  const lastHint = hint.revealed[hint.revealed.length - 1];
  const hintRegion = mode === 'play' ? hint.revealed.map((h) => h.region).filter(Boolean).pop() || null : null;
  const hintColor = mode === 'play' && lastHint && lastHint.color ? lastHint.color : null;
  const completed = Object.fromEntries(MAP_LEVELS.map((l) => [l.level, !!progress.best[`map-${l.level}`]]));
  const best = progress.best[`map-${level}`];
  const selectedTool = tool === 'erase' ? null : tool;

  const switchMode = (m) => { if (m === mode) return; if (m === 'ai') timer.stop(); setMode(m); };

  return (
    <div className="page game-page">
      <GameHeader icon="map" title="Map Coloring" tagline={`${def.title} · ${def.blurb}`} tier={def.tier} level={level} levels={MAP_LEVELS}
        onLevel={(l) => navigate(`/play/map/${l}`)} completed={completed} mode={mode} onMode={switchMode} modeLabels={MODES} />
      <div className="game-layout">
        <div className="game-main">
          <section className="card board-card" aria-label="Map">
            <div className="board-top">
              <div className="row">
                <span className="badge"><Icon name="layers" size={12} /> {map.regions.length} regions · {map.edges.length} borders · {colors.length} colours</span>
                {best && <span className="badge badge-good"><Icon name="trophy" size={12} /> Best {best.score}</span>}
              </div>
              <label className="check"><input type="checkbox" checked={showGraph} onChange={(ev) => setShowGraph(ev.target.checked)} /> Show constraint graph</label>
            </div>
            {mode === 'play' ? (
              <MapBoard map={map} coloring={coloring} conflicts={conflicts} hintRegion={hintRegion} hintColor={hintColor} showGraph={showGraph} interactive={!done} onRegionClick={onRegion} />
            ) : ai ? (
              <MapBoard map={map} coloring={ai.coloring} conflicts={ai.conflicts} currentVar={e.variable || null} tentative={ai.tentative} backtrackFrom={ai.backtrackFrom} domains={ai.domains} showGraph={showGraph} interactive={false} />
            ) : null}
            {mode === 'play' && (
              <>
                <ColorPicker colors={colors} value={selectedTool} onChange={setTool} onClear={() => setTool('erase')} disabled={!!done} counts={counts} />
                {tool === 'erase' && <p className="muted tool-note"><Icon name="undo" size={14} /> Erase mode: click a region to clear it.</p>}
              </>
            )}
            {mode === 'play' && conflicts.length > 0 && (
              <div className="callout callout-bad" role="alert"><Icon name="alert" /><span><b>{conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}:</b> {conflicts.map(([a, b]) => `${rname(a)} ↔ ${rname(b)}`).join(', ')}</span></div>
            )}
            {mode === 'play' && done && !showModal && (
              <div className="callout callout-good"><Icon name="check-circle" /><span>Solved with score <b>{done.result.score}</b>. <button type="button" className="linklike" onClick={() => setShowModal(true)}>View summary</button> · <button type="button" className="linklike" onClick={reset}>Play again</button></span></div>
            )}
          </section>

          {mode === 'play' ? (
            <>
              <ScorePanel title="Scoreboard" items={[
                { key: 'moves', label: 'Moves', icon: 'hash', value: stats.moves },
                { key: 'mist', label: 'Mistakes', icon: 'x-circle', value: stats.mistakes, tone: stats.mistakes ? 'bad' : '' },
                { key: 'conf', label: 'Conflicts', icon: 'alert', value: conflicts.length, tone: conflicts.length ? 'bad' : 'good' },
                { key: 'time', label: 'Time', icon: 'clock', value: formatTime(done ? done.result.seconds : timer.seconds) },
                { key: 'hint', label: 'Hints', icon: 'bulb', value: hint.used },
                { key: 'score', label: 'Score', icon: 'star', value: done ? done.result.score : live.score, tone: 'good' },
              ]} />
              <div className="row actions">
                <button type="button" className="btn" onClick={reset}><Icon name="rotate" /> Reset map</button>
                <button type="button" className="btn btn-ghost" onClick={() => switchMode('ai')}><Icon name="cpu" /> Watch AI solve</button>
              </div>
            </>
          ) : (
            <>
              <SolverControls player={player}>
                <div className="row solver-opts">
                  <label className="field">Variable order
                    <select value={order} onChange={(ev) => setOrder(ev.target.value)} aria-label="Variable ordering">
                      <option value="static">Given order</option>
                      <option value="mrv">MRV (most constrained first)</option>
                    </select>
                  </label>
                  <label className="check"><input type="checkbox" checked={fc} onChange={(ev) => setFc(ev.target.checked)} /> Forward checking</label>
                </div>
              </SolverControls>
              {rec && rec.truncated && <div className="callout callout-warn"><Icon name="alert" /><span>The search was cut off at {rec.events.length.toLocaleString()} steps.</span></div>}
              <div className="row actions">
                <button type="button" className="btn" onClick={() => switchMode('play')}><Icon name="gamepad" /> Back to playing</button>
              </div>
            </>
          )}
        </div>

        <div className="game-side">
          {mode === 'play' ? (
            <ExplanationPanel title="Explanation" message={msg} log={log}
              empty={{ title: 'Pick a colour, click a region', body: 'Rule: neighbouring regions can never share a colour. Every move is explained here.' }} />
          ) : (
            <>
              <AlgorithmVisualizer algorithm="BACKTRACKING SEARCH" step={player.index} total={player.total} status={statusText} tone={statusTone}
                metrics={e ? [
                  { label: 'Current variable', value: e.variable ? rname(e.variable) : '—' },
                  { label: 'Current value', value: e.value ? colorById(e.value).name : '—' },
                  { label: 'Search depth', value: e.stats.depth },
                  { label: 'Backtracks', value: e.stats.backtracks, tone: e.stats.backtracks ? 'warn' : '' },
                  { label: 'Constraint checks', value: e.stats.checks },
                  { label: 'Assignments', value: e.stats.assignments },
                  ...(fc ? [{ label: 'Values pruned', value: e.stats.prunes }] : []),
                ] : []} />
              <ExplanationPanel title="Why?" message={aiMsg} empty={{ title: 'Press play', body: 'The solver explains each step as it runs.' }} />
              {e && e.type === EVT.SOLUTION_FOUND && <div className="callout callout-good"><Icon name="check-circle" /><span>The solver reached a solution. Its search is a real run of backtracking: {e.stats.backtracks} backtracks, {e.stats.checks} checks.</span></div>}
            </>
          )}
          {mode === 'play' && <HintSystem revealed={hint.revealed.map((h) => h.text)} onRequest={requestHint} disabled={!!done} disabledReason={done ? 'Puzzle solved' : undefined} />}
          <CSPModelCard csp={csp} variableLabel={rname}
            domainLabel={`{ ${colors.map((c) => c.name).join(', ')} } for every region`}
            constraintLabel="Neighbouring regions must have different colours."
            sampleConstraints={map.edges.slice(0, 3).map(([a, b]) => `${rname(a)} ≠ ${rname(b)}`)} />
        </div>
      </div>

      {showModal && done && (
        <CompleteModal title={`${def.title} — Level ${level}`} result={done.result} outcome={done.outcome} learned={LEARNED}
          onAgain={reset} onClose={() => setShowModal(false)}
          onNext={() => navigate(level < 5 ? `/play/map/${level + 1}` : '/challenges')} nextLabel={level < 5 ? 'Next challenge' : 'All challenges'} />
      )}
    </div>
  );
}
