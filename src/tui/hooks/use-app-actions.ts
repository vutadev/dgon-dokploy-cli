import { useCallback } from 'react';
import { useAppContext } from '../context/app-context.js';
import { api } from '../../lib/api.js';

type ActionType = 'deploy' | 'stop' | 'start' | 'restart';

const actionLabels: Record<ActionType, string> = {
  deploy: 'Deploying',
  stop: 'Stopping',
  start: 'Starting',
  restart: 'Restarting',
};

/**
 * Hook to handle app actions (deploy, stop, start, restart)
 * Uses context for action state to allow status bar display
 */
export function useAppActions() {
  const {
    activeApp,
    actionRunning,
    setActionRunning,
    setActionMessage,
  } = useAppContext();

  const clearMessage = useCallback(() => {
    setActionMessage(null);
  }, [setActionMessage]);

  const runAction = useCallback(
    async (action: ActionType) => {
      if (!activeApp || actionRunning) return false;

      const label = actionLabels[action];
      setActionRunning(`${label}...`);
      setActionMessage(null);

      try {
        const endpoint = `/application.${action}`;
        await api.post(endpoint, { applicationId: activeApp.applicationId });

        setActionRunning(null);
        setActionMessage({
          text: `${label} successful for ${activeApp.name}`,
          type: 'success',
        });

        // Auto-clear success message after 3s
        setTimeout(clearMessage, 3000);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to ${action}`;
        setActionRunning(null);
        setActionMessage({
          text: message,
          type: 'error',
        });
        return false;
      }
    },
    [activeApp, actionRunning, setActionRunning, setActionMessage, clearMessage]
  );

  const deploy = useCallback(() => runAction('deploy'), [runAction]);
  const stop = useCallback(() => runAction('stop'), [runAction]);
  const start = useCallback(() => runAction('start'), [runAction]);
  const restart = useCallback(() => runAction('restart'), [runAction]);

  return {
    isRunning: !!actionRunning,
    deploy,
    stop,
    start,
    restart,
    clearMessage,
  };
}
