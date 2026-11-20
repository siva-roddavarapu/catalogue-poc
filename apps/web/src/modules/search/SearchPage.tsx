import { useSearchParams } from 'react-router';
import type { Product } from '@catalogue/shared';
import { apiClient } from '../../api/client';
import { ProductGrid } from '../../components/ProductGrid/ProductGrid';
import { StatusMessage } from '../../components/StatusMessage/StatusMessage';
import { useApi } from '../../hooks/useApi';
import styles from './SearchPage.module.css';

const NO_TERM: Product[] = [];

/** AC3: results for /search?q=… The matching itself happens server-side (CatalogueService.search). */
export function SearchPage() {
  const [searchParams] = useSearchParams();
  const term = (searchParams.get('q') ?? '').trim();

  // Hooks can't be conditional, so a blank term short-circuits without calling the API.
  const state = useApi(`search:${term}`, () =>
    term ? apiClient.searchProducts(term) : Promise.resolve(NO_TERM),
  );

  if (!term) {
    return <StatusMessage kind="empty">Enter a search term to find products.</StatusMessage>;
  }

  return (
    <section aria-labelledby="search-heading">
      <h1 id="search-heading" className={styles.heading}>
        Results for &ldquo;{term}&rdquo;
      </h1>
      {state.status === 'loading' && <StatusMessage kind="loading">Searching…</StatusMessage>}
      {state.status === 'error' && (
        <StatusMessage kind="error" onRetry={state.error.status === 400 ? undefined : state.retry}>
          {state.error.message}
        </StatusMessage>
      )}
      {state.status === 'success' &&
        (state.data.length > 0 ? (
          <>
            <p className={styles.count}>
              {state.data.length} {state.data.length === 1 ? 'product' : 'products'}
            </p>
            <ProductGrid products={state.data} />
          </>
        ) : (
          <StatusMessage kind="empty">No products match &lsquo;{term}&rsquo;.</StatusMessage>
        ))}
    </section>
  );
}
