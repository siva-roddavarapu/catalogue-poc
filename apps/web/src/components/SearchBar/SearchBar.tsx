import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { SEARCH_MAX_LENGTH } from '@catalogue/shared';
import styles from './SearchBar.module.css';

/**
 * AC3: a real <form>, so both the Search button and Enter submit it.
 * The button stays disabled until there is a non-blank term (the API rejects blank ones too).
 */
export function SearchBar({ initialTerm = '' }: { initialTerm?: string }) {
  const [term, setTerm] = useState(initialTerm);
  const navigate = useNavigate();
  const trimmed = term.trim();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (trimmed) navigate(`/search?${new URLSearchParams({ q: trimmed }).toString()}`);
  }

  return (
    <form role="search" className={styles.form} onSubmit={handleSubmit}>
      <label htmlFor="search-term" className={styles.visuallyHidden}>
        Search products
      </label>
      <input
        id="search-term"
        type="search"
        className={styles.input}
        placeholder="Search products…"
        maxLength={SEARCH_MAX_LENGTH}
        value={term}
        onChange={(event) => setTerm(event.target.value)}
      />
      <button type="submit" className={styles.button} disabled={!trimmed}>
        Search
      </button>
    </form>
  );
}
