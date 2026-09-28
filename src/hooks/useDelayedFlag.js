import { useEffect, useState } from "react";

/**
 * Mirrors `active` but only flips true after `delay` ms, and flips back to
 * false immediately once `active` goes false. Used to avoid flashing a
 * loading state for operations that finish in well under 200ms.
 */
export function useDelayedFlag(active, delay = 200) {
  const [reachedDelay, setReachedDelay] = useState(false);

  useEffect(() => {
    if (!active) return undefined;
    const timer = setTimeout(() => setReachedDelay(true), delay);
    return () => {
      clearTimeout(timer);
      setReachedDelay(false);
    };
  }, [active, delay]);

  return active && reachedDelay;
}
