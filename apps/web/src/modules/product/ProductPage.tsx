import { Link, useParams } from 'react-router';
import { productIdSchema } from '@catalogue/shared';
import { ApiClientError, apiClient } from '../../api/client';
import { StatusMessage } from '../../components/StatusMessage/StatusMessage';
import { useApi } from '../../hooks/useApi';
import { formatPrice } from '../../lib/formatPrice';
import styles from './ProductPage.module.css';

/** AC4: product details, reached by clicking a product tile. */
export function ProductPage() {
  const { id = '' } = useParams();
  const parsedId = productIdSchema.safeParse(id);

  const state = useApi(`product:${id}`, () =>
    parsedId.success
      ? apiClient.getProduct(parsedId.data)
      : Promise.reject(new ApiClientError(404, 'NOT_FOUND', 'Product not found')),
  );

  if (state.status === 'loading')
    return <StatusMessage kind="loading">Loading product…</StatusMessage>;

  if (state.status === 'error') {
    return state.error.status === 404 ? (
      <StatusMessage kind="empty">
        We couldn&apos;t find that product. <Link to="/">Back to the home page</Link>
      </StatusMessage>
    ) : (
      <StatusMessage kind="error" onRetry={state.retry}>
        {state.error.message}
      </StatusMessage>
    );
  }

  const product = state.data;
  return (
    <article className={styles.product}>
      <img className={styles.image} src={product.image} alt={product.title} />
      <div>
        <h1 className={styles.title}>{product.title}</h1>
        <p className={styles.price}>{formatPrice(product.price, product.currency)}</p>
        <p>
          Category: <Link to={`/category/${product.category.slug}`}>{product.category.name}</Link>
        </p>
        <p className={styles.description}>{product.description}</p>
        <Link className={styles.enquire} to={`/product/${product.id}/enquire`}>
          Enquire
        </Link>
      </div>
    </article>
  );
}
