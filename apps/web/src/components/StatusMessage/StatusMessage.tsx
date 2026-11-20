import type { ReactNode } from 'react';
import styles from './StatusMessage.module.css';

interface StatusMessageProps {
  kind: 'loading' | 'empty' | 'error';
  children: ReactNode;
  onRetry?: () => void;
}

/** The loading, empty and error states every data view needs, announced to screen readers. */
export function StatusMessage({ kind, children, onRetry }: StatusMessageProps) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`${styles.message} ${kind === 'error' ? styles.error : ''}`}
    >
      {children}
      {onRetry && (
        <button type="button" className={styles.retry} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
