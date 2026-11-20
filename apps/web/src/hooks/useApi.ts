import { useEffect, useRef, useState } from 'react';
import { ApiClientError } from '../api/client';

export type ApiState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: ApiClientError; retry: () => void }
  | { status: 'success'; data: T };

/**
 * Loads data for a view and exposes loading / error / success, plus retry.
 * `key` identifies the request: when it changes (e.g. a new product id) the data reloads.
 */
export function useApi<T>(key: string, load: () => Promise<T>): ApiState<T> {
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${key}#${attempt}`;
  const [result, setResult] = useState<{ key: string; data?: T; error?: ApiClientError }>();

  // Keep the latest loader without making it an effect dependency (callers pass inline lambdas).
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let cancelled = false;
    loadRef.current().then(
      (data) => !cancelled && setResult({ key: requestKey, data }),
      (error: unknown) =>
        !cancelled &&
        setResult({
          key: requestKey,
          error:
            error instanceof ApiClientError
              ? error
              : new ApiClientError(0, 'UNKNOWN', 'Something went wrong.'),
        }),
    );
    return () => {
      cancelled = true; // ignore a slow response for a request we no longer care about
    };
  }, [requestKey]);

  // Anything not yet answered for the current key counts as loading (no stale data flashes).
  if (result?.key !== requestKey) return { status: 'loading' };
  if (result.error) {
    return { status: 'error', error: result.error, retry: () => setAttempt((n) => n + 1) };
  }
  return { status: 'success', data: result.data as T };
}
