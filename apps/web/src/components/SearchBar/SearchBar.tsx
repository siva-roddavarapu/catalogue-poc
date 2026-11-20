import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { SEARCH_MAX_LENGTH } from '@catalogue/shared';
import styles from './SearchBar.module.css';

/**
 * AC3: a real <form>, so both the Search button and Enter submit it.
 * The button stays disabled until there is a non-blank term (the API rejects blank ones too).
 * Clearing the box on the results page (deleting the text, the ✕ button or Escape) returns to
 * the home page, so stale results never stay on screen (DECISIONS A21).
 */
export function SearchBar({ initialTerm = '' }: { initialTerm?: string }) {
  const [term, setTerm] = useState(initialTerm);

  // Follow the URL's term (new search, Back/Forward) WITHOUT remounting the input, so the
  // cursor stays in the box after searching. React's "adjust state when a prop changes" pattern.
  const [syncedTerm, setSyncedTerm] = useState(initialTerm);
  if (initialTerm !== syncedTerm) {
    setSyncedTerm(initialTerm);
    setTerm(initialTerm);
  }
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const trimmed = term.trim();

  function handleChange(value: string) {
    setTerm(value);
    if (!value.trim() && pathname === '/search') navigate('/');
  }

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
        onChange={(event) => handleChange(event.target.value)}
      />
      <button type="submit" className={styles.button} disabled={!trimmed}>
        Search
      </button>
    </form>
  );
}
