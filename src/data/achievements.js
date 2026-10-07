/**
 * Achievements are pure functions of persisted progress, so they can never be "faked":
 * evaluate(progress) returns the ids that are currently earned.
 *
 * progress.completions[`${challenge}-${level}`] = { plays, best, bestAccuracy, bestTime, cleanRuns, ... }
 * progress.log = [{ challenge, level, score, accuracy, seconds, hints, mistakes, par }]  (recent completions)
 * progress.aiWatched = { map: bool, crypt: bool, queens: bool }
 */

export const CHALLENGES = ['map', 'crypt', 'queens'];

export const ACHIEVEMENTS = [
  {
    id: 'first-solution',
    emoji: '🧠',
    name: 'First Solution',
    desc: 'Solve your first CSP.',
    test: (p) => p.log.length > 0,
  },
  {
    id: 'color-master',
    emoji: '🎨',
    name: 'Color Master',
    desc: 'Complete a Map Coloring level without a single mistake.',
    test: (p) => p.log.some((r) => r.challenge === 'map' && r.mistakes === 0),
  },
  {
    id: 'code-breaker',
    emoji: '🔐',
    name: 'Code Breaker',
    desc: 'Solve a crypt-arithmetic puzzle.',
    test: (p) => p.log.some((r) => r.challenge === 'crypt'),
  },
  {
    id: 'zero-conflicts',
    emoji: '♛',
    name: 'Zero Conflicts',
    desc: 'Solve N-Queens with no queens attacking.',
    test: (p) => p.log.some((r) => r.challenge === 'queens'),
  },
  {
    id: 'speed-solver',
    emoji: '⚡',
    name: 'Speed Solver',
    desc: 'Finish a challenge in under half of its par time.',
    test: (p) => p.log.some((r) => r.seconds <= r.par * 0.5),
  },
  {
    id: 'ai-observer',
    emoji: '🤖',
    name: 'AI Observer',
    desc: 'Watch an AI solver run all the way to its solution.',
    test: (p) => CHALLENGES.some((c) => p.aiWatched[c]),
  },
  {
    id: 'no-hints',
    emoji: '🧩',
    name: 'Unaided',
    desc: 'Complete a level 3 (or higher) challenge without using any hints.',
    test: (p) => p.log.some((r) => r.level >= 3 && r.hints === 0),
  },
  {
    id: 'level-5',
    emoji: '🏔️',
    name: 'Summit',
    desc: 'Complete a level 5 challenge.',
    test: (p) => p.log.some((r) => r.level >= 5),
  },
  {
    id: 'csp-master',
    emoji: '🏆',
    name: 'CSP Master',
    desc: 'Complete all three challenge categories.',
    test: (p) => CHALLENGES.every((c) => p.log.some((r) => r.challenge === c)),
  },
];

export function evaluateAchievements(progress) {
  return ACHIEVEMENTS.filter((a) => a.test(progress)).map((a) => a.id);
}
