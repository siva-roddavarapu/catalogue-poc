import { Link, useParams } from 'react-router';
import type { Product } from '@catalogue/shared';
import { apiClient } from '../../api/client';
import { ProductGrid } from '../../components/ProductGrid/ProductGrid';
import { StatusMessage } from '../../components/StatusMessage/StatusMessage';
import { useApi } from '../../hooks/useApi';
import styles from './CategoryPage.module.css';

/** AC2: the owner's top-rated picks for a category, then the rest of that category. */
export function CategoryPage() {
  const { slug = '' } = useParams();
  const state = useApi(`category:${slug}`, () => apiClient.getCategoryProducts(slug));

  if (state.status === 'loading')
    return <StatusMessage kind="loading">Loading category…</StatusMessage>;

  if (state.status === 'error') {
    // 400 (malformed slug) and 404 (unknown slug) both mean "no such category" to a shopper.
    return [400, 404].includes(state.error.status) ? (
      <StatusMessage kind="empty">
        We couldn&apos;t find that category. <Link to="/">Back to the home page</Link>
      </StatusMessage>
    ) : (
      <StatusMessage kind="error" onRetry={state.retry}>
        {state.error.message}
      </StatusMessage>
    );
  }

  const { category, topRated, others } = state.data;
  return (
    <>
      <h1 className={styles.heading}>{category.name}</h1>
      {/* Uncurated categories have no top-rated section (DECISIONS A3). */}
      {topRated.length > 0 && (
        <ProductSection id="top-rated" title="Top rated" products={topRated} />
      )}
      {others.length > 0 ? (
        <ProductSection id="more" title="More in this category" products={others} />
      ) : (
        topRated.length === 0 && (
          <StatusMessage kind="empty">No products in this category yet.</StatusMessage>
        )
      )}
    </>
  );
}

function ProductSection({
  id,
  title,
  products,
}: {
  id: string;
  title: string;
  products: Product[];
}) {
  return (
    <section className={styles.section} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className={styles.sectionHeading}>
        {title}
      </h2>
      <ProductGrid products={products} />
    </section>
  );
}
