import { Link } from 'react-router';
import type { Product } from '@catalogue/shared';
import { formatPrice } from '../../lib/formatPrice';
import styles from './ProductTile.module.css';

/** A clickable product card. Clicking it opens the product page (AC4). */
export function ProductTile({ product }: { product: Product }) {
  return (
    <Link to={`/product/${product.id}`} className={styles.tile}>
      {/* alt="" because the title is right below: a screen reader would otherwise read it twice. */}
      <img className={styles.image} src={product.image} alt="" loading="lazy" />
      <span className={styles.title}>{product.title}</span>
      <span className={styles.price}>{formatPrice(product.price, product.currency)}</span>
    </Link>
  );
}
