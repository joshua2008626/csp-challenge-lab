import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** Playback speeds. `eps` = events per second at the 'fast' end; everything is clamped to a 16ms tick. */
export const SPEEDS = [
  { id: 0.5, label: '0.5×', delay: 1500, steps: 1 },
  { id: 1, label: '1×', delay: 800, steps: 1 },
  { id: 2, label: '2×', delay: 400, steps: 1 },
  { id: 5, label: '5×', delay: 160, steps: 1 },
  { id: 25, label: '25×', delay: 32, steps: 1 },
  { id: 1000, label: 'Turbo', delay: 16, steps: 24 },
];

/**
 * Replays a recorded event list produced by a REAL solver.
 *
 * - `events`  : full list from recordSearch / recordMinConflicts
 * - `isKey`   : predicate for the "key steps" view (hides the many low-level checks)
 * - state is index-based, so Previous Step is free: every event carries its own snapshot.
 */
export function useSolverPlayer({ events, isKey, defaultDetail = 'full', autoPlay = false }) {
  const [detail, setDetailState] = useState(defaultDetail);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedId, setSpeedId] = useState(1);

  // indices into `events` that are visible in the current detail mode (the final event is always visible)
  const view = useMemo(() => {
    if (detail === 'full' || !isKey) return events.map((_, i) => i);
    const out = [];
    events.forEach((e, i) => {
      if (isKey(e) || i === events.length - 1) out.push(i);
    });
    return out.length ? out : events.map((_, i) => i);
  }, [events, detail, isKey]);

  const total = view.length;
  const lastIndex = Math.max(0, total - 1);

  // New recording → rewind
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      setPlaying(autoPlay && events.length > 1);
      return;
    }
    setIndex(0);
    setPlaying(autoPlay && events.length > 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  // Clamp if the view shrinks under us
  useEffect(() => {
    setIndex((i) => Math.min(i, lastIndex));
  }, [lastIndex]);

  const speed = SPEEDS.find((s) => s.id === speedId) || SPEEDS[1];

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      setIndex((i) => {
        const n = Math.min(i + speed.steps, lastIndex);
        return n;
      });
    }, speed.delay);
    return () => clearInterval(id);
  }, [playing, speed, lastIndex]);

  // stop at the end
  useEffect(() => {
    if (playing && index >= lastIndex) setPlaying(false);
  }, [playing, index, lastIndex]);

  const safeIndex = Math.min(index, lastIndex);
  const origIndex = view[safeIndex] ?? 0;
  const current = events[origIndex] || null;
  const previous = safeIndex > 0 ? events[view[safeIndex - 1]] : null;

  const play = useCallback(() => {
    setIndex((i) => (i >= lastIndex ? 0 : i));
    setPlaying(true);
  }, [lastIndex]);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (!p) setIndex((i) => (i >= lastIndex ? 0 : i));
      return !p;
    });
  }, [lastIndex]);
  const next = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.min(i + 1, lastIndex));
  }, [lastIndex]);
  const prev = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.max(i - 1, 0));
  }, []);
  const restart = useCallback(() => {
    setPlaying(false);
    setIndex(0);
  }, []);
  const end = useCallback(() => {
    setPlaying(false);
    setIndex(lastIndex);
  }, [lastIndex]);
  const seek = useCallback((i) => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(Number(i) || 0, lastIndex)));
  }, [lastIndex]);

  const setDetail = useCallback(
    (d) => {
      if (d === detail) return;
      // keep roughly the same place in the run when changing detail level
      const target = origIndex;
      setDetailState(d);
      setPlaying(false);
      requestAnimationFrame(() => {
        const nextView =
          d === 'full' || !isKey
            ? null
            : events.reduce((acc, e, i) => (isKey(e) || i === events.length - 1 ? (acc.push(i), acc) : acc), []);
        if (!nextView) setIndex(target);
        else {
          const found = nextView.findIndex((o) => o >= target);
          setIndex(found === -1 ? nextView.length - 1 : found);
        }
      });
    },
    [detail, origIndex, events, isKey]
  );

  return {
    events,
    current,
    previous,
    index: safeIndex,
    origIndex,
    total,
    playing,
    speed: speedId,
    detail,
    atStart: safeIndex === 0,
    atEnd: safeIndex >= lastIndex,
    play,
    pause,
    toggle,
    next,
    prev,
    restart,
    end,
    seek,
    setSpeed: setSpeedId,
    setDetail,
  };
}
