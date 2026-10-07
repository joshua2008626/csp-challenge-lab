/**
 * Scoring — deliberately forgiving, never negative.
 *
 *   base        = 500 + 100 × level                    (harder CSP → bigger base)
 *   speed bonus = up to 300 × (1 − time / par)          (only if faster than par)
 *   clean bonus = +100 if no mistakes and no hints
 *   penalties   = 25 per mistake (max 250) + 40 per hint (max 200)
 *   score       = max(100, round(base + speed + clean − penalties))
 *
 *   accuracy    = good moves / (good moves + mistakes)
 *   xp          = round(score / 8)
 */

export function computeScore({ level = 1, seconds = 0, par = 120, mistakes = 0, hints = 0, goodMoves = 0 }) {
  const base = 500 + 100 * level;
  const speed = seconds < par ? Math.round(300 * (1 - seconds / par)) : 0;
  const clean = mistakes === 0 && hints === 0 ? 100 : 0;
  const mistakePenalty = Math.min(250, mistakes * 25);
  const hintPenalty = Math.min(200, hints * 40);
  const score = Math.max(100, Math.round(base + speed + clean - mistakePenalty - hintPenalty));
  const moves = goodMoves + mistakes;
  const accuracy = moves === 0 ? 100 : Math.round((goodMoves / moves) * 100);
  return {
    score,
    accuracy,
    xp: Math.round(score / 8),
    breakdown: { base, speed, clean, mistakePenalty, hintPenalty },
  };
}

/** Live (in-progress) score estimate shown on the score panel. */
export function liveScore(args) {
  return computeScore(args).score;
}

export const PLAYER_LEVELS = [
  { name: 'Beginner', min: 0 },
  { name: 'Intermediate', min: 300 },
  { name: 'Advanced', min: 900 },
  { name: 'Expert', min: 1800 },
];

export function playerLevel(xp) {
  let idx = 0;
  PLAYER_LEVELS.forEach((l, i) => {
    if (xp >= l.min) idx = i;
  });
  const cur = PLAYER_LEVELS[idx];
  const next = PLAYER_LEVELS[idx + 1] || null;
  const pct = next ? Math.round(((xp - cur.min) / (next.min - cur.min)) * 100) : 100;
  return { index: idx, name: cur.name, next, pct, toNext: next ? next.min - xp : 0 };
}

export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
