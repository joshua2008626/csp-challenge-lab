const KEY = 'csp-lab-progress-v1';

export const emptyProgress = () => ({
  version: 1,
  xp: 0,
  log: [], // every completed challenge (capped)
  best: {}, // `${challenge}-${level}` -> { score, accuracy, seconds, plays }
  achievements: {}, // id -> unlockedAt (ms)
  aiWatched: { map: false, crypt: false, queens: false },
  totals: { plays: 0, hints: 0, mistakes: 0 },
});

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return emptyProgress();
    const base = emptyProgress();
    return {
      ...base,
      ...parsed,
      aiWatched: { ...base.aiWatched, ...(parsed.aiWatched || {}) },
      totals: { ...base.totals, ...(parsed.totals || {}) },
      log: Array.isArray(parsed.log) ? parsed.log : [],
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage full / blocked — progress simply stays in memory */
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
