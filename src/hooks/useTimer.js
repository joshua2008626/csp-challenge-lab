import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Wall-clock stopwatch that survives re-renders and hidden tabs (it stores the start
 * timestamp rather than counting ticks).
 */
export function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAt = useRef(null);
  const accumulated = useRef(0);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      setSeconds(accumulated.current + (Date.now() - startedAt.current) / 1000);
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    if (startedAt.current !== null && running) return;
    startedAt.current = Date.now();
    setRunning(true);
  }, [running]);

  const stop = useCallback(() => {
    if (!running) return accumulated.current;
    accumulated.current += (Date.now() - startedAt.current) / 1000;
    startedAt.current = null;
    setRunning(false);
    setSeconds(accumulated.current);
    return accumulated.current;
  }, [running]);

  const reset = useCallback(() => {
    startedAt.current = null;
    accumulated.current = 0;
    setRunning(false);
    setSeconds(0);
  }, []);

  /** Current elapsed seconds, read synchronously (for scoring right when the puzzle is solved). */
  const read = useCallback(
    () => accumulated.current + (running && startedAt.current ? (Date.now() - startedAt.current) / 1000 : 0),
    [running]
  );

  return { seconds, running, start, stop, reset, read };
}
