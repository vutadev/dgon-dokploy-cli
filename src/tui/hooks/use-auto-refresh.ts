import { useEffect, useRef, useCallback } from 'react';

interface AutoRefreshOptions {
  interval?: number; // ms, default 5000
  enabled?: boolean;
  onRefresh: () => void | Promise<void>;
}

/**
 * Hook for auto-refreshing data at intervals
 * Used for polling app status updates
 */
export function useAutoRefresh(options: AutoRefreshOptions) {
  const { interval = 5000, enabled = true, onRefresh } = options;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    if (enabled) {
      timerRef.current = setInterval(() => {
        onRefresh();
      }, interval);
    }
  }, [enabled, interval, onRefresh, stop]);

  // Start/stop based on enabled state
  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }
    return stop;
  }, [enabled, start, stop]);

  return { start, stop };
}
