import { useAppContext } from '../context/app-context.js';

// Module-level storage for callback to avoid React closure issues
let pendingCallback: (() => void) | null = null;

/**
 * Hook to manage confirmation dialogs
 * Shows y/n prompt in status bar
 */
export function useConfirm() {
  const {
    showConfirm,
    confirmMessage,
    setShowConfirm,
    setConfirmMessage,
  } = useAppContext();

  const requestConfirm = (message: string, onConfirm: () => void) => {
    pendingCallback = onConfirm;
    setConfirmMessage(message);
    setShowConfirm(true);
  };

  const confirm = () => {
    const callback = pendingCallback;
    pendingCallback = null;
    setShowConfirm(false);
    setConfirmMessage('');
    // Execute callback after clearing state
    if (callback) {
      callback();
    }
  };

  const cancel = () => {
    pendingCallback = null;
    setShowConfirm(false);
    setConfirmMessage('');
  };

  return {
    showConfirm,
    confirmMessage,
    requestConfirm,
    confirm,
    cancel,
  };
}
