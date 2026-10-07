/**
 * Crypt-arithmetic puzzles. Each has exactly one solution (verified by tests/algorithms.test.js).
 * Difficulty follows the real size of the search space (letters, columns, addends).
 */
export const CRYPT_PUZZLES = [
  { id: 'c1', level: 1, tier: 'Beginner', title: 'Warm-up', addends: ['TO', 'GO'], result: 'OUT', par: 100,
    blurb: 'Four letters and a single carry into a new column.' },
  { id: 'c2', level: 2, tier: 'Beginner', title: 'Apple Pie', addends: ['EAT', 'THAT'], result: 'APPLE', par: 160,
    blurb: 'Six letters; a repeated P in the answer gives you a strong clue.' },
  { id: 'c3', level: 3, tier: 'Intermediate', title: 'The Classic', addends: ['SEND', 'MORE'], result: 'MONEY', par: 240,
    blurb: 'The famous puzzle: 8 letters, 5 columns, one answer.' },
  { id: 'c4', level: 4, tier: 'Advanced', title: 'Three Addends', addends: ['FORTY', 'TEN', 'TEN'], result: 'SIXTY', par: 330,
    blurb: 'Three rows to add, so carries can reach 2. Ten different letters.' },
  { id: 'c5', level: 5, tier: 'Expert', title: 'Grand Finale', addends: ['DONALD', 'GERALD'], result: 'ROBERT', par: 420,
    blurb: 'Ten letters use every digit 0–9 exactly once.' },
];

export const getPuzzle = (level) => CRYPT_PUZZLES.find((p) => p.level === level);
