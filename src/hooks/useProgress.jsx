import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { clearProgress, emptyProgress, loadProgress, saveProgress } from '../utils/storage.js';
import { ACHIEVEMENTS, CHALLENGES, evaluateAchievements } from '../data/achievements.js';
import { playerLevel } from '../utils/scoring.js';

const ProgressContext = createContext(null);
const MAX_LOG = 300;

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(loadProgress);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // keep several tabs in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'csp-lab-progress-v1') setProgress(loadProgress());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const pushToast = useCallback(
    (a) => {
      const id = ++toastId.current;
      setToasts((t) => [...t, { id, ...a }]);
      setTimeout(() => dismissToast(id), 6000);
    },
    [dismissToast]
  );

  /** Merge newly earned achievements into progress; returns the list of newly unlocked ones. */
  const withAchievements = useCallback((p) => {
    const earned = evaluateAchievements(p);
    const fresh = earned.filter((id) => !p.achievements[id]);
    if (!fresh.length) return { next: p, fresh: [] };
    const now = Date.now();
    const achievements = { ...p.achievements };
    fresh.forEach((id) => (achievements[id] = now));
    return { next: { ...p, achievements }, fresh };
  }, []);

  /**
   * Record a finished challenge. Returns { isBest, previousBest, newAchievements, xpGained }.
   * `result` = { challenge, level, score, accuracy, seconds, hints, mistakes, conflicts, par, xp }
   */
  const recordCompletion = useCallback(
    (result) => {
      const key = `${result.challenge}-${result.level}`;
      const previous = progress.best[key];
      const isBest = !previous || result.score > previous.score;
      const entry = {
        score: isBest ? result.score : previous.score,
        accuracy: isBest ? result.accuracy : previous.accuracy,
        seconds: previous ? Math.min(previous.seconds, result.seconds) : result.seconds,
        plays: (previous?.plays || 0) + 1,
      };
      const base = {
        ...progress,
        xp: progress.xp + result.xp,
        best: { ...progress.best, [key]: entry },
        log: [...progress.log, { ...result, at: Date.now() }].slice(-MAX_LOG),
        totals: {
          plays: progress.totals.plays + 1,
          hints: progress.totals.hints + result.hints,
          mistakes: progress.totals.mistakes + result.mistakes,
        },
      };
      const { next, fresh } = withAchievements(base);
      setProgress(next);
      const newAchievements = fresh.map((id) => ACHIEVEMENTS.find((a) => a.id === id)).filter(Boolean);
      newAchievements.forEach((a, i) => setTimeout(() => pushToast(a), 700 + i * 500));
      return { isBest, previousBest: previous || null, newAchievements, xpGained: result.xp };
    },
    [progress, pushToast, withAchievements]
  );

  /** The player watched an AI solver reach its solution. */
  const recordAiWatched = useCallback(
    (challenge) => {
      if (progress.aiWatched[challenge]) return [];
      const base = { ...progress, aiWatched: { ...progress.aiWatched, [challenge]: true }, xp: progress.xp + 15 };
      const { next, fresh } = withAchievements(base);
      setProgress(next);
      const list = fresh.map((id) => ACHIEVEMENTS.find((a) => a.id === id)).filter(Boolean);
      list.forEach((a, i) => setTimeout(() => pushToast(a), 300 + i * 500));
      return list;
    },
    [progress, pushToast, withAchievements]
  );

  const resetProgress = useCallback(() => {
    clearProgress();
    setProgress(emptyProgress());
  }, []);

  const derived = useMemo(() => {
    const completedLevels = (challenge) =>
      Object.keys(progress.best).filter((k) => k.startsWith(`${challenge}-`)).length;
    const log = progress.log;
    const avgAccuracy = log.length ? Math.round(log.reduce((s, r) => s + r.accuracy, 0) / log.length) : 0;
    const bestScore = log.length ? Math.max(...log.map((r) => r.score)) : 0;
    const perChallenge = {};
    CHALLENGES.forEach((c) => {
      const done = completedLevels(c);
      perChallenge[c] = { done, total: 5, pct: Math.round((done / 5) * 100) };
    });
    const mastery = Math.round(
      CHALLENGES.reduce((s, c) => s + perChallenge[c].pct, 0) / CHALLENGES.length
    );
    return {
      level: playerLevel(progress.xp),
      completed: Object.keys(progress.best).length,
      avgAccuracy,
      bestScore,
      perChallenge,
      mastery,
    };
  }, [progress]);

  const value = useMemo(
    () => ({ progress, derived, recordCompletion, recordAiWatched, resetProgress, toasts, dismissToast }),
    [progress, derived, recordCompletion, recordAiWatched, resetProgress, toasts, dismissToast]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}
