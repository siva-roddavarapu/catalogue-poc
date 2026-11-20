import { Link, NavLink, useSearchParams } from 'react-router';
import { apiClient } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { SearchBar } from '../SearchBar/SearchBar';
import styles from './Header.module.css';

/** Shown on every page: brand, category links (AC2) and the search bar (AC3). */
export function Header() {
  const categories = useApi('categories', apiClient.getCategories);
  const [searchParams] = useSearchParams();
  const currentTerm = searchParams.get('q') ?? '';

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          Catalogue
        </Link>
        <nav aria-label="Categories">
          {categories.status === 'loading' && <span className={styles.muted}>Loading…</span>}
          {categories.status === 'error' && (
            <span className={styles.muted} role="alert">
              Categories unavailable
            </span>
          )}
          {categories.status === 'success' && (
            <ul className={styles.categories}>
              {categories.data.map((category) => (
                <li key={category.slug}>
                  <NavLink
                    to={`/category/${category.slug}`}
                    className={({ isActive }) =>
                      `${styles.categoryLink} ${isActive ? styles.active : ''}`
                    }
                  >
                    {category.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </nav>
        <SearchBar initialTerm={currentTerm} />
      </div>
    </header>
  );
}
