import { createCSP } from './cspUtils.js';

/**
 * Crypt-arithmetic as a CSP.
 *
 * Puzzle: { id, addends: ['SEND','MORE'], result: 'MONEY' }
 *
 * Variables : every distinct letter
 * Domains   : 0..9 (leading letters: 1..9)
 * Constraints
 *   - ALL-DIFFERENT : no two letters share a digit (one pairwise ≠ constraint each,
 *                     so a conflict names the two offending letters)
 *   - COLUMN k      : for the low k+1 columns, sum of addend digits ≡ result digits
 *                     (mod 10^(k+1)); this is the "carry constraint" and is checked as
 *                     soon as every letter in those columns has a value
 *   - FINAL         : the full equation holds
 *
 * Variables are ordered column by column starting from the units column, so the
 * column constraints can fire as early as possible (strong pruning).
 */

export function uniqueLetters(puzzle) {
  const set = new Set();
  [...puzzle.addends, puzzle.result].forEach((w) => [...w].forEach((ch) => set.add(ch)));
  return [...set];
}

export function leadingLetters(puzzle) {
  return new Set([...puzzle.addends, puzzle.result].map((w) => w[0]));
}

/** Letters ordered right-to-left by column, so low columns get decided first. */
export function columnOrder(puzzle) {
  const words = [...puzzle.addends, puzzle.result];
  const width = Math.max(...words.map((w) => w.length));
  const order = [];
  for (let k = 0; k < width; k++) {
    for (const w of words) {
      const ch = w[w.length - 1 - k];
      if (ch && !order.includes(ch)) order.push(ch);
    }
  }
  return order;
}

export const wordValue = (word, asg) => {
  let n = 0;
  for (const ch of word) {
    if (asg[ch] === undefined) return null;
    n = n * 10 + asg[ch];
  }
  return n;
};

/** Letters appearing in columns 0..k (0 = units). */
function lettersUpToColumn(puzzle, k) {
  const words = [...puzzle.addends, puzzle.result];
  const s = new Set();
  words.forEach((w) => {
    for (let i = 0; i <= k; i++) {
      const ch = w[w.length - 1 - i];
      if (ch) s.add(ch);
    }
  });
  return [...s];
}

/** Value of the low (k+1) digits of a word, or null if any is unassigned. */
function lowValue(word, k, asg) {
  let n = 0;
  const start = Math.max(0, word.length - (k + 1));
  for (let i = start; i < word.length; i++) {
    const v = asg[word[i]];
    if (v === undefined) return null;
    n = n * 10 + v;
  }
  return n;
}

export function columnCount(puzzle) {
  return Math.max(...[...puzzle.addends, puzzle.result].map((w) => w.length));
}

/**
 * Column-by-column arithmetic for a (partial) assignment.
 * Returns an array (units first) of
 *   { index, digits: [..addend digits or null], carryIn, sum, resultDigit, carryOut, ready, ok }
 * `ready` is true when every digit in this column is known and carryIn is known.
 */
export function columnAnalysis(puzzle, asg) {
  const cols = columnCount(puzzle);
  const out = [];
  let carryIn = 0;
  let chainKnown = true;
  for (let k = 0; k < cols; k++) {
    const digits = puzzle.addends.map((w) => {
      const ch = w[w.length - 1 - k];
      if (!ch) return 0;
      return asg[ch] === undefined ? null : asg[ch];
    });
    const rch = puzzle.result[puzzle.result.length - 1 - k];
    const resultDigit = rch === undefined ? 0 : asg[rch] === undefined ? null : asg[rch];
    const ready = chainKnown && digits.every((d) => d !== null) && resultDigit !== null;
    let sum = null;
    let carryOut = null;
    let ok = null;
    if (ready) {
      sum = digits.reduce((a, b) => a + b, 0) + carryIn;
      carryOut = Math.floor(sum / 10);
      ok = sum % 10 === resultDigit;
    }
    out.push({
      index: k,
      digits,
      carryIn: chainKnown ? carryIn : null,
      sum,
      resultDigit,
      carryOut,
      ready,
      ok,
    });
    if (ready && ok) carryIn = carryOut;
    else chainKnown = false;
  }
  return out;
}

export function buildCryptCSP(puzzle) {
  const letters = columnOrder(puzzle);
  const leading = leadingLetters(puzzle);
  const variables = letters;
  const domains = {};
  letters.forEach((l) => {
    domains[l] = leading.has(l) ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  });

  const constraints = [];

  // All-different, expressed pairwise.
  for (let i = 0; i < letters.length; i++) {
    for (let j = i + 1; j < letters.length; j++) {
      const a = letters[i];
      const b = letters[j];
      constraints.push({
        id: `diff-${a}-${b}`,
        kind: 'ALL_DIFFERENT',
        scope: [a, b],
        check: (asg) => asg[a] === undefined || asg[b] === undefined || asg[a] !== asg[b],
        describe: (asg, ok) =>
          asg[a] === undefined || asg[b] === undefined
            ? `${a} ≠ ${b}`
            : ok
            ? `${a}=${asg[a]} and ${b}=${asg[b]} are different ✓`
            : `${a} and ${b} would both be ${asg[a]}, but every letter needs its own digit`,
      });
    }
  }

  // Column (carry) constraints on the low k+1 digits.
  const cols = columnCount(puzzle);
  for (let k = 0; k < cols; k++) {
    const scope = lettersUpToColumn(puzzle, k);
    const mod = 10 ** (k + 1);
    constraints.push({
      id: `col-${k}`,
      kind: 'COLUMN',
      column: k,
      scope,
      check: (asg) => {
        const addLow = puzzle.addends.map((w) => lowValue(w, k, asg));
        const resLow = lowValue(puzzle.result, k, asg);
        if (resLow === null || addLow.some((x) => x === null)) return true;
        const total = addLow.reduce((a, b) => a + b, 0);
        return total % mod === resLow;
      },
      describe: (asg, ok) => {
        const col = columnAnalysis(puzzle, asg)[k];
        if (!col || !col.ready) return `Column ${k + 1}: waiting for more letters`;
        const names = puzzle.addends.map((w) => w[w.length - 1 - k] || '0');
        const rn = puzzle.result[puzzle.result.length - 1 - k] || '0';
        const left = `${names.join(' + ')}${col.carryIn ? ' + carry ' + col.carryIn : ''}`;
        const calc = `${col.digits.join(' + ')}${col.carryIn ? ' + ' + col.carryIn : ''} = ${col.sum}`;
        return ok
          ? `Column ${k + 1}: ${left} → ${calc}, last digit ${col.sum % 10} = ${rn} ✓ (carry ${col.carryOut})`
          : `Column ${k + 1}: ${calc} ends in ${col.sum % 10}, but ${rn} = ${col.resultDigit}`;
      },
    });
  }

  // Full equation (guards the top column: leftover carry must equal the result's extra digit).
  constraints.push({
    id: 'final',
    kind: 'EQUATION',
    scope: letters,
    check: (asg) => {
      const vals = puzzle.addends.map((w) => wordValue(w, asg));
      const r = wordValue(puzzle.result, asg);
      if (r === null || vals.some((v) => v === null)) return true;
      return vals.reduce((a, b) => a + b, 0) === r;
    },
    describe: (asg, ok) => {
      const vals = puzzle.addends.map((w) => wordValue(w, asg));
      const r = wordValue(puzzle.result, asg);
      if (r === null || vals.some((v) => v === null)) return 'The full equation needs every letter';
      return `${vals.join(' + ')} ${ok ? '=' : '≠'} ${r}`;
    },
  });

  return createCSP({ name: `Crypt: ${puzzle.addends.join(' + ')} = ${puzzle.result}`, variables, domains, constraints });
}

/** Does `asg` (complete) solve the puzzle? */
export function isCryptSolved(puzzle, asg) {
  const letters = uniqueLetters(puzzle);
  if (!letters.every((l) => asg[l] !== undefined)) return false;
  const used = letters.map((l) => asg[l]);
  if (new Set(used).size !== used.length) return false;
  for (const l of leadingLetters(puzzle)) if (asg[l] === 0) return false;
  const total = puzzle.addends.reduce((s, w) => s + wordValue(w, asg), 0);
  return total === wordValue(puzzle.result, asg);
}

/**
 * Immediate problems with a (partial) player assignment. Used for live mistake
 * detection and for the explanation panel.
 * Returns [{ type, letters, message }]
 */
export function cryptProblems(puzzle, asg) {
  const problems = [];
  const letters = uniqueLetters(puzzle);
  const leading = leadingLetters(puzzle);
  const byDigit = {};
  letters.forEach((l) => {
    if (asg[l] === undefined) return;
    (byDigit[asg[l]] = byDigit[asg[l]] || []).push(l);
    if (asg[l] === 0 && leading.has(l)) {
      problems.push({ type: 'LEADING_ZERO', letters: [l], message: `${l} starts a word, so it cannot be 0.` });
    }
  });
  Object.entries(byDigit).forEach(([d, ls]) => {
    if (ls.length > 1) {
      problems.push({
        type: 'DUPLICATE',
        letters: ls,
        message: `${ls.join(' and ')} both use ${d}. Different letters need different digits.`,
      });
    }
  });
  columnAnalysis(puzzle, asg).forEach((col) => {
    if (col.ready && col.ok === false) {
      const rch = puzzle.result[puzzle.result.length - 1 - col.index];
      problems.push({
        type: 'COLUMN',
        column: col.index,
        letters: [
          ...new Set(
            [...puzzle.addends, puzzle.result]
              .map((w) => w[w.length - 1 - col.index])
              .filter(Boolean)
          ),
        ],
        message: `Column ${col.index + 1} fails: the digits add up to ${col.sum}, which ends in ${col.sum % 10}, but ${rch} is ${col.resultDigit}.`,
      });
    }
  });
  // Complete assignment but wrong total (e.g. top column mismatch)
  if (letters.every((l) => asg[l] !== undefined) && problems.length === 0 && !isCryptSolved(puzzle, asg)) {
    problems.push({ type: 'EQUATION', letters, message: 'Every column checks out but the total is still wrong — look at the leftmost column.' });
  }
  return problems;
}

/** Count how many solutions exist (stops at `limit`) — used by tests and puzzle validation. */
export function countCryptSolutions(puzzle, limit = 2) {
  const letters = columnOrder(puzzle);
  const leading = leadingLetters(puzzle);
  const csp = buildCryptCSP(puzzle);
  const asg = {};
  const used = new Set();
  let count = 0;
  const sols = [];
  function rec(i) {
    if (count >= limit) return;
    if (i === letters.length) {
      count += 1;
      sols.push({ ...asg });
      return;
    }
    const v = letters[i];
    for (const d of csp.domains[v]) {
      if (used.has(d)) continue;
      asg[v] = d;
      used.add(d);
      if ((csp.constraintsByVar[v] || []).every((c) => c.check(asg))) rec(i + 1);
      used.delete(d);
      delete asg[v];
    }
  }
  rec(0);
  return { count, solutions: sols };
}
