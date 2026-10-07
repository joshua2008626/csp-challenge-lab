import { useState } from 'react';
import AchievementCard from '../components/AchievementCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import Icon from '../components/Icon.jsx';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { CHALLENGE_DEFS } from './Challenges.jsx';
import { useProgress } from '../hooks/useProgress.jsx';
import { navigate } from '../hooks/useRoute.js';
import { formatTime, PLAYER_LEVELS } from '../utils/scoring.js';

export default function Progress() {
  const { progress, derived, resetProgress } = useProgress();
  const [confirm, setConfirm] = useState(false);
  const earned = Object.keys(progress.achievements).length;
  const recent = [...progress.log].reverse().slice(0, 8);
  const nameOf = (c) => CHALLENGE_DEFS.find((d) => d.id === c)?.title || c;

  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow"><Icon name="trophy" size={14} /> Progress</span>
        <h1>Your CSP mastery</h1>
        <p>Everything here is computed from the games you have actually finished. It is stored in this browser only.</p>
      </header>

      <div className="grid grid-4 kpis">
        <div className="card kpi"><div className="stat-label"><Icon name="zap" size={12} /> Total XP</div><div className="kpi-value tabular">{progress.xp}</div><div className="muted">Level: <b>{derived.level.name}</b></div></div>
        <div className="card kpi"><div className="stat-label"><Icon name="check-circle" size={12} /> Levels completed</div><div className="kpi-value tabular">{derived.completed}<small>/15</small></div><div className="muted">{progress.totals.plays} total runs</div></div>
        <div className="card kpi"><div className="stat-label"><Icon name="target" size={12} /> Average accuracy</div><div className="kpi-value tabular">{progress.log.length ? `${derived.avgAccuracy}%` : '—'}</div><div className="muted">{progress.totals.mistakes} mistakes · {progress.totals.hints} hints</div></div>
        <div className="card kpi"><div className="stat-label"><Icon name="star" size={12} /> Best score</div><div className="kpi-value tabular">{derived.bestScore || '—'}</div><div className="muted">{earned}/{ACHIEVEMENTS.length} achievements</div></div>
      </div>

      <div className="grid grid-2 prog-grid">
        <section className="card" aria-label="Mastery">
          <h3 className="card-title"><Icon name="trending" /> CSP Mastery</h3>
          <ProgressBar large label="Overall" value={derived.mastery} max={100} />
          <div className="stack prog-bars">
            {CHALLENGE_DEFS.map((c) => <ProgressBar key={c.id} label={c.title} value={derived.perChallenge[c.id].done} max={5} valueText={`${derived.perChallenge[c.id].pct}%`} fill={c.accent} />)}
          </div>
        </section>
        <section className="card" aria-label="Player level">
          <h3 className="card-title"><Icon name="crown" /> Player level</h3>
          <div className="level-ladder">
            {PLAYER_LEVELS.map((l, i) => (
              <div key={l.name} className={`rung ${i < derived.level.index ? 'past' : ''} ${i === derived.level.index ? 'now' : ''}`}>
                <span className="rung-dot">{i < derived.level.index ? <Icon name="check" size={12} strokeWidth={3} /> : i + 1}</span>
                <span><b>{l.name}</b><small>{l.min} XP</small></span>
              </div>
            ))}
          </div>
          <ProgressBar label={derived.level.next ? `Next: ${derived.level.next.name}` : 'Top level reached'} value={derived.level.pct} max={100} valueText={derived.level.next ? `${derived.level.toNext} XP to go` : 'Max'} />
        </section>
      </div>

      <section className="section">
        <div className="section-head"><div><h2>Achievements</h2><p>{earned} of {ACHIEVEMENTS.length} unlocked.</p></div></div>
        <div className="grid grid-3">{ACHIEVEMENTS.map((a) => <AchievementCard key={a.id} achievement={a} unlockedAt={progress.achievements[a.id]} />)}</div>
      </section>

      <section className="section">
        <div className="section-head"><div><h2>Recent runs</h2></div></div>
        {recent.length === 0 ? (
          <div className="empty"><Icon name="gamepad" /><h4>No finished challenges yet</h4><p>Solve a puzzle and your score, accuracy and time will show up here.</p><button type="button" className="btn btn-primary" onClick={() => navigate('/challenges')}>Start a challenge <Icon name="arrow-right" /></button></div>
        ) : (
          <div className="card table-card">
            <table className="runs">
              <thead><tr><th>Challenge</th><th>Level</th><th>Score</th><th>Accuracy</th><th>Time</th><th>Hints</th><th>When</th></tr></thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.at}><td>{nameOf(r.challenge)}</td><td>{r.level}</td><td className="tabular"><b>{r.score}</b></td><td>{r.accuracy}%</td><td className="mono">{formatTime(r.seconds)}</td><td>{r.hints}</td><td className="muted">{new Date(r.at).toLocaleDateString()}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="section reset-zone">
        {!confirm ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(true)}><Icon name="trash" /> Reset all progress</button>
        ) : (
          <div className="callout callout-warn" role="alertdialog" aria-label="Confirm reset">
            <Icon name="alert" /><span>This deletes your XP, scores and achievements from this browser.</span>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => { resetProgress(); setConfirm(false); }}>Yes, delete everything</button>
            <button type="button" className="btn btn-sm" onClick={() => setConfirm(false)}>Cancel</button>
          </div>
        )}
      </section>
    </div>
  );
}
