import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { productIdSchema } from '@catalogue/shared';
import { ApiClientError, apiClient } from '../../api/client';
import { StatusMessage } from '../../components/StatusMessage/StatusMessage';
import { useApi } from '../../hooks/useApi';
import { formatPrice } from '../../lib/formatPrice';
import { EnquiryForm } from './EnquiryForm';
import styles from './EnquiryPage.module.css';

/** AC5: enquire about one product; the form is replaced by a thank-you message once sent. */
export function EnquiryPage() {
  const { id = '' } = useParams();
  const parsedId = productIdSchema.safeParse(id);
  const [sent, setSent] = useState(false);

  const state = useApi(`product:${id}`, () =>
    parsedId.success
      ? apiClient.getProduct(parsedId.data)
      : Promise.reject(new ApiClientError(404, 'NOT_FOUND', 'Product not found')),
  );

  if (state.status === 'loading') return <StatusMessage kind="loading">Loading…</StatusMessage>;
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

  if (sent) {
    return (
      <section className={styles.panel} role="status">
        <h1 className={`${styles.heading} ${styles.thanks}`}>Thank you</h1>
        <p>
          Your enquiry about <strong>{product.title}</strong> has been sent. Our sales team will be
          in touch soon.
        </p>
        <Link to={`/product/${product.id}`}>Back to the product</Link>
      </section>
    );
  }

  return (
    <section className={styles.panel} aria-labelledby="enquiry-heading">
      <h1 id="enquiry-heading" className={styles.heading}>
        Enquire about {product.title}
      </h1>
      <p className={styles.muted}>
        {formatPrice(product.price, product.currency)} · Leave your details and our sales team will
        get back to you.
      </p>
      <EnquiryForm productId={product.id} onSent={() => setSent(true)} />
    </section>
  );
}
