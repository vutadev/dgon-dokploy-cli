import { useState, useCallback, useEffect } from 'react';
import { stat } from 'fs/promises';
import { homedir } from 'os';
import { normalize, dirname, resolve, isAbsolute } from 'path';

interface UsePathInputOptions {
  initialValue?: string;
  mode: 'export' | 'import';
}

export interface UsePathInputReturn {
  value: string;
  normalizedPath: string;
  isValid: boolean;
  error: string | null;
  isValidating: boolean;
  setValue: (value: string) => void;
  appendChar: (char: string) => void;
  deleteChar: () => void;
}

/**
 * Hook for file path input with validation and normalization
 * Supports ~, relative, and absolute paths
 */
export function usePathInput(options: UsePathInputOptions): UsePathInputReturn {
  const [value, setValue] = useState(options.initialValue || '');
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Resolve path with tilde expansion
  const resolvePath = useCallback((input: string): string => {
    let p = input.trim();
    if (!p) return '';

    if (p.startsWith('~')) {
      p = p.replace(/^~/, homedir());
    }
    p = normalize(p);
    if (!isAbsolute(p)) {
      p = resolve(process.cwd(), p);
    }
    return p;
  }, []);

  const normalizedPath = resolvePath(value);

  // Validate path
  useEffect(() => {
    if (!value.trim()) {
      setIsValid(false);
      setError('Path required');
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidating(true);
      try {
        const resolved = resolvePath(value);

        if (options.mode === 'export') {
          // Check parent directory exists
          const parentDir = dirname(resolved);
          await stat(parentDir);
          setIsValid(true);
          setError(null);
        } else {
          // Check file exists
          const stats = await stat(resolved);
          if (!stats.isFile()) {
            setIsValid(false);
            setError('Not a file');
          } else {
            setIsValid(true);
            setError(null);
          }
        }
      } catch {
        setIsValid(false);
        setError(
          options.mode === 'export'
            ? 'Parent directory does not exist'
            : 'File not found'
        );
      } finally {
        setIsValidating(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [value, options.mode, resolvePath]);

  const appendChar = useCallback((char: string) => {
    setValue(prev => prev + char);
  }, []);

  const deleteChar = useCallback(() => {
    setValue(prev => prev.slice(0, -1));
  }, []);

  return {
    value,
    normalizedPath,
    isValid,
    error,
    isValidating,
    setValue,
    appendChar,
    deleteChar,
  };
}
