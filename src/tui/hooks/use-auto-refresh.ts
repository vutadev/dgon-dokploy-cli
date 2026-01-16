import { useEffect, useRef, useCallback } from 'react';

interface AutoRefreshOptions {
  interval?: number; // ms, default 5000
  enabled?: boolean;
  onRefresh: () => void | Promise<void>;
}

/**
 * Hook for auto-refreshing data at intervals
 * Used for polling app status updates
 * Uses ref for onRefresh to prevent interval restarts when callback changes
 */
export function useAutoRefresh(options: AutoRefreshOptions) {
  const { interval = 5000, enabled = true, onRefresh } = options;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Use ref for onRefresh to prevent interval restarts when callback identity changes
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

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
        onRefreshRef.current();
      }, interval);
    }
  }, [enabled, interval, stop]);

  // Start/stop based on enabled state or interval change
  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }
    return stop;
  }, [enabled, interval, start, stop]);

  return { start, stop };
}
