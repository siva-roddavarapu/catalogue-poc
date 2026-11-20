import { apiClient } from '../../api/client';
import { ProductGrid } from '../../components/ProductGrid/ProductGrid';
import { StatusMessage } from '../../components/StatusMessage/StatusMessage';
import { useApi } from '../../hooks/useApi';
import styles from './HomePage.module.css';

/** AC1: the 5 products the owner chose as "top rated" (config/merchandising.json). */
export function HomePage() {
  const state = useApi('featured', apiClient.getFeatured);

  return (
    <section aria-labelledby="featured-heading">
      <h1 id="featured-heading" className={styles.heading}>
        Featured products
      </h1>
      {state.status === 'loading' && (
        <StatusMessage kind="loading">Loading featured products…</StatusMessage>
      )}
      {state.status === 'error' && (
        <StatusMessage kind="error" onRetry={state.retry}>
          {state.error.message}
        </StatusMessage>
      )}
      {state.status === 'success' &&
        (state.data.length > 0 ? (
          <ProductGrid products={state.data} />
        ) : (
          <StatusMessage kind="empty">No featured products right now.</StatusMessage>
        ))}
    </section>
  );
}
