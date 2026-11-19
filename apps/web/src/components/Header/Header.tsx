import { Link } from 'react-router';
import styles from './Header.module.css';

/** Shown on every page. Category links (AC2) and the search bar (AC3) are added in their slices. */
export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          Catalogue
        </Link>
      </div>
    </header>
  );
}
